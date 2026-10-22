(function () {
  var app = document.getElementById("app");
  var entries = [];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function handle(r) {
    return r.json().catch(function () { return {}; }).then(function (d) {
      if (r.status === 401) { showLogin(); var ae = new Error("Sesi berakhir. Silakan masuk lagi."); ae.auth = true; throw ae; }
      if (!r.ok) throw new Error(d.error || "Terjadi kesalahan (" + r.status + ").");
      return d;
    });
  }
  function api(path, opt) {
    opt = opt || {};
    opt.headers = { "Content-Type": "application/json" };
    opt.credentials = "same-origin";
    return fetch("/api/admin/entries" + path, opt).then(handle);
  }
  function today() {
    return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  function fd(d) { var p = d.split("-"); return p[2] + "/" + p[1] + "/" + p[0]; }
  function msg(text, err) {
    var m = el("div", "msg" + (err ? " err" : ""), text);
    app.insertBefore(m, app.firstChild);
    setTimeout(function () { if (m.parentNode) m.remove(); }, 5000);
  }

  function showList(note) {
    app.replaceChildren();
    app.appendChild(el("p", "up", "Panel penulis"));
    app.appendChild(el("h1", null, "Tulisan"));
    if (note) msg(note);
    var bar = el("div", "adm-bar");
    bar.appendChild(el("span", "up", entries.length + " tulisan"));
    var nb = el("button", "btn", "+ Tulisan baru");
    nb.onclick = function () { showForm(null); };
    bar.appendChild(nb);
    app.appendChild(bar);
    if (!entries.length) app.appendChild(el("p", "empty", "Belum ada tulisan. Klik “+ Tulisan baru”."));
    entries.forEach(function (e) {
      var row = el("div", "adm-row");
      row.appendChild(el("span", "up", fd(e.date)));
      var mid = el("div");
      mid.appendChild(el("h2", null, e.title));
      var sm = el("small", "up");
      sm.appendChild(document.createTextNode(e.tag + (e.title_en && e.body_en ? " · ID + EN" : " · ID saja") + " · "));
      sm.appendChild(el("span", "st" + (e.published ? "" : " draft"), e.published ? "Terbit" : "Draf"));
      mid.appendChild(sm);
      row.appendChild(mid);
      var act = el("div", "adm-act");
      var eb = el("button", "btn", "Edit"); eb.onclick = function () { showForm(e); };
      var db = el("button", "btn", "Hapus");
      db.onclick = function () {
        if (!confirm("Hapus “" + e.title + "” secara permanen?")) return;
        api("/" + encodeURIComponent(e.id), { method: "DELETE" }).then(load.bind(null, "Tulisan dihapus.")).catch(function (x) { msg(x.message, true); });
      };
      act.appendChild(eb); act.appendChild(db);
      row.appendChild(act);
      app.appendChild(row);
    });
  }

  var MAX_PHOTO = 1000000, PHOTO_RE = /\[\[foto:([A-Za-z0-9_-]{6,40})\|([^\]\n]{0,200})\]\]/g;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  // Kecilkan ke JPEG maks. 1800 px (sekaligus membuang data lokasi EXIF) hingga muat ≤ 1 MB.
  function shrink(file) {
    if (!window.createImageBitmap) return Promise.reject(new Error("Browser ini belum mendukung unggah foto."));
    return createImageBitmap(file).then(function (bmp) {
      var s = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
      var c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(bmp.width * s)); c.height = Math.max(1, Math.round(bmp.height * s));
      var x = c.getContext("2d");
      x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(bmp, 0, 0, c.width, c.height);
      if (bmp.close) bmp.close();
      function enc(q) {
        return new Promise(function (ok) { c.toBlob(ok, "image/jpeg", q); }).then(function (b) {
          if (!b) throw new Error("Gagal memproses “" + file.name + "”.");
          if (b.size > MAX_PHOTO && q > 0.45) return enc(q - 0.1);
          if (b.size > MAX_PHOTO) throw new Error("“" + file.name + "” terlalu besar.");
          return b;
        });
      }
      return enc(0.86);
    }, function () { throw new Error("“" + file.name + "” bukan foto yang bisa dibaca (gunakan JPG, PNG, atau WebP)."); });
  }
  function uploadPhoto(file) {
    return shrink(file).then(function (blob) {
      return fetch("/api/admin/images", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "image/jpeg", "X-Filename": encodeURIComponent(file.name) }, body: blob
      }).then(handle);
    });
  }

  function field(label, input) {
    var l = el("label", "up", label);
    l.appendChild(input);
    return l;
  }
  // Untuk editor visual: jangan pakai <label>. Klik di dalam <label> diteruskan ke kontrol pertamanya
  // (tombol "H2"), sehingga setiap klik di area tulisan mengubah paragraf menjadi judul.
  function group(label, content) {
    var g = el("div", "fld");
    g.appendChild(el("span", "up", label));
    g.appendChild(content);
    return g;
  }

  // WYSIWYG ringan: isi tetap disimpan sebagai Markdown agar tulisan lama kompatibel.
  // Pemetaan judul di editor: "## " <-> <h2>, "### " <-> <h3>. (Situs publik merender "##" sebagai <h3> dan "###" sebagai <h4>,
  // karena <h1> dipakai untuk judul tulisan; di editor ukurannya cukup dibedakan secara visual.)
  function fmtInline(s) {
    return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1<em>$2</em>');
  }
  function mdEditorHtml(md) {
    function inline(src) {
      // Tautan dijadikan penanda dulu supaya tanda * atau _ di dalam alamat (mis. /a_b_c) tidak ikut diformat.
      var links = [];
      var s = esc(src).replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_, text, url) {
        links.push('<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + fmtInline(text) + '</a>');
        return "\uE000" + (links.length - 1) + "\uE001";
      });
      return fmtInline(s).replace(/\uE000(\d+)\uE001/g, function (_, i) { return links[+i]; });
    }
    return String(md || '').split(/\n{2,}/).map(function (block) {
      var t = block.trim(); if (!t) return '';
      var photo = t.match(/^\[\[foto:([A-Za-z0-9_-]{6,40})\|([^\]\n]{0,200})\]\]$/);
      if (photo) return '<p><span class="wys-photo" contenteditable="false" data-marker="' + esc(t) + '">📷 ' + esc(photo[2] || 'Foto') + ' <small>(foto)</small></span></p>';
      var h = t.match(/^(#{2,3})\s+([\s\S]*)$/);
      if (h) { var lv = h[1].length; return '<h' + lv + '>' + inline(h[2].replace(/\s*\n\s*/g, ' ')) + '</h' + lv + '>'; }
      if (/^>\s?/.test(t)) return '<blockquote>' + t.split('\n').map(function (l) { return inline(l.replace(/^>\s?/, '')); }).join('<br>') + '</blockquote>';
      var lines = t.split('\n');
      if (lines.every(function (l) { return /^\s*[-*+]\s+/.test(l); })) return '<ul>' + lines.map(function (l) { return '<li>' + inline(l.replace(/^\s*[-*+]\s+/, '')) + '</li>'; }).join('') + '</ul>';
      if (lines.every(function (l) { return /^\s*\d+[.)]\s+/.test(l); })) return '<ol>' + lines.map(function (l) { return '<li>' + inline(l.replace(/^\s*\d+[.)]\s+/, '')) + '</li>'; }).join('') + '</ol>';
      return '<p>' + lines.map(inline).join('<br>') + '</p>';
    }).join('');
  }
  var INLINE_TAG = /^(b|strong|i|em|u|s|strike|a|span|br|code|small|sup|sub|font|mark)$/;
  var BLOCK_TAG = /^(p|div|h[1-6]|blockquote|ul|ol|li)$/;
  function editorMarkdown(root) {
    // Pindahkan spasi di tepi ke luar penanda: "*kata *" tidak dikenali sebagai miring, "*kata* " dikenali.
    function wrap(mark, inside) {
      var m = inside.match(/^(\s*)([\s\S]*?)(\s*)$/);
      return m[2] ? m[1] + mark + m[2] + mark + m[3] : inside;
    }
    function kids(node) { return Array.prototype.map.call(node.childNodes, inlineNode).join(''); }
    function inlineNode(node) {
      if (node.nodeType === 3) return node.nodeValue.replace(/\u00a0/g, ' ');
      if (node.nodeType !== 1) return '';
      var tag = node.tagName.toLowerCase();
      if (node.classList.contains('wys-photo')) return node.getAttribute('data-marker') || '';
      if (tag === 'br') return '\n';
      var inside = kids(node);
      if (tag === 'strong' || tag === 'b') return wrap('**', inside);
      if (tag === 'em' || tag === 'i') return wrap('*', inside);
      if (tag === 'a') { var href = node.getAttribute('href') || ''; return /^https?:\/\//i.test(href) && inside.trim() ? '[' + inside.replace(/[\[\]\n]/g, ' ') + '](' + href.replace(/\s/g, '%20').replace(/\)/g, '%29') + ')' : inside; }
      if (BLOCK_TAG.test(tag)) return inside + '\n';
      return inside;
    }
    var out = [];
    // Satu paragraf = satu rangkaian simpul sebaris yang berurutan (teks, <b>, <i>, <a>, <br>), tidak dipecah per simpul.
    function walk(parent) {
      var run = '';
      function flush() { var t = run.replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n').trim(); if (t) out.push(t); run = ''; }
      Array.prototype.forEach.call(parent.childNodes, function (n) {
        if (n.nodeType === 3) { run += inlineNode(n); return; }
        if (n.nodeType !== 1) return;
        var tag = n.tagName.toLowerCase();
        if (n.classList.contains('wys-photo')) { flush(); out.push(n.getAttribute('data-marker') || ''); return; }
        if (INLINE_TAG.test(tag)) { run += inlineNode(n); return; }
        flush();
        if (/^h[1-6]$/.test(tag)) { var ht = kids(n).replace(/\s*\n\s*/g, ' ').trim(); if (ht) out.push((tag === 'h1' || tag === 'h2' ? '## ' : '### ') + ht); return; }
        if (tag === 'blockquote') {
          var q = kids(n).replace(/[ \t]+\n/g, '\n').replace(/\n+$/, '').trim();
          if (q) out.push(q.split('\n').map(function (x) { return '> ' + x; }).join('\n'));
          return;
        }
        if (tag === 'ul' || tag === 'ol') {
          var items = [];
          Array.prototype.forEach.call(n.children, function (li) {
            var lt = kids(li).replace(/\s*\n\s*/g, ' ').trim();
            if (lt) items.push((tag === 'ul' ? '- ' : (items.length + 1) + '. ') + lt);
          });
          if (items.length) out.push(items.join('\n'));
          return;
        }
        if (tag === 'p' || tag === 'div') { walk(n); return; }
        run += inlineNode(n);
      });
      flush();
    }
    walk(root);
    return out.join('\n\n').replace(/\n{3,}/g, '\n\n').slice(0, 50000);
  }
  // Blok tingkat-atas di dalam editor yang memuat simpul `node`.
  function topBlock(root, node) {
    while (node && node.parentNode !== root) node = node.parentNode;
    return node && node.nodeType === 1 ? node : null;
  }
  // Sisipkan penanda foto sebagai paragraf tersendiri di posisi kursor (paragraf dipecah di titik kursor).
  function insertPhotoBlock(root, range, html) {
    var tpl = document.createElement("template"); tpl.innerHTML = html;
    var photo = tpl.content.firstChild;
    var ref = range && root.contains(range.endContainer) ? topBlock(root, range.endContainer) : null;
    var tail = null;
    if (ref && /^(P|DIV)$/.test(ref.tagName)) {
      var r = document.createRange();
      r.setStart(range.endContainer, range.endOffset); r.setEnd(ref, ref.childNodes.length);
      var frag = r.extractContents();
      if (frag.textContent.trim() || frag.querySelector("img,.wys-photo")) { tail = document.createElement("p"); tail.appendChild(frag); }
    }
    if (!ref) root.appendChild(photo);
    else if (!ref.textContent.trim() && !ref.querySelector(".wys-photo")) root.replaceChild(photo, ref);
    else root.insertBefore(photo, ref.nextSibling);
    var next = tail;
    if (!next) { next = document.createElement("p"); next.appendChild(document.createElement("br")); }
    root.insertBefore(next, photo.nextSibling);
    var sel = window.getSelection(), nr = document.createRange();
    nr.setStart(next, 0); nr.collapse(true); sel.removeAllRanges(); sel.addRange(nr);
  }

  function showForm(e) {
    app.replaceChildren();
    app.appendChild(el("p", "up", e ? "Edit tulisan" : "Tulisan baru"));
    app.appendChild(el("h1", null, e ? e.title : "Tulis sesuatu"));
    var f = el("form", "frm");
    // Dua versi isi: Indonesia (wajib) dan English (opsional). Satu editor dipakai bergantian; isi tiap bahasa disimpan di S.
    var S = {
      id: { title: e ? e.title : "", tag: e ? e.tag : "Harian", body: e ? e.body : "" },
      en: { title: e ? e.title_en || "" : "", tag: e ? e.tag_en || "" : "", body: e ? e.body_en || "" : "" }
    };
    var cur = "id";
    var title = el("input"); title.type = "text"; title.required = true; title.maxLength = 120; title.value = S.id.title;
    var date = el("input"); date.type = "date"; date.required = true; date.value = e ? e.date : today();
    var tag = el("input"); tag.type = "text"; tag.required = true; tag.maxLength = 30; tag.value = S.id.tag;
    tag.setAttribute("list", "tags");
    var dl = el("datalist"); dl.id = "tags";
    var seen = {};
    ["Harian", "Perjalanan", "Refleksi", "Catatan"].concat(entries.map(function (x) { return x.tag; }), entries.map(function (x) { return x.tag_en; })).forEach(function (t) {
      if (!t || seen[t]) return; seen[t] = 1;
      var o = el("option"); o.value = t; dl.appendChild(o);
    });
    var st = el("select");
    [["1", "Terbit"], ["0", "Draf (tidak tampil di situs)"]].forEach(function (p) {
      var o = el("option", null, p[1]); o.value = p[0]; st.appendChild(o);
    });
    st.value = e && !e.published ? "0" : "1";
    var body = el("textarea"); body.maxLength = 50000; body.value = S.id.body;
    body.placeholder = "Isi jurnal"; body.hidden = true;
    var visual = el("div", "wysiwyg"); visual.id = "journal-editor"; visual.contentEditable = "true"; visual.setAttribute("role", "textbox"); visual.setAttribute("aria-multiline", "true"); visual.setAttribute("aria-label", "Isi jurnal"); visual.innerHTML = mdEditorHtml(body.value) || "<p><br></p>";
    visual.setAttribute("data-placeholder", "Mulai tulis jurnal Anda di sini…");

    var tabs = el("div", "chips lang-tabs"); tabs.setAttribute("role", "group"); tabs.setAttribute("aria-label", "Bahasa tulisan");
    var tabBtn = {};
    [["id", "Indonesia"], ["en", "English"]].forEach(function (p) {
      var b = el("button", "chip", p[1]); b.type = "button"; b.setAttribute("lang", p[0]);
      b.onclick = function () { showLang(p[0]); };
      tabBtn[p[0]] = b; tabs.appendChild(b);
    });
    f.appendChild(tabs);
    var enHint = el("div", "md-help"); enHint.hidden = true;
    enHint.appendChild(el("p", null, "Versi English bersifat opsional. Kosongkan judul dan isi jika belum ada terjemahan: pembaca yang memilih English akan melihat versi Indonesia. Kategori English boleh dikosongkan (memakai kategori Indonesia)."));
    var copyId = el("button", "btn md-tool", "Salin isi dari versi Indonesia"); copyId.type = "button";
    copyId.onclick = function () {
      if ((title.value.trim() || body.value.trim()) && !confirm("Ganti judul dan isi English dengan salinan dari versi Indonesia?")) return;
      title.value = S.id.title; body.value = S.id.body; visual.innerHTML = mdEditorHtml(body.value) || "<p><br></p>"; syncBody();
    };
    enHint.appendChild(copyId);
    f.appendChild(enHint);
    function filled(l) { var v = l === cur ? { title: title.value, body: body.value } : S[l]; return !!(v.title.trim() && v.body.trim()); }
    function updateTabs() {
      Object.keys(tabBtn).forEach(function (l) {
        tabBtn[l].setAttribute("aria-pressed", String(l === cur));
        tabBtn[l].textContent = (l === "id" ? "Indonesia" : "English") + (filled(l) ? " ✓" : "");
      });
    }
    function stash() { S[cur] = { title: title.value, tag: tag.value, body: editorMarkdown(visual) }; }
    function showLang(l) {
      if (l === cur) return;
      stash(); cur = l;
      title.value = S[l].title; tag.value = S[l].tag; body.value = S[l].body;
      title.required = tag.required = (l === "id");
      title.placeholder = l === "en" ? "English title (optional)" : ""; tag.placeholder = l === "en" ? "(sama dengan Indonesia)" : "";
      visual.setAttribute("data-placeholder", l === "en" ? "Write the English version here (optional)…" : "Mulai tulis jurnal Anda di sini…");
      visual.setAttribute("lang", l);
      visual.innerHTML = mdEditorHtml(body.value) || "<p><br></p>";
      enHint.hidden = l !== "en"; syncBody(); title.focus();
    }
    title.addEventListener("input", function () { updateTabs(); });
    f.appendChild(field("Judul", title));
    var two = el("div", "two");
    two.appendChild(field("Tanggal", date));
    var tl = field("Kategori", tag); tl.appendChild(dl); two.appendChild(tl);
    two.appendChild(field("Status", st));
    f.appendChild(two);
    var imp = el("input"); imp.type = "file";
    imp.accept = ".txt,.md,.markdown,.docx,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    imp.onchange = function () {
      var file = imp.files && imp.files[0];
      if (!file) return;
      window.ImportFile.read(file).then(function (r) {
        if (r.body.length > 50000) throw new Error("Isi berkas melebihi 50.000 karakter (" + r.body.length + ").");
        if (body.value.trim() && !confirm("Ganti isi tulisan yang sekarang dengan isi berkas ini?")) return;
        body.value = r.body; visual.innerHTML = mdEditorHtml(body.value) || "<p><br></p>"; syncBody();
        if (r.title && !title.value.trim()) title.value = r.title.slice(0, 120);
        msg("Berkas diimpor. Periksa dulu, lalu klik Simpan.");
      }).catch(function (x) { msg(x.message, true); })
        .then(function () { imp.value = ""; });
    };
    var editor = el("div", "md-editor");
    var toolbar = el("div", "md-toolbar"); toolbar.setAttribute("aria-label", "Pemformatan tulisan");
    var lastRange = null;
    function inEditor(sel) { return !!(sel && sel.rangeCount && visual.contains(sel.anchorNode)); }
    function saveRange() { var sel = window.getSelection(); if (inEditor(sel)) lastRange = sel.getRangeAt(0).cloneRange(); }
    function restoreRange() { if (!lastRange) return; var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(lastRange); }
    function caretIn(node, atEnd) { var r = document.createRange(), sel = window.getSelection(); r.selectNodeContents(node); r.collapse(!atEnd); sel.removeAllRanges(); sel.addRange(r); }
    function exec(cmd, val) { document.execCommand(cmd, false, val == null ? null : val); }
    function blockTag() { var sel = window.getSelection(); if (!inEditor(sel)) return ""; var b = topBlock(visual, sel.anchorNode); return b ? b.tagName.toLowerCase() : ""; }
    try { exec("styleWithCSS", false); } catch (_) {}

    // Menjalankan perubahan DOM manual sambil mempertahankan posisi kursor. Posisi dicatat SEBELUM simpul dipindah
    // (memindahkan simpul membuat seleksi runtuh ke induknya); `fn` mengembalikan simpul cadangan jika kursor tak bisa dipulihkan.
    function keepCaret(fn) {
      var sel = window.getSelection(), an = sel.anchorNode, ao = sel.anchorOffset;
      var fallback = fn();
      if (an && an.nodeType === 3 && visual.contains(an)) {
        var r = document.createRange(); r.setStart(an, Math.min(ao, an.nodeValue.length)); r.collapse(true);
        sel.removeAllRanges(); sel.addRange(r);
      } else if (fallback) caretIn(fallback, true);
    }
    function doBold() { if (/^h[1-6]$/.test(blockTag())) return; exec("bold"); } // judul sudah tebal; "tebal" di judul hanya menambah gaya sebaris yang tak berguna
    function doHeading() { exec("formatBlock", blockTag() === "h2" ? "<p>" : "<h2>"); }
    function emptyFix(node) { if (!node.firstChild) node.appendChild(document.createElement("br")); return node; }
    // Blok tingkat-atas tempat kursor berada; teks yang menggantung di akar editor dibungkus <p> dulu.
    function currentBlock() {
      var sel = window.getSelection(); if (!inEditor(sel)) return null;
      var ref = topBlock(visual, sel.anchorNode);
      if (!ref) { exec("formatBlock", "<p>"); sel = window.getSelection(); ref = inEditor(sel) ? topBlock(visual, sel.anchorNode) : null; }
      return ref;
    }
    // Kutipan dibuat/dilepas manual (formatBlock tidak bisa melepas <blockquote> dan sering membuat <blockquote><div>…).
    function doQuote() {
      var ref = currentBlock(); if (!ref) return;
      var tag = ref.tagName;
      if (tag === "BLOCKQUOTE") {
        keepCaret(function () {
          var frag = document.createDocumentFragment();
          var hasBlock = Array.prototype.some.call(ref.children, function (c) { return BLOCK_TAG.test(c.tagName.toLowerCase()); });
          if (hasBlock) { while (ref.firstChild) frag.appendChild(ref.firstChild); }
          else { var p = document.createElement("p"); while (ref.firstChild) p.appendChild(ref.firstChild); frag.appendChild(emptyFix(p)); }
          var first = frag.firstChild; visual.replaceChild(frag, ref); return first;
        });
      } else if (/^(P|DIV|H[1-6])$/.test(tag)) {
        keepCaret(function () {
          var bq = document.createElement("blockquote");
          while (ref.firstChild) bq.appendChild(ref.firstChild);
          visual.replaceChild(emptyFix(bq), ref); return bq;
        });
      }
    }
    // Daftar dibuat/dilepas manual: execCommand("insertUnorderedList") di Chrome menyisipkan <ul> di dalam <p>
    // dan melempar kursor ke awal baris.
    function doList(kind) {
      var ref = currentBlock(); if (!ref) return;
      var tag = ref.tagName;
      if (tag === "UL" || tag === "OL") {
        keepCaret(function () {
          var frag = document.createDocumentFragment(), made = null;
          if (tag.toLowerCase() === kind) { // tekan lagi = lepas daftar, tiap butir jadi paragraf
            Array.prototype.slice.call(ref.children).forEach(function (li) {
              var p = document.createElement("p");
              while (li.firstChild) p.appendChild(li.firstChild);
              frag.appendChild(emptyFix(p)); made = made || p;
            });
          } else { // bullet <-> nomor
            made = document.createElement(kind);
            while (ref.firstChild) made.appendChild(ref.firstChild);
            frag.appendChild(made);
          }
          visual.replaceChild(frag, ref); return made;
        });
      } else if (/^(P|DIV|H[1-6]|BLOCKQUOTE)$/.test(tag)) {
        keepCaret(function () {
          var list = document.createElement(kind), li = document.createElement("li");
          var kidsNow = Array.prototype.slice.call(ref.childNodes);
          var isBlk = function (c) { return c.nodeType === 1 && BLOCK_TAG.test(c.tagName.toLowerCase()); };
          var hasBlock = kidsNow.some(isBlk);
          function flushLi() { list.appendChild(emptyFix(li)); li = document.createElement("li"); }
          kidsNow.forEach(function (c) {
            if (hasBlock && isBlk(c)) { while (c.firstChild) li.appendChild(c.firstChild); flushLi(); }
            else if (!hasBlock && c.nodeType === 1 && c.tagName === "BR") { if (li.firstChild) flushLi(); } // satu baris = satu butir
            else li.appendChild(c);
          });
          if (li.firstChild || !list.firstChild) flushLi();
          visual.replaceChild(list, ref); return list.lastChild;
        });
      }
    }
    function doLink() {
      var sel = window.getSelection(); if (!inEditor(sel)) return;
      var saved = sel.getRangeAt(0).cloneRange();
      var u = prompt("Masukkan alamat tautan (https://…):");
      if (!u) return;
      u = u.trim();
      if (!/^https?:\/\//i.test(u)) { msg("Tautan harus diawali http:// atau https://", true); return; }
      u = u.replace(/\s/g, "%20").replace(/\)/g, "%29");
      visual.focus(); sel.removeAllRanges(); sel.addRange(saved);
      if (saved.collapsed) exec("insertHTML", '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(u) + "</a>");
      else exec("createLink", u);
    }
    function tool(label, title, action) {
      var b = el("button", "btn md-tool", label); b.type = "button"; b.title = title;
      b.onclick = function () {
        if (!inEditor(window.getSelection())) restoreRange();
        visual.focus(); action(); syncBody(); saveRange();
      };
      toolbar.appendChild(b);
    }
    // Tombol toolbar tidak boleh merebut fokus/seleksi dari editor (kalau tidak, format diterapkan di tempat yang salah).
    toolbar.addEventListener("mousedown", function (ev) { ev.preventDefault(); });
    tool("H2", "Judul bagian", doHeading);
    tool("B", "Tebal", doBold);
    tool("I", "Miring", function () { exec("italic"); });
    tool("Kutipan", "Kutipan", doQuote);
    tool("• Daftar", "Daftar berpoin", function () { doList("ul"); });
    tool("1. Daftar", "Daftar bernomor", function () { doList("ol"); });
    tool("Tautan", "Sisipkan tautan", doLink);
    tool("¶ Paragraf", "Paragraf biasa", function () {
      if (blockTag() === "blockquote") doQuote(); else exec("formatBlock", "<p>");
    });
    var help=el("details","md-help"); help.appendChild(el("summary",null,"Panduan format tulisan"));
    var helpText=el("div","md-help-content"); helpText.innerHTML='<p>Gunakan tombol di atas untuk memformat tulisan secara visual. Isi disimpan sebagai Markdown agar tulisan lama tetap kompatibel.</p><p>Anda dapat menempel teks biasa, memilih teks lalu menekan Tebal/Miring, membuat judul, kutipan, daftar, dan tautan. Foto yang disisipkan akan tetap tersimpan sebagai bagian dari jurnal.</p>';
    help.appendChild(helpText);
    editor.appendChild(toolbar); editor.appendChild(help); editor.appendChild(visual); editor.appendChild(body);
    f.appendChild(group("Isi tulisan", editor));
    function syncBody(){body.value=editorMarkdown(visual); visual.classList.toggle("blank",!body.value.trim()); drawThumbs(); updateTabs();}
    visual.addEventListener("input",function(){syncBody();saveRange();});
    ["keyup","mouseup","touchend","blur"].forEach(function(n){visual.addEventListener(n,saveRange)});
    visual.addEventListener("paste",function(ev){ev.preventDefault();var txt=(ev.clipboardData||window.clipboardData).getData("text/plain");exec("insertText",txt);syncBody();});
    visual.addEventListener("keydown",function(ev){if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==="b"){ev.preventDefault();doBold();syncBody()}else if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==="i"){ev.preventDefault();exec("italic");syncBody()}});

    var thumbs = el("div", "thumbs");
    function drawThumbs() {
      thumbs.replaceChildren();
      var m, n = 0; PHOTO_RE.lastIndex = 0;
      while ((m = PHOTO_RE.exec(body.value))) {
        n++;
        var fig = el("figure");
        var im = el("img"); im.src = "/foto/" + m[1]; im.alt = m[2]; im.loading = "lazy";
        fig.appendChild(im); fig.appendChild(el("figcaption", null, m[2] || "(tanpa keterangan)"));
        thumbs.appendChild(fig);
      }
      thumbs.hidden = !n;
    }

    var pic = el("input"); pic.type = "file"; pic.multiple = true;
    pic.accept = "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif";
    pic.onchange = function () {
      var files = Array.prototype.slice.call(pic.files || []);
      if (!files.length) return;
      pic.disabled = true;
      var done = 0;
      files.reduce(function (p, file) {
        return p.then(function () {
          return uploadPhoto(file).then(function (r) {
            // Sisipkan di posisi kursor, sebagai paragraf sendiri (paragraf yang sedang ditulis dipecah di titik kursor).
            var sel = window.getSelection();
            var rng = inEditor(sel) ? sel.getRangeAt(0).cloneRange() : lastRange;
            var markerHtml = '<p><span class="wys-photo" contenteditable="false" data-marker="' + esc(r.marker) + '">📷 ' + esc(r.caption || file.name) + ' <small>(foto)</small></span></p>';
            visual.focus();
            insertPhotoBlock(visual, rng, markerHtml); saveRange();
            syncBody(); done++;
          });
        });
      }, Promise.resolve()).then(function () {
        msg(done + " foto ditambahkan ke editor jurnal.");
      }).catch(function (x) { msg(x.message, true); })
        .then(function () { pic.value = ""; pic.disabled = false; drawThumbs(); });
    };
    f.appendChild(field("Sisipkan foto (JPG, PNG, WebP) — muncul di posisi kursor dengan keterangan sesuai nama berkas", pic));
    f.appendChild(thumbs);
    syncBody();
    f.appendChild(field("Impor dari berkas (.txt, .md, .docx) — mengisi kolom di atas, belum tersimpan", imp));
    var row = el("div", "row");
    var save = el("button", "btn", "Simpan"); save.type = "submit";
    var cancel = el("button", "btn", "Batal"); cancel.type = "button";
    cancel.onclick = function () { showList(); };
    row.appendChild(save); row.appendChild(cancel);
    f.appendChild(row);

    f.onsubmit = function (ev) {
      ev.preventDefault();
      syncBody();
      stash();
      if (!S.id.title.trim() || !S.id.tag.trim()) { showLang("id"); msg("Judul dan kategori (Indonesia) wajib diisi.", true); title.focus(); return; }
      if (!S.id.body.trim()) { showLang("id"); msg("Isi tulisan (Indonesia) tidak boleh kosong.", true); visual.focus(); return; }
      if (!!S.en.title.trim() !== !!S.en.body.trim()) { showLang("en"); msg("Versi English harus punya judul dan isi, atau kosongkan keduanya.", true); return; }
      save.disabled = true;
      var data = {
        title: S.id.title, date: date.value, tag: S.id.tag, body: S.id.body, published: +st.value,
        title_en: S.en.title, tag_en: S.en.tag, body_en: S.en.body
      };
      var req = e
        ? api("/" + encodeURIComponent(e.id), { method: "PUT", body: JSON.stringify(data) })
        : api("", { method: "POST", body: JSON.stringify(data) });
      req.then(function () { return load("Tulisan disimpan."); })
        .catch(function (x) { save.disabled = false; msg(x.message, true); });
    };
    app.appendChild(f);
    title.focus();
  }

  function load(note) {
    return api("").then(function (d) { entries = d; showList(note); })
      .catch(function (x) {
        if (x.auth) return;
        app.replaceChildren(el("div", "msg err", "Tidak bisa memuat: " + x.message));
      });
  }

  function showLogin() {
    app.replaceChildren();
    app.appendChild(el("p", "up", "Panel penulis"));
    app.appendChild(el("h1", null, "Masuk"));
    var f = el("form", "frm");
    var pw = el("input"); pw.type = "password"; pw.required = true; pw.autocomplete = "current-password";
    var btn = el("button", "btn", "Masuk"); btn.type = "submit";
    f.appendChild(field("Kata sandi", pw));
    var row = el("div", "row"); row.appendChild(btn); f.appendChild(row);
    f.onsubmit = function (ev) {
      ev.preventDefault();
      btn.disabled = true;
      fetch("/api/login", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw.value }) })
        .then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) throw new Error(d.error || "Gagal masuk."); });
        })
        .then(function () { return load(); })
        .catch(function (x) { btn.disabled = false; pw.value = ""; msg(x.message, true); });
    };
    app.appendChild(f);
    pw.focus();
  }

  document.getElementById("logout").onclick = function () {
    fetch("/api/logout", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: "{}" })
      .then(function () { entries = []; showLogin(); });
  };

  fetch("/api/session", { credentials: "same-origin" }).then(function (r) {
    if (r.ok) return load();
    return r.json().catch(function () { return {}; }).then(function (d) {
      if (r.status === 503) app.replaceChildren(el("div", "msg err", d.error || "Admin belum dikonfigurasi."));
      else showLogin();
    });
  }).catch(function () { app.replaceChildren(el("div", "msg err", "Tidak bisa terhubung ke server.")); });
})();
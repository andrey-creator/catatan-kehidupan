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
      sm.appendChild(document.createTextNode(e.tag + " · "));
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

  // WYSIWYG ringan: isi tetap disimpan sebagai Markdown agar tulisan lama kompatibel.
  function mdEditorHtml(md) {
    function inline(src) {
      return esc(src).replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
        .replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1<em>$2</em>');
    }
    return String(md || '').split(/\n{2,}/).map(function (block) {
      var t = block.trim(); if (!t) return '';
      var photo = t.match(/^\[\[foto:([A-Za-z0-9_-]{6,40})\|([^\]\n]{0,200})\]\]$/);
      if (photo) return '<p><span class="wys-photo" contenteditable="false" data-marker="'+esc(t)+'">📷 '+esc(photo[2] || 'Foto')+' <small>(foto)</small></span></p>';
      var h = t.match(/^#{2,3}\s+([\s\S]*)$/); if (h) return '<h'+(t.match(/^#+/)[0].length+1)+'>'+inline(h[1])+'</h'+(t.match(/^#+/)[0].length+1)+'>';
      if (/^>\s?/.test(t)) return '<blockquote>'+t.split('\n').map(function(l){return inline(l.replace(/^>\s?/,''))}).join('<br>')+'</blockquote>';
      var lines=t.split('\n');
      if(lines.every(function(l){return /^\s*[-*+]\s+/.test(l)})) return '<ul>'+lines.map(function(l){return '<li>'+inline(l.replace(/^\s*[-*+]\s+/,''))+'</li>'}).join('')+'</ul>';
      if(lines.every(function(l){return /^\s*\d+[.)]\s+/.test(l)})) return '<ol>'+lines.map(function(l){return '<li>'+inline(l.replace(/^\s*\d+[.)]\s+/,''))+'</li>'}).join('')+'</ol>';
      return '<p>'+lines.map(inline).join('<br>')+'</p>';
    }).join('');
  }
  function editorMarkdown(root) {
    function inlineNode(node) {
      if(node.nodeType===3) return node.nodeValue.replace(/\u00a0/g,' ');
      if(node.nodeType!==1) return '';
      var tag=node.tagName.toLowerCase();
      if(node.classList.contains('wys-photo')) return node.getAttribute('data-marker') || '';
      var inside=Array.prototype.map.call(node.childNodes,inlineNode).join('');
      if(tag==='strong'||tag==='b') return '**'+inside+'**';
      if(tag==='em'||tag==='i') return '*'+inside+'*';
      if(tag==='a') { var href=node.getAttribute('href')||''; return /^https?:\/\//i.test(href) ? '['+inside+']('+href+')' : inside; }
      if(tag==='br') return '\n';
      return inside;
    }
    function block(node) {
      if(node.nodeType===3) return node.nodeValue.trim() ? node.nodeValue : '';
      if(node.nodeType!==1) return '';
      var tag=node.tagName.toLowerCase();
      if(tag==='div' && node.classList.contains('wys-photo')) return node.getAttribute('data-marker')||'';
      if(/^h[2-4]$/.test(tag)) return (tag==='h2'?'## ':tag==='h3'?'### ':'#### ')+Array.prototype.map.call(node.childNodes,inlineNode).join('');
      if(tag==='blockquote') return Array.prototype.map.call(node.childNodes,inlineNode).join('').split('\n').map(function(x){return '> '+x}).join('\n');
      if(tag==='ul'||tag==='ol') return Array.prototype.map.call(node.children,function(li,i){return (tag==='ul'?'- ': (i+1)+'. ')+Array.prototype.map.call(li.childNodes,inlineNode).join('').trim()}).join('\n');
      if(tag==='p'||tag==='div') {
        if(node.querySelector('.wys-photo')) { var ph=node.querySelector('.wys-photo'); return ph.getAttribute('data-marker')||''; }
        return Array.prototype.map.call(node.childNodes,inlineNode).join('').trim();
      }
      return Array.prototype.map.call(node.childNodes,inlineNode).join('');
    }
    return Array.prototype.map.call(root.childNodes,block).filter(function(x){return x!==''}).join('\n\n').replace(/\n{3,}/g,'\n\n').slice(0,50000);
  }
  function placeAtCursor(html) {
    var sel=window.getSelection(); if(!sel || !sel.rangeCount) return false;
    var range=sel.getRangeAt(0); if(!document.getElementById('journal-editor').contains(range.commonAncestorContainer)) return false;
    range.deleteContents(); var frag=range.createContextualFragment(html); var last=frag.lastChild; range.insertNode(frag);
    if(last){range.setStartAfter(last);range.collapse(true);sel.removeAllRanges();sel.addRange(range)} return true;
  }

  function showForm(e) {
    app.replaceChildren();
    app.appendChild(el("p", "up", e ? "Edit tulisan" : "Tulisan baru"));
    app.appendChild(el("h1", null, e ? e.title : "Tulis sesuatu"));
    var f = el("form", "frm");
    var title = el("input"); title.type = "text"; title.required = true; title.maxLength = 120; title.value = e ? e.title : "";
    var date = el("input"); date.type = "date"; date.required = true; date.value = e ? e.date : today();
    var tag = el("input"); tag.type = "text"; tag.required = true; tag.maxLength = 30; tag.value = e ? e.tag : "Harian";
    tag.setAttribute("list", "tags");
    var dl = el("datalist"); dl.id = "tags";
    var seen = {};
    ["Harian", "Perjalanan", "Refleksi", "Catatan"].concat(entries.map(function (x) { return x.tag; })).forEach(function (t) {
      if (seen[t]) return; seen[t] = 1;
      var o = el("option"); o.value = t; dl.appendChild(o);
    });
    var st = el("select");
    [["1", "Terbit"], ["0", "Draf (tidak tampil di situs)"]].forEach(function (p) {
      var o = el("option", null, p[1]); o.value = p[0]; st.appendChild(o);
    });
    st.value = e && !e.published ? "0" : "1";
    var body = el("textarea"); body.required = true; body.maxLength = 50000; body.value = e ? e.body : "";
    body.placeholder = "Isi jurnal"; body.hidden = true;
    var visual = el("div", "wysiwyg"); visual.id = "journal-editor"; visual.contentEditable = "true"; visual.setAttribute("role", "textbox"); visual.setAttribute("aria-multiline", "true"); visual.setAttribute("aria-label", "Isi jurnal"); visual.innerHTML = mdEditorHtml(body.value);
    visual.setAttribute("data-placeholder", "Mulai tulis jurnal Anda di sini…");

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
        body.value = r.body; visual.innerHTML = mdEditorHtml(body.value); drawThumbs();
        if (r.title && !title.value.trim()) title.value = r.title.slice(0, 120);
        msg("Berkas diimpor. Periksa dulu, lalu klik Simpan.");
      }).catch(function (x) { msg(x.message, true); })
        .then(function () { imp.value = ""; });
    };
    var editor = el("div", "md-editor");
    var toolbar = el("div", "md-toolbar"); toolbar.setAttribute("aria-label", "Pemformatan tulisan");
    function tool(label, title, action) {
      var b=el("button","btn md-tool",label); b.type="button"; b.title=title; b.onclick=function(){visual.focus();action();syncBody();}; toolbar.appendChild(b);
    }
    tool("H2", "Judul bagian", function(){document.execCommand("formatBlock",false,"h2")});
    tool("B", "Tebal", function(){document.execCommand("bold",false,null)});
    tool("I", "Miring", function(){document.execCommand("italic",false,null)});
    tool("Kutipan", "Kutipan", function(){document.execCommand("formatBlock",false,"blockquote")});
    tool("• Daftar", "Daftar berpoin", function(){document.execCommand("insertUnorderedList",false,null)});
    tool("1. Daftar", "Daftar bernomor", function(){document.execCommand("insertOrderedList",false,null)});
    tool("Tautan", "Sisipkan tautan", function(){var u=prompt("Masukkan alamat tautan (https://…):");if(u&&/^https?:\/\//i.test(u))document.execCommand("createLink",false,u);else if(u)msg("Tautan harus diawali http:// atau https://",true)});
    tool("¶ Paragraf", "Paragraf biasa", function(){document.execCommand("formatBlock",false,"p")});
    var help=el("details","md-help"); help.appendChild(el("summary",null,"Panduan format tulisan"));
    var helpText=el("div","md-help-content"); helpText.innerHTML='<p>Gunakan tombol di atas untuk memformat tulisan secara visual. Isi disimpan sebagai Markdown agar tulisan lama tetap kompatibel.</p><p>Anda dapat menempel teks biasa, memilih teks lalu menekan Tebal/Miring, membuat judul, kutipan, daftar, dan tautan. Foto yang disisipkan akan tetap tersimpan sebagai bagian dari jurnal.</p>';
    help.appendChild(helpText);
    editor.appendChild(toolbar); editor.appendChild(help); editor.appendChild(visual); editor.appendChild(body);
    f.appendChild(field("Isi tulisan", editor));
    function syncBody(){body.value=editorMarkdown(visual); drawThumbs();}
    visual.addEventListener("input",syncBody);
    visual.addEventListener("paste",function(ev){ev.preventDefault();var txt=(ev.clipboardData||window.clipboardData).getData("text/plain");document.execCommand("insertText",false,txt);syncBody();});
    visual.addEventListener("keydown",function(ev){if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==="b"){ev.preventDefault();document.execCommand("bold",false,null)}else if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==="i"){ev.preventDefault();document.execCommand("italic",false,null)}});

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
            // Sisipkan di posisi kursor, sebagai paragraf sendiri.
            visual.focus();
            var markerHtml='<p><span class="wys-photo" contenteditable="false" data-marker="'+esc(r.marker)+'">📷 '+esc(r.caption || file.name)+' <small>(foto)</small></span></p><p><br></p>';
            if(!placeAtCursor(markerHtml)){visual.insertAdjacentHTML("beforeend",markerHtml)}
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
      save.disabled = true;
      var data = { title: title.value, date: date.value, tag: tag.value, body: body.value, published: +st.value };
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

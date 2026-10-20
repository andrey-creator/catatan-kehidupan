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
    body.placeholder = "Pisahkan paragraf dengan baris kosong. Tautan: tempel alamat https://… atau tulis [teks](https://…).";

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
        body.value = r.body;
        if (r.title && !title.value.trim()) title.value = r.title.slice(0, 120);
        msg("Berkas diimpor. Periksa dulu, lalu klik Simpan.");
      }).catch(function (x) { msg(x.message, true); })
        .then(function () { imp.value = ""; });
    };
    f.appendChild(field("Isi tulisan", body));

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
    body.addEventListener("input", drawThumbs);
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
            var pos = body.selectionStart == null ? body.value.length : body.selectionStart;
            var before = body.value.slice(0, pos).replace(/\s+$/, ""), after = body.value.slice(pos).replace(/^\s+/, "");
            body.value = before + (before ? "\n\n" : "") + r.marker + (after ? "\n\n" : "") + after;
            var np = (before ? before.length + 2 : 0) + r.marker.length + (after ? 2 : 0);
            body.setSelectionRange(np, np);
            done++;
          });
        });
      }, Promise.resolve()).then(function () {
        msg(done + " foto ditambahkan. Keterangan = nama berkas; bisa diubah langsung di antara “|” dan “]]”.");
      }).catch(function (x) { msg(x.message, true); })
        .then(function () { pic.value = ""; pic.disabled = false; drawThumbs(); });
    };
    f.appendChild(field("Sisipkan foto (JPG, PNG, WebP) — muncul di posisi kursor dengan keterangan sesuai nama berkas", pic));
    f.appendChild(thumbs);
    drawThumbs();
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

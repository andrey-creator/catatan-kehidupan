/* Kenyamanan membaca: pengaturan huruf, bilah progres, sisa waktu baca, menu yang menyingkir saat menggulir,
   "lanjutkan membaca", dan pembesar foto. Semua pilihan disimpan di browser pembaca (localStorage).
   Pengaturan dipasang lewat atribut data-* di <html>; ukuran/warnanya ada di styles.css (blok "Pembaca").
   Dimuat di <head> (tanpa defer) agar pengaturan terpasang sebelum halaman tergambar. */
(function () {
  var KEY = "baca-catatan", POS = "baca-posisi", WPM = 200;
  var root = document.documentElement;
  var DEF = { fs: 3, ff: "serif", lh: "normal", wd: "sedang", dc: 1, fm: 1 };
  var OPT = {
    fs: [1, 2, 3, 4, 5], ff: ["serif", "sans"], lh: ["rapat", "normal", "lega"], wd: ["sempit", "sedang", "lebar"], dc: [0, 1], fm: [0, 1]
  };
  var S = load();

  function load() {
    var s = {}, k;
    try { s = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { s = {}; }
    for (k in DEF) if (OPT[k].indexOf(s[k]) < 0) s[k] = DEF[k];
    return s;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* mode privat: berlaku selama halaman terbuka */ } }
  function apply() { for (var k in S) root.setAttribute("data-" + k, String(S[k])); }
  apply();

  /* ---------- posisi baca ---------- */
  function readPos() { try { return JSON.parse(localStorage.getItem(POS)) || {}; } catch (e) { return {}; } }
  function writePos(m) {
    var keys = Object.keys(m);
    if (keys.length > 40) {
      keys.sort(function (a, b) { return m[a].t - m[b].t; });
      keys.slice(0, keys.length - 40).forEach(function (k) { delete m[k]; });
    }
    try { localStorage.setItem(POS, JSON.stringify(m)); } catch (e) { /* abaikan */ }
  }

<<<<<<< HEAD
=======
  var tt = function (k, v) { return window.I18N ? I18N.tt(k, v) : k; };
>>>>>>> 11126f3 (ideng)
  var nav, btn, panel, bar, fill, hud, left, toTop, toast, lastY = 0, ticking = false, words = 0, lastSave = 0, panelOpen = false;
  var lbOpener = null;

  function article() { var a = document.querySelector("main article"); return a && a.querySelector(".body") ? a : null; }
  function bodyEl() { var a = article(); return a && a.querySelector(".body"); }
  function isEntry() { var a = article(); return !!a && !a.classList.contains("about"); }

  function geom() {
    var b = bodyEl(); if (!b) return null;
    var r = b.getBoundingClientRect(), top = r.top + window.pageYOffset;
    var span = Math.max(1, b.offsetHeight - window.innerHeight * 0.6);
    return { top: top, span: span };
  }
  function progress() {
    var g = geom(); if (!g) return 0;
    var p = (window.pageYOffset - g.top) / g.span;
    return p < 0 ? 0 : p > 1 ? 1 : p;
  }

  function update() {
    ticking = false;
    var y = window.pageYOffset, on = isEntry();
    if (!on) {
      bar.classList.remove("on"); hud.classList.remove("on"); nav.classList.remove("rd-hide");
      return;
    }
    var p = progress();
    bar.classList.add("on");
    fill.style.transform = "scaleX(" + p.toFixed(4) + ")";
    var mins = Math.ceil(words * (1 - p) / WPM);
<<<<<<< HEAD
    left.textContent = p >= 0.985 ? "Selesai ✓" : (mins <= 1 ? "kurang dari 1 mnt lagi" : mins + " mnt lagi");
=======
    left.textContent = p >= 0.985 ? tt("rd_done") : (mins <= 1 ? tt("rd_left_lt1") : tt("rd_left", { n: mins }));
>>>>>>> 11126f3 (ideng)
    hud.classList.toggle("on", y > 500);
    if (y > 200 && !toast.hidden) hideToast();

    /* menu menyingkir saat menggulir ke bawah, muncul lagi saat ke atas */
    if (!S.fm || panelOpen || y < 160 || y < lastY - 4) nav.classList.remove("rd-hide");
    else if (y > lastY + 4) nav.classList.add("rd-hide");
    lastY = y;

    /* simpan posisi (maks. 2x per detik) */
    var now = Date.now();
    if (now - lastSave > 500 && p > 0.04) {
      lastSave = now;
      var m = readPos();
      if (p >= 0.97) delete m[location.pathname]; else m[location.pathname] = { p: +p.toFixed(4), t: now };
      writePos(m);
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  /* ---------- panel pengaturan ---------- */
  function seg(key, label, items, cls) {
    var row = document.createElement("div"); row.className = "rd-row";
    var l = document.createElement("span"); l.className = "up"; l.textContent = label; row.appendChild(l);
    var g = document.createElement("div"); g.className = "rd-seg " + (cls || ""); g.setAttribute("role", "group"); g.setAttribute("aria-label", label);
    items.forEach(function (it) {
      var b = document.createElement("button"); b.type = "button";
      b.textContent = it[1]; if (it[2]) b.setAttribute("aria-label", it[2]);
      b.setAttribute("aria-pressed", String(S[key] === it[0]));
      b.onclick = function () {
        S[key] = it[0]; save(); apply();
        Array.prototype.forEach.call(g.children, function (x, i) { x.setAttribute("aria-pressed", String(items[i][0] === S[key])); });
        onScroll();
      };
      g.appendChild(b);
    });
    row.appendChild(g); return row;
  }
  function sw(key, label) {
    var b = document.createElement("button"); b.type = "button"; b.className = "rd-sw";
    b.setAttribute("role", "switch"); b.setAttribute("aria-checked", String(!!S[key]));
    b.innerHTML = '<span></span><i aria-hidden="true"></i>'; b.firstChild.textContent = label;
    b.onclick = function () { S[key] = S[key] ? 0 : 1; save(); apply(); b.setAttribute("aria-checked", String(!!S[key])); nav.classList.remove("rd-hide"); onScroll(); };
    return b;
  }
  function buildPanel() {
    panel = document.createElement("div");
<<<<<<< HEAD
    panel.className = "rd-panel"; panel.hidden = true; panel.setAttribute("role", "group"); panel.setAttribute("aria-label", "Pengaturan membaca");
    panel.appendChild(seg("fs", "Ukuran huruf", [[1, "A", "Sangat kecil"], [2, "A", "Kecil"], [3, "A", "Sedang"], [4, "A", "Besar"], [5, "A", "Sangat besar"]], "fs"));
    panel.appendChild(seg("ff", "Jenis huruf", [["serif", "Serif"], ["sans", "Sans"]], "ff"));
    panel.appendChild(seg("lh", "Jarak baris", [["rapat", "Rapat"], ["normal", "Normal"], ["lega", "Lega"]]));
    panel.appendChild(seg("wd", "Lebar teks", [["sempit", "Sempit"], ["sedang", "Sedang"], ["lebar", "Lebar"]]));
    panel.appendChild(sw("dc", "Huruf awal besar"));
    panel.appendChild(sw("fm", "Sembunyikan menu saat menggulir"));
    var rs = document.createElement("button"); rs.type = "button"; rs.className = "rd-reset"; rs.textContent = "Kembalikan ke bawaan";
=======
    panel.className = "rd-panel"; panel.hidden = true; panel.setAttribute("role", "group"); panel.setAttribute("aria-label", tt("rd_panel"));
    panel.appendChild(seg("fs", tt("rd_size"), [[1, "A", tt("rd_s1")], [2, "A", tt("rd_s2")], [3, "A", tt("rd_s3")], [4, "A", tt("rd_s4")], [5, "A", tt("rd_s5")]], "fs"));
    panel.appendChild(seg("ff", tt("rd_font"), [["serif", "Serif"], ["sans", "Sans"]], "ff"));
    panel.appendChild(seg("lh", tt("rd_lh"), [["rapat", tt("rd_lh_rapat")], ["normal", tt("rd_lh_normal")], ["lega", tt("rd_lh_lega")]]));
    panel.appendChild(seg("wd", tt("rd_wd"), [["sempit", tt("rd_wd_sempit")], ["sedang", tt("rd_wd_sedang")], ["lebar", tt("rd_wd_lebar")]]));
    panel.appendChild(sw("dc", tt("rd_dc")));
    panel.appendChild(sw("fm", tt("rd_fm")));
    var rs = document.createElement("button"); rs.type = "button"; rs.className = "rd-reset"; rs.textContent = tt("rd_reset");
>>>>>>> 11126f3 (ideng)
    rs.onclick = function () {
      S = JSON.parse(JSON.stringify(DEF)); save(); apply();
      var was = !panel.hidden; panel.parentNode.removeChild(panel); buildPanel(); if (was) openPanel();
    };
    panel.appendChild(rs);
    document.body.appendChild(panel);
  }
  function openPanel() {
    panel.style.top = Math.round(btn.getBoundingClientRect().bottom + 8) + "px";
    panel.hidden = false; panelOpen = true; btn.setAttribute("aria-expanded", "true"); nav.classList.remove("rd-hide");
  }
  function closePanel(focus) {
    if (!panel || panel.hidden) return;
    panel.hidden = true; panelOpen = false; btn.setAttribute("aria-expanded", "false");
    if (focus) btn.focus();
  }

  /* ---------- lanjutkan membaca ---------- */
  function hideToast() { if (toast) { toast.hidden = true; clearTimeout(toast._t); } }
  function offerResume() {
    hideToast();
    if (!isEntry() || location.hash || window.pageYOffset > 50) return;
    var s = readPos()[location.pathname];
    if (!s || s.p < 0.05 || s.p > 0.95) return;
<<<<<<< HEAD
    toast.querySelector("span").textContent = "Lanjutkan dari " + Math.round(s.p * 100) + "%?";
=======
    toast._pct = Math.round(s.p * 100);
    toast.querySelector("span").textContent = tt("rd_resume", { p: toast._pct });
>>>>>>> 11126f3 (ideng)
    toast.hidden = false;
    toast._p = s.p;
    clearTimeout(toast._t); toast._t = setTimeout(hideToast, 12000);
  }

  /* ---------- pembesar foto ---------- */
  function openLightbox(img) {
    var fig = img.closest("figure"), cap = fig && fig.querySelector("figcaption");
<<<<<<< HEAD
    var o = document.createElement("button"); o.type = "button"; o.className = "rd-lb"; o.setAttribute("aria-label", "Tutup foto");
=======
    var o = document.createElement("button"); o.type = "button"; o.className = "rd-lb"; o.setAttribute("aria-label", tt("rd_close_photo"));
>>>>>>> 11126f3 (ideng)
    var im = document.createElement("img"); im.src = img.currentSrc || img.src; im.alt = img.alt || "";
    o.appendChild(im);
    if (cap) { var c = document.createElement("span"); c.textContent = cap.textContent; o.appendChild(c); }
    lbOpener = document.activeElement;
    root.classList.add("rd-lock"); document.body.appendChild(o); o.focus();
    function close() {
      root.classList.remove("rd-lock"); if (o.parentNode) o.parentNode.removeChild(o);
      document.removeEventListener("keydown", key, true);
      if (lbOpener && lbOpener.focus) lbOpener.focus();
    }
    function key(e) { if (e.key === "Escape") { e.stopPropagation(); close(); } }
    o.onclick = close; document.addEventListener("keydown", key, true);
  }

  function build() {
    nav = document.querySelector("nav"); var host = document.querySelector("nav .links");
    if (!nav || !host) return;

    btn = document.createElement("button"); btn.type = "button"; btn.className = "rd-btn"; btn.hidden = true;
    btn.setAttribute("aria-haspopup", "true"); btn.setAttribute("aria-expanded", "false");
<<<<<<< HEAD
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18l5-12 5 12M5 13h6M15 18l3.5-8 3.5 8M16.3 15.5h4.4"/></svg>Baca';
=======
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18l5-12 5 12M5 13h6M15 18l3.5-8 3.5 8M16.3 15.5h4.4"/></svg><span class="rd-lab"></span>';
>>>>>>> 11126f3 (ideng)
    host.insertBefore(btn, host.querySelector(".tema"));
    buildPanel();

    bar = document.createElement("div"); bar.className = "rd-bar"; bar.setAttribute("aria-hidden", "true");
    fill = document.createElement("i"); bar.appendChild(fill); document.body.appendChild(bar);

    hud = document.createElement("div"); hud.className = "rd-hud";
    left = document.createElement("span"); left.className = "up"; hud.appendChild(left);
<<<<<<< HEAD
    toTop = document.createElement("button"); toTop.type = "button"; toTop.setAttribute("aria-label", "Kembali ke atas");
=======
    toTop = document.createElement("button"); toTop.type = "button"; toTop.setAttribute("aria-label", tt("rd_top"));
>>>>>>> 11126f3 (ideng)
    toTop.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
    toTop.onclick = function () { window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); };
    hud.appendChild(toTop); document.body.appendChild(hud);

    toast = document.createElement("div"); toast.className = "rd-toast"; toast.hidden = true; toast.setAttribute("role", "status");
<<<<<<< HEAD
    toast.innerHTML = '<span></span><button type="button" data-go>Lanjutkan</button><button type="button" data-new>Dari awal</button>';
=======
    toast.innerHTML = '<span></span><button type="button" data-go></button><button type="button" data-new></button>';
>>>>>>> 11126f3 (ideng)
    toast.querySelector("[data-go]").onclick = function () {
      var g = geom(); if (g) window.scrollTo({ top: g.top + toast._p * g.span, behavior: "auto" }); hideToast();
    };
    toast.querySelector("[data-new]").onclick = function () {
      var m = readPos(); delete m[location.pathname]; writePos(m); hideToast();
    };
    document.body.appendChild(toast);

<<<<<<< HEAD
=======
    /* teks yang dibuat sekali di sini ikut berganti saat bahasa diganti */
    function labels() {
      btn.querySelector(".rd-lab").textContent = tt("rd_btn");
      toTop.setAttribute("aria-label", tt("rd_top"));
      toast.querySelector("[data-go]").textContent = tt("rd_go");
      toast.querySelector("[data-new]").textContent = tt("rd_new");
      if (toast._pct != null && !toast.hidden) toast.querySelector("span").textContent = tt("rd_resume", { p: toast._pct });
    }
    labels();
    document.addEventListener("langchange", function () {
      var was = !panel.hidden; panel.parentNode.removeChild(panel); buildPanel(); if (was) openPanel();
      labels(); update();
    });

>>>>>>> 11126f3 (ideng)
    btn.onclick = function () { panel.hidden ? openPanel() : closePanel(); };
    document.addEventListener("click", function (e) {
      if (panel && !panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) closePanel();
      var img = e.target.closest && e.target.closest("article figure.foto img");
      if (img) openLightbox(img);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePanel(true); });
    window.addEventListener("resize", function () { closePanel(); onScroll(); });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", function () { lastSave = 0; update(); });
    sync(true);
  }

  /* Dipanggil app.js setiap kali halaman (daftar/tulisan) selesai digambar. */
  function sync(first) {
    if (!btn) return;
    var a = article();
    btn.hidden = !a;
    if (!a) closePanel();
    var b = bodyEl();
    words = b ? (b.textContent.trim().split(/\s+/).filter(Boolean).length) : 0;
    lastY = window.pageYOffset;
    nav.classList.remove("rd-hide");
    update();
    if (a) offerResume(); else hideToast();
  }
  window.readerSync = sync;

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();
})();

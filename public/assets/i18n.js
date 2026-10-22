/* Dua bahasa (Indonesia / English): kamus teks, format tanggal, dan pengalih bahasa.
   File ini dipakai di dua tempat dari satu sumber yang sama:
   - browser (dimuat di <head> sebelum theme.js dan reader.js), dan
   - server (functions/ dan lib/ mengimpornya sebagai modul), supaya teks di halaman yang dirender server sama persis.
   Untuk menambah/mengubah teks: ubah di kamus STR di bawah (kunci sama di "id" dan "en").
   Bahasa dipilih dari: ?lang=en di alamat > pilihan tersimpan di browser > Indonesia. */
(function () {
  var KEY = "bahasa-catatan";
  var STR = {
    id: {
      nav_posts: "Tulisan", nav_about: "Tentang", nav_photo: "Jurnal Foto",
      foot_visual: "Jurnal visual: Potret Kehidupan →",
      lang_label: "Bahasa", lang_to_id: "Ganti ke Bahasa Indonesia", lang_to_en: "Switch to English",
      meta_left: "Tulisan pribadi", meta_right: "Jurnal tulisan · {year}",
      lede: "Jurnal tulisan pribadi {author}, pasangan dari Potret Kehidupan: kalau di sana hari-hari saya hadir sebagai gambar, di sini ia hadir sebagai kalimat. Klik sebuah tulisan untuk membacanya.",
      tagline: "Kepingan hidup dalam kalimat.",
      site_desc: "Kepingan hidup dalam kalimat. Jurnal tulisan {author}.",
      all: "Semua", search_ph: "Cari tulisan…", search_aria: "Cari tulisan",
      empty: "Belum ada tulisan yang cocok.", loading: "Memuat tulisan…",
      load_err: "Tulisan belum bisa dimuat. Coba muat ulang halaman.",
      read_time: "{n} mnt baca", back: "← Semua tulisan", prev: "← Sebelumnya", next: "Berikutnya →",
      share: "Bagikan", copy: "Salin tautan", more: "Lainnya", copied: "Tautan disalin ✓",
      copy_fail: "Gagal menyalin. Salin dari bilah alamat.",
      only_id: "Tulisan ini belum tersedia dalam Bahasa Inggris. Menampilkan versi aslinya (Bahasa Indonesia).",
      badge_id: "ID", badge_id_title: "Hanya tersedia dalam Bahasa Indonesia",
      nf_title: "Tidak<br>ditemukan", nf_back: "← Kembali ke tulisan", nf_doc: "Halaman tidak ditemukan",
      post_nf: "Tulisan tidak ditemukan",
      theme: "Tema", theme_pick: "Pilih tema",
      th_otomatis: "Otomatis", th_kertas: "Kertas", th_sepia: "Sepia", th_hutan: "Hutan", th_laut: "Laut", th_senja: "Senja", th_malam: "Malam", th_tinta: "Tinta",
      rd_btn: "Baca", rd_panel: "Pengaturan membaca",
      rd_size: "Ukuran huruf", rd_s1: "Sangat kecil", rd_s2: "Kecil", rd_s3: "Sedang", rd_s4: "Besar", rd_s5: "Sangat besar",
      rd_font: "Jenis huruf", rd_lh: "Jarak baris", rd_lh_rapat: "Rapat", rd_lh_normal: "Normal", rd_lh_lega: "Lega",
      rd_wd: "Lebar teks", rd_wd_sempit: "Sempit", rd_wd_sedang: "Sedang", rd_wd_lebar: "Lebar",
      rd_dc: "Huruf awal besar", rd_fm: "Sembunyikan menu saat menggulir", rd_reset: "Kembalikan ke bawaan",
      rd_left: "{n} mnt lagi", rd_left_lt1: "kurang dari 1 mnt lagi", rd_done: "Selesai ✓", rd_top: "Kembali ke atas",
      rd_resume: "Lanjutkan dari {p}%?", rd_go: "Lanjutkan", rd_new: "Dari awal", rd_close_photo: "Tutup foto"
    },
    en: {
      nav_posts: "Posts", nav_about: "About", nav_photo: "Photo Journal",
      foot_visual: "Visual journal: Potret Kehidupan →",
      lang_label: "Language", lang_to_id: "Ganti ke Bahasa Indonesia", lang_to_en: "Switch to English",
      meta_left: "Personal writing", meta_right: "Written journal · {year}",
      lede: "The personal written journal of {author}, companion to Potret Kehidupan: there my days appear as pictures, here they appear as sentences. Click a post to read it.",
      tagline: "Fragments of life, in sentences.",
      site_desc: "Fragments of life, in sentences. The written journal of {author}.",
      all: "All", search_ph: "Search posts…", search_aria: "Search posts",
      empty: "No matching posts yet.", loading: "Loading posts…",
      load_err: "The posts couldn't be loaded. Try reloading the page.",
      read_time: "{n} min read", back: "← All posts", prev: "← Previous", next: "Next →",
      share: "Share", copy: "Copy link", more: "More", copied: "Link copied ✓",
      copy_fail: "Couldn't copy. Copy it from the address bar.",
      only_id: "This post isn't available in English yet. Showing the original (Indonesian).",
      badge_id: "ID", badge_id_title: "Only available in Indonesian",
      nf_title: "Not<br>found", nf_back: "← Back to posts", nf_doc: "Page not found",
      post_nf: "Post not found",
      theme: "Theme", theme_pick: "Choose a theme",
      th_otomatis: "Auto", th_kertas: "Paper", th_sepia: "Sepia", th_hutan: "Forest", th_laut: "Sea", th_senja: "Dusk", th_malam: "Night", th_tinta: "Ink",
      rd_btn: "Read", rd_panel: "Reading settings",
      rd_size: "Text size", rd_s1: "Extra small", rd_s2: "Small", rd_s3: "Medium", rd_s4: "Large", rd_s5: "Extra large",
      rd_font: "Typeface", rd_lh: "Line spacing", rd_lh_rapat: "Tight", rd_lh_normal: "Normal", rd_lh_lega: "Roomy",
      rd_wd: "Text width", rd_wd_sempit: "Narrow", rd_wd_sedang: "Medium", rd_wd_lebar: "Wide",
      rd_dc: "Drop cap", rd_fm: "Hide menu while scrolling", rd_reset: "Reset to defaults",
      rd_left: "{n} min left", rd_left_lt1: "under 1 min left", rd_done: "Done ✓", rd_top: "Back to top",
      rd_resume: "Continue from {p}%?", rd_go: "Continue", rd_new: "Start over", rd_close_photo: "Close photo"
    }
  };
  var MONTHS = {
    id: ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  };

  function norm(l) { return l === "en" ? "en" : "id"; }
  function t(lang, key, vars) {
    var s = (STR[norm(lang)][key]);
    if (s == null) s = STR.id[key];
    if (s == null) return key;
    return vars ? s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; }) : s;
  }
  function date(lang, d) {
    var p = String(d).split("-"), mo = MONTHS[norm(lang)][+p[1] - 1];
    return norm(lang) === "en" ? mo + " " + (+p[2]) + ", " + p[0] : (+p[2]) + " " + mo + " " + p[0];
  }
  var api = { STR: STR, t: t, date: date, norm: norm };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window === "undefined" || typeof document === "undefined") return;

  /* ---------------- bagian browser ---------------- */
  var root = document.documentElement;
  function fromUrl() { var m = /[?&]lang=(en|id)(?:&|$)/.exec(location.search); return m ? m[1] : null; }
  function stored() { try { var s = localStorage.getItem(KEY); return s === "en" || s === "id" ? s : null; } catch (e) { return null; } }
  var urlLang = fromUrl();
  var LANG = urlLang || stored() || "id";
  root.lang = LANG;

  /* Server merender Indonesia bila alamat tak memuat ?lang=en; sembunyikan sebentar agar pembaca English tak melihat kilasan teks Indonesia. */
  if (LANG === "en" && urlLang !== "en") {
    root.classList.add("i18n-wait");
    setTimeout(function () { root.classList.remove("i18n-wait"); }, 3500);
  }

  function q() { return LANG === "en" ? "?lang=en" : ""; }
  function withLang(path) { return path + q(); }
  function updateUrl() {
    var u = new URL(location.href);
    if (LANG === "en") u.searchParams.set("lang", "en"); else u.searchParams.delete("lang");
    history.replaceState(null, "", u.pathname + u.search + u.hash);
  }
  function applyStatic() {
    root.lang = LANG;
    Array.prototype.forEach.call(document.querySelectorAll("[data-i]"), function (e) { e.textContent = t(LANG, e.getAttribute("data-i")); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-i-html]"), function (e) { e.innerHTML = t(LANG, e.getAttribute("data-i-html")); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-i-aria]"), function (e) { e.setAttribute("aria-label", t(LANG, e.getAttribute("data-i-aria"))); });
    Array.prototype.forEach.call(document.querySelectorAll("nav a[href], footer a[href]"), function (a) {
      var h = a.getAttribute("href");
      if (h === "/" || h === "/?lang=en") a.setAttribute("href", withLang("/"));
      else if (h === "/tentang" || h === "/tentang?lang=en") a.setAttribute("href", withLang("/tentang"));
    });
    if (sw) Array.prototype.forEach.call(sw.querySelectorAll("button"), function (b) {
      var on = b.getAttribute("data-l") === LANG;
      b.setAttribute("aria-pressed", String(on));
      b.setAttribute("aria-label", t(LANG, b.getAttribute("data-l") === "en" ? "lang_to_en" : "lang_to_id"));
    });
    if (sw) sw.setAttribute("aria-label", t(LANG, "lang_label"));
  }

  function setLang(l) {
    l = norm(l);
    if (l === LANG) return;
    LANG = l;
    try { localStorage.setItem(KEY, LANG); } catch (e) { /* mode privat: berlaku selama halaman terbuka */ }
    updateUrl();
    /* halaman Tentang dirender server: muat ulang agar isinya ikut berganti */
    if (document.querySelector("article.about")) { location.reload(); return; }
    applyStatic();
    document.dispatchEvent(new CustomEvent("langchange", { detail: LANG }));
  }

  var sw = null;
  function build() {
    if (LANG === "en" && urlLang !== "en") updateUrl();
    applyStatic();
    var host = document.querySelector("nav .links");
    if (!host) return;
    /* setTimeout: dipasang setelah tombol Tema/Baca supaya berada di ujung kanan menu */
    setTimeout(function () {
      sw = document.createElement("div"); sw.className = "lang-sw"; sw.setAttribute("role", "group");
      [["id", "ID"], ["en", "EN"]].forEach(function (p) {
        var b = document.createElement("button"); b.type = "button"; b.setAttribute("data-l", p[0]); b.textContent = p[1];
        b.setAttribute("lang", p[0]);
        b.onclick = function () { setLang(p[0]); };
        sw.appendChild(b);
      });
      host.appendChild(sw);
      applyStatic();
    }, 0);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();

  api.lang = function () { return LANG; };
  api.set = setLang;
  api.q = q;
  api.withLang = withLang;
  api.tt = function (key, vars) { return t(LANG, key, vars); };
  api.fd = function (d) { return date(LANG, d); };
  window.I18N = api;
})();

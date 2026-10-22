# Catatan Kehidupan

Jurnal tulisan — pendamping *Potret Kehidupan*. 

## Struktur

```
public/                    halaman statis (output Cloudflare Pages)
  og-image.png             gambar pratinjau 1200×630 untuk WhatsApp, Facebook, X, dll.
  index.html               situs publik
  admin.html               login + editor tulisan
<<<<<<< HEAD
  assets/ app.js admin.js config.js styles.css theme.js reader.js
=======
  assets/ app.js admin.js config.js styles.css theme.js reader.js i18n.js
>>>>>>> 11126f3 (ideng)
  _headers 404.html favicon.svg favicon.ico favicon-48.png apple-touch-icon.png
functions/                  backend (Pages Functions)
  index.js                 GET /               → beranda: daftar tulisan dirender di server + canonical + Open Graph
  tulisan/[id].js          GET /tulisan/:id    → satu tulisan: title, deskripsi, canonical, OG, JSON-LD, isi dirender di server
  tentang.js               GET /tentang        → halaman tentang (teks di lib/about.js)
  feed.xml.js              GET /feed.xml       → RSS 30 tulisan terbaru
  sitemap.xml.js           GET /sitemap.xml
  robots.txt.js            GET /robots.txt     (memuat alamat sitemap)
functions/api/
  entries.js               GET  /api/entries            (publik, hanya yang terbit)
  latest.js                GET  /api/latest?n=3         (publik; ringkasan tulisan terbaru, dipakai situs Potret Kehidupan)
  login.js session.js logout.js
  admin/_middleware.js     penjaga: wajib sesi sah + anti-CSRF
  admin/entries/index.js   GET daftar, POST tulisan baru
  admin/entries/[id].js    GET, PUT, DELETE satu tulisan (DELETE juga membersihkan fotonya)
  admin/images/index.js    POST /api/admin/images → unggah foto (JPEG hasil kecilkan di browser)
functions/foto/[id].js     GET /foto/:id       → menyajikan foto yang diunggah (cache 1 tahun)
lib/util.js auth.js seo.js validasi tulisan, logika login/sesi, pembangun tag SEO
db/schema.sql seed.sql     tabel D1 + 4 tulisan contoh (opsional)
```
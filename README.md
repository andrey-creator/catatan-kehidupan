# Catatan Kehidupan

Jurnal tulisan — pendamping *Potret Kehidupan*. 

## Struktur

```
public/                    halaman statis (output Cloudflare Pages)
  og-image.png             gambar pratinjau 1200×630 untuk WhatsApp, Facebook, X, dll.
  index.html               situs publik
  admin.html               login + editor tulisan
  assets/ app.js admin.js config.js styles.css
  _headers 404.html favicon.svg
functions/                  backend (Pages Functions)
  index.js                 GET /               → beranda + canonical + Open Graph (URL absolut)
  tulisan/[id].js          GET /tulisan/:id    → satu tulisan: title, deskripsi, canonical, OG, JSON-LD, isi dirender di server
  sitemap.xml.js           GET /sitemap.xml
  robots.txt.js            GET /robots.txt     (memuat alamat sitemap)
functions/api/
  entries.js               GET  /api/entries            (publik, hanya yang terbit)
  login.js session.js logout.js
  admin/_middleware.js     penjaga: wajib sesi sah + anti-CSRF
  admin/entries/index.js   GET daftar, POST tulisan baru
  admin/entries/[id].js    GET, PUT, DELETE satu tulisan
lib/util.js auth.js seo.js validasi tulisan, logika login/sesi, pembangun tag SEO
db/schema.sql seed.sql     tabel D1 + 4 tulisan contoh (opsional)
```
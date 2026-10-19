# Catatan Kehidupan

Jurnal tulisan — pendamping *Potret Kehidupan*. 

## Struktur

```
public/                    halaman statis (output Cloudflare Pages)
  og-image.png             gambar pratinjau 1200×630 untuk WhatsApp, Facebook, X, dll.
  index.html               situs publik
  admin.html               login + editor tulisan
  assets/ app.js admin.js config.js styles.css
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
  admin/entries/[id].js    GET, PUT, DELETE satu tulisan
lib/util.js auth.js seo.js validasi tulisan, logika login/sesi, pembangun tag SEO
db/schema.sql seed.sql     tabel D1 + 4 tulisan contoh (opsional)
```

## Pengaturan penting di Cloudflare Pages

- **SITE_URL** (Settings → Variables and Secrets): isi dengan alamat utama situs, mis. `https://nama-situs.pages.dev`
  (tanpa garis miring di akhir). Dipakai untuk canonical, sitemap, RSS, dan gambar pratinjau.
- **ADMIN_PASSWORD** (min. 12 karakter) dan **SESSION_SECRET** (min. 32 karakter): wajib sebagai *secret*.

## Cadangan tulisan

Menghapus tulisan di admin bersifat permanen. Ekspor database secara berkala (ganti `NAMA_DB` dengan nama database D1 Anda):

```
npx wrangler d1 export NAMA_DB --remote --output=cadangan-$(date +%F).sql
```

## Tulisan contoh

`db/seed.sql` hanya berisi 4 tulisan contoh. Jika sudah pernah dijalankan, hapus tulisan contoh itu lewat /admin
(id: `cahaya-sore`, `kereta-pagi`, `tentang-menunda`, `catatan-kecil`) agar tidak muncul di sitemap dan RSS.

# Catatan Kehidupan

Jurnal tulisan — pendamping *Potret Kehidupan*.

## Struktur

```
public/                    halaman statis (output Cloudflare Pages)
  index.html               situs publik
  admin.html               login + editor tulisan
  assets/ app.js admin.js config.js styles.css
  _headers robots.txt 404.html favicon.svg
functions/api/             backend (Pages Functions)
  entries.js               GET  /api/entries            (publik, hanya yang terbit)
  login.js session.js logout.js
  admin/_middleware.js     penjaga: wajib sesi sah + anti-CSRF
  admin/entries/index.js   GET daftar, POST tulisan baru
  admin/entries/[id].js    GET, PUT, DELETE satu tulisan
lib/util.js auth.js        validasi tulisan, logika login/sesi
db/schema.sql seed.sql     tabel D1 + 4 tulisan contoh (opsional)
```
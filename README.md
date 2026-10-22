# Catatan Kehidupan

Jurnal tulisan — pendamping *Potret Kehidupan*. 

## Struktur

```
public/                    halaman statis (output Cloudflare Pages)
  og-image.png             gambar pratinjau 1200×630 untuk WhatsApp, Facebook, X, dll.
  index.html               situs publik
  admin.html               login + editor tulisan
  assets/ app.js admin.js config.js styles.css theme.js reader.js
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

## Pengaturan penting di Cloudflare Pages

- **SITE_URL** (Settings → Variables and Secrets): isi dengan alamat utama situs, mis. `https://nama-situs.pages.dev`
  (tanpa garis miring di akhir). Dipakai untuk canonical, sitemap, RSS, dan gambar pratinjau.
- **ADMIN_PASSWORD** (min. 12 karakter) dan **SESSION_SECRET** (min. 32 karakter): wajib sebagai *secret*.

## Foto di tulisan

Di editor admin, pakai "Sisipkan foto": foto dikecilkan di browser (maks. 1800 px, ≤ 1 MB, data lokasi EXIF terbuang), disimpan di tabel D1 `images`,
lalu penanda `[[foto:ID|keterangan]]` muncul di isi tulisan pada posisi kursor. Keterangan di bawah foto otomatis = nama berkas
(tanpa ekstensi, `_` jadi spasi); ubah teks setelah `|` bila ingin keterangan lain, atau hapus penanda untuk membuang foto dari tulisan.
Tabel `images` dibuat otomatis saat unggah pertama; atau jalankan ulang `db/schema.sql`.

## Tema

Tombol "Tema" di navigasi membuat pembaca bisa memilih: Otomatis (mengikuti terang/gelap perangkat), Kertas, Sepia, Hutan, Laut, Senja, Malam, dan Tinta.
Pilihan disimpan di browser masing-masing pembaca. Warna tiap tema ada di `public/assets/styles.css` (blok "Tema"); daftar nama di `public/assets/theme.js`.
Untuk menambah tema: tambahkan satu baris warna di CSS (selektor `:root[data-theme="nama"],.sw[data-t="nama"]`) dan satu entri `["nama","Label"]` di `theme.js`.

## Kenyamanan membaca

Di halaman tulisan, tombol "Baca" di navigasi membuka pengaturan: ukuran huruf (5 tingkat), jenis huruf (serif/sans), jarak baris, lebar teks,
huruf awal besar, dan menyembunyikan menu saat menggulir. Ada juga bilah progres di atas layar, sisa waktu baca + tombol ke atas di pojok kanan bawah,
tawaran "Lanjutkan dari …%" saat pembaca kembali ke tulisan yang belum selesai, dan foto yang bisa diklik untuk dibesarkan.
Semua pilihan tersimpan di browser pembaca (localStorage `baca-catatan` dan `baca-posisi`). Kode di `public/assets/reader.js`; ukuran dan gayanya di blok "Pembaca" pada `styles.css`
(nilai bawaan ada di `:root`, varian lewat atribut `data-fs`, `data-ff`, `data-lh`, `data-wd`, `data-dc`, `data-fm` pada `<html>`).

## Tautan di tulisan

Alamat `https://…` yang ditempel di isi tulisan otomatis menjadi tautan yang bisa diklik (terbuka di tab baru). Untuk teks tautan sendiri, tulis `[teks](https://…)`.
Hanya `http://` dan `https://` yang dikenali.

## Cadangan tulisan

Menghapus tulisan di admin bersifat permanen. Ekspor database secara berkala (ganti `NAMA_DB` dengan nama database D1 Anda):

```
npx wrangler d1 export NAMA_DB --remote --output=cadangan-$(date +%F).sql
```

## Tulisan contoh

`db/seed.sql` hanya berisi 4 tulisan contoh. Jika sudah pernah dijalankan, hapus tulisan contoh itu lewat /admin
(id: `cahaya-sore`, `kereta-pagi`, `tentang-menunda`, `catatan-kecil`) agar tidak muncul di sitemap dan RSS.

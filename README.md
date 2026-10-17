# Catatan Kehidupan

Jurnal tulisan — pendamping *Potret Kehidupan*. Halaman publik statis; tulisan disimpan di **Cloudflare D1** dan ditulis lewat halaman **/admin** yang dikunci kata sandi. Hanya Anda yang bisa menambah, mengubah, dan menghapus tulisan. Tidak memakai Zero Trust dan tidak butuh data pembayaran.

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

## Setup (sekali saja)

### 1. Push ke GitHub dan hubungkan ke Pages
Framework preset **None**, Build command **kosong**, Build output directory **`public`**. Folder `functions/` terdeteksi otomatis.

### 2. Buat database D1
1. Cloudflare Dashboard → **Storage & Databases** → **D1 SQL Database** → **Create**. Nama bebas, mis. `catatan-db`.
2. Buka database itu → tab **Console** → tempel seluruh isi `db/schema.sql` → **Execute**. (Aman dijalankan ulang.)
3. (Opsional) tempel isi `db/seed.sql` untuk 4 tulisan contoh.

### 3. Sambungkan D1 ke proyek Pages
Proyek Pages → **Settings** → **Bindings** → **Add** → **D1 database**:
- Variable name: **`DB`** (harus persis ini)
- Database: `catatan-db`

### 4. Isi dua secret
Proyek Pages → **Settings** → **Variables and Secrets** → **Add**, pilih tipe **Secret**, untuk **Production**:

| Nama | Isi |
|---|---|
| `ADMIN_PASSWORD` | kata sandi login Anda. **Minimal 12 karakter**; sebaiknya kalimat panjang yang unik (16+ karakter) |
| `SESSION_SECRET` | teks acak **minimal 32 karakter**, hanya untuk menandatangani cookie. Buat dari pengelola kata sandi, atau `openssl rand -base64 48`. Tidak perlu diingat |

Lalu **deploy ulang** (Deployments → Retry deployment, atau push commit baru) agar binding dan secret aktif.

### 5. Masuk
Buka `https://situs-anda/admin`, masukkan `ADMIN_PASSWORD`, dan mulai menulis. Sesi bertahan 7 hari di browser itu.

- **Ganti kata sandi**: ubah `ADMIN_PASSWORD`, deploy ulang.
- **Keluarkan semua perangkat sekaligus**: ubah `SESSION_SECRET`, deploy ulang.

## Keamanan (dan batasnya)
- Kata sandi tidak pernah ada di kode atau di Git, hanya sebagai secret terenkripsi di Cloudflare. Pengecekan memakai perbandingan waktu-konstan.
- Cookie sesi: `HttpOnly` (tidak terbaca skrip), `Secure`, `SameSite=Strict`, awalan `__Host-`, bertanda tangan HMAC, kedaluwarsa 7 hari.
- Maksimal 5 kata sandi salah per IP per 15 menit; setelah itu IP diblok sementara.
- Permintaan yang mengubah data harus datang dari situs sendiri (cek Origin) dan berformat JSON.
- Jika secret belum diisi atau terlalu pendek, login dan API admin **menolak semuanya** (gagal tertutup).
- Isi tulisan ditampilkan sebagai teks biasa, bukan HTML, jadi tidak ada risiko skrip tersisip.
- Batas: ini login satu kata sandi tanpa verifikasi dua langkah. Karena itu kata sandi harus panjang dan unik. Aktifkan verifikasi dua langkah di akun Cloudflare dan GitHub Anda.

## Menjalankan lokal (opsional)
Buat `.dev.vars` (tidak ikut ke Git):
```
ADMIN_PASSWORD=kalimat-sandi-yang-panjang
SESSION_SECRET=teks-acak-minimal-32-karakter-xxxxxxxx
```
```bash
npx wrangler d1 execute catatan-db --local --file=db/schema.sql
npx wrangler d1 execute catatan-db --local --file=db/seed.sql
npx wrangler pages dev public --d1 DB=catatan-db
```
Cookie bertanda `Secure` bisa ditolak Safari di `http://localhost`; pakai Chrome atau Firefox untuk uji lokal.

## Pengaturan lain
- `public/assets/config.js`: isi `SITE.potretUrl` dengan alamat situs Potret agar tautan di footer muncul.
- Paragraf dipisah baris kosong. Status **Draf** menyembunyikan tulisan dari situs publik.

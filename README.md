# Catatan Kehidupan

Jurnal tulisan — pendamping *Potret Kehidupan* (jurnal visual). Situs statis murni (HTML, CSS, JS), tanpa langkah build.

## Struktur

```
public/
  index.html          kerangka halaman
  404.html
  favicon.svg
  _headers            header keamanan Cloudflare Pages (CSP ketat)
  assets/
    entries.js        ← ISI TULISAN ANDA + alamat situs Potret
    app.js            logika daftar, halaman baca, pencarian, editor
    styles.css        gaya (token warna sama dengan Potret)
```

## Menambah tulisan

Buka `public/assets/entries.js`, tambahkan objek baru ke `ENTRIES`:

```js
{id:"judul-unik", date:"2026-10-17", tag:"Harian", title:"Judul", body:"Paragraf satu.\n\nParagraf dua."}
```

- `id` harus unik dan tanpa spasi (dipakai di URL: `/#/tulisan/judul-unik`).
- Pisahkan paragraf dengan `\n\n`.
- Isi `SITE.potretUrl` dengan alamat situs Potret agar tautan di footer muncul.

Tulisan hanya bisa ditambah oleh pemilik repositori: pengunjung tidak punya cara menambah atau mengubah isi situs. Tambahkan lewat `entries.js`, lalu push.

## Menjalankan lokal

```bash
npx serve public
# atau
python3 -m http.server -d public 8080
```

## Deploy: GitHub + Cloudflare Pages

1. Buat repo baru di GitHub, lalu dari folder ini:
   ```bash
   git init && git add . && git commit -m "Catatan Kehidupan"
   git branch -M main
   git remote add origin https://github.com/USERNAME/catatan-kehidupan.git
   git push -u origin main
   ```
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**, pilih repo.
3. Pengaturan build:
   - Framework preset: **None**
   - Build command: *(kosongkan)*
   - Build output directory: **public**
4. **Save and Deploy**. Setiap `git push` ke `main` otomatis memperbarui situs.
5. Domain sendiri: tab **Custom domains** di proyek Pages.

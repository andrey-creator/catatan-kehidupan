// POST /api/admin/images — unggah satu foto (badan permintaan = JPEG mentah, sudah dikecilkan oleh admin.js).
// Header X-Filename (di-encodeURIComponent) dipakai untuk keterangan foto = nama berkas.
import { json, captionFromFilename } from "../../../../lib/util.js";

const MAX_BYTES = 1_000_000; // base64 ≈ 1,33 MB, masih di bawah batas 2 MB per baris D1

function toBase64(buf) {
  const u8 = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}

export async function onRequestPost({ request, env }) {
  const buf = await request.arrayBuffer();
  if (!buf.byteLength) return json({ error: "Berkas kosong." }, 400);
  if (buf.byteLength > MAX_BYTES) return json({ error: "Foto terlalu besar (maks. 1 MB setelah dikecilkan)." }, 413);
  const h = new Uint8Array(buf, 0, 3);
  if (!(h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff)) return json({ error: "Hanya foto JPEG yang diterima." }, 415);

  let name = "";
  try { name = decodeURIComponent(request.headers.get("X-Filename") || ""); } catch { /* nama kosong */ }
  const caption = captionFromFilename(name);

  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const now = new Date().toISOString();
  const insert = () => env.DB.prepare(
    "INSERT INTO images (id, name, mime, size, data, created_at) VALUES (?, ?, 'image/jpeg', ?, ?, ?)"
  ).bind(id, name.slice(0, 200), buf.byteLength, toBase64(buf), now).run();
  try {
    try { await insert(); }
    catch {
      // Tabel belum dibuat (db/schema.sql belum dijalankan ulang): buat otomatis lalu coba lagi.
      await env.DB.prepare(
        "CREATE TABLE IF NOT EXISTS images (id TEXT PRIMARY KEY, name TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL)"
      ).run();
      await insert();
    }
  } catch {
    return json({ error: "Foto gagal disimpan." }, 500);
  }
  return json({ id, caption, marker: `[[foto:${id}|${caption}]]` }, 201);
}

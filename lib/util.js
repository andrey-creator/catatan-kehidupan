// Fungsi bantu bersama untuk semua endpoint API.

export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra },
  });
}

export function slugify(title) {
  return (
    String(title)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/, "") || "tulisan"
  );
}

// Memeriksa dan merapikan kiriman dari editor admin.
export function validateEntry(input) {
  if (!input || typeof input !== "object") return { error: "Data tidak valid." };
  const title = String(input.title ?? "").trim();
  const body = String(input.body ?? "").replace(/\r\n/g, "\n").trim();
  const tag = String(input.tag ?? "").trim();
  const date = String(input.date ?? "").trim();
  const published = input.published === 0 || input.published === false ? 0 : 1;
  if (!title || title.length > 120) return { error: "Judul wajib diisi (maks. 120 karakter)." };
  if (!body || body.length > 50000) return { error: "Isi tulisan wajib diisi (maks. 50.000 karakter)." };
  if (!tag || tag.length > 30) return { error: "Kategori wajib diisi (maks. 30 karakter)." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return { error: "Tanggal tidak valid." };

  // Versi English (opsional): judul dan isi harus ada keduanya, atau kosong keduanya. Kategori English kosong = pakai kategori Indonesia.
  const title_en = String(input.title_en ?? "").trim();
  const body_en = String(input.body_en ?? "").replace(/\r\n/g, "\n").trim();
  const tag_en = String(input.tag_en ?? "").trim();
  if (title_en.length > 120) return { error: "Judul English terlalu panjang (maks. 120 karakter)." };
  if (body_en.length > 50000) return { error: "Isi English terlalu panjang (maks. 50.000 karakter)." };
  if (tag_en.length > 30) return { error: "Kategori English terlalu panjang (maks. 30 karakter)." };
  if (!!title_en !== !!body_en) return { error: "Versi English harus punya judul dan isi, atau kosongkan keduanya." };
  return { data: { title, body, tag, date, published, title_en, body_en, tag_en } };
}

// Kolom bahasa English dibuat otomatis pada database yang sudah ada (sekali per instance; aman dijalankan berulang).
let langReady = false;
export async function ensureLang(env) {
  if (langReady) return;
  const probe = () => env.DB.prepare("SELECT title_en, body_en, tag_en FROM entries LIMIT 1").first();
  try { await probe(); langReady = true; return; } catch { /* kolom belum ada */ }
  for (const c of ["title_en", "body_en", "tag_en"]) {
    try { await env.DB.prepare(`ALTER TABLE entries ADD COLUMN ${c} TEXT NOT NULL DEFAULT ''`).run(); } catch { /* sudah ada / berebut dengan permintaan lain */ }
  }
  try { await probe(); langReady = true; } catch { /* database belum siap: biarkan endpoint melaporkan galatnya sendiri */ }
}

// Keterangan foto = nama berkas tanpa folder & ekstensi; "_" jadi spasi. Contoh: "senja_di_teras.JPG" → "senja di teras".
export function captionFromFilename(name) {
  return String(name)
    .split(/[\\/]/).pop()
    .replace(/\.[A-Za-z0-9]{1,5}$/, "")
    .replace(/_+/g, " ")
    .replace(/[\[\]\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

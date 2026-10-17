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
  return { data: { title, body, tag, date, published } };
}

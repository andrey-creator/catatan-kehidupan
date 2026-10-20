// GET /foto/:id — menyajikan foto yang diunggah lewat admin (publik; id acak sulit ditebak).
export async function onRequestGet({ env, params }) {
  const id = String(params.id);
  if (!/^[A-Za-z0-9_-]{6,40}$/.test(id)) return new Response("Tidak ditemukan.", { status: 404 });
  let row;
  try { row = await env.DB.prepare("SELECT mime, data FROM images WHERE id = ?").bind(id).first(); }
  catch { return new Response("Tidak ditemukan.", { status: 404 }); }
  if (!row) return new Response("Tidak ditemukan.", { status: 404 });
  const bin = atob(row.data);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return new Response(u8, {
    headers: {
      "Content-Type": row.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

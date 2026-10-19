// GET /api/latest?n=3 — ringkasan tulisan terbaru (id, tanggal, kategori, judul, kutipan).
// Dipakai situs Potret Kehidupan untuk menampilkan tulisan terbaru di berandanya (diambil dari server ke server).
import { json } from "../../lib/util.js";
import { excerpt } from "../../lib/seo.js";

export async function onRequestGet({ request, env }) {
  const n = Math.min(Math.max(parseInt(new URL(request.url).searchParams.get("n"), 10) || 3, 1), 10);
  try {
    const { results } = await env.DB.prepare(
      "SELECT id, date, tag, title, body FROM entries WHERE published = 1 ORDER BY date DESC, created_at DESC LIMIT ?"
    ).bind(n).all();
    const out = results.map((r) => ({ id: r.id, date: r.date, tag: r.tag, title: r.title, excerpt: excerpt(r.body, 140) }));
    return json(out, 200, { "Cache-Control": "public, max-age=300" });
  } catch {
    return json({ error: "Database belum siap." }, 500);
  }
}

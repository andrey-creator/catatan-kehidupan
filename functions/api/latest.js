// GET /api/latest?n=3 — ringkasan tulisan terbaru (id, tanggal, kategori, judul, kutipan).
// Tambahkan &lang=en untuk judul/kutipan English (tulisan tanpa versi English tetap dalam bahasa Indonesia).
// Dipakai situs Potret Kehidupan untuk menampilkan tulisan terbaru di berandanya (diambil dari server ke server).
import { json, ensureLang } from "../../lib/util.js";
import { excerpt } from "../../lib/seo.js";

export async function onRequestGet({ request, env }) {
  const n = Math.min(Math.max(parseInt(new URL(request.url).searchParams.get("n"), 10) || 3, 1), 10);
  const en = new URL(request.url).searchParams.get("lang") === "en";
  try {
    await ensureLang(env);
    const { results } = await env.DB.prepare(
      "SELECT id, date, tag, title, body, tag_en, title_en, body_en FROM entries WHERE published = 1 ORDER BY date DESC, created_at DESC LIMIT ?"
    ).bind(n).all();
    const out = results.map((r) => {
      const useEn = en && r.title_en && r.body_en;
      return {
        id: r.id, date: r.date, lang: useEn ? "en" : "id",
        tag: useEn && r.tag_en ? r.tag_en : r.tag,
        title: useEn ? r.title_en : r.title,
        excerpt: excerpt(useEn ? r.body_en : r.body, 140),
      };
    });
    return json(out, 200, { "Cache-Control": "public, max-age=300" });
  } catch {
    return json({ error: "Database belum siap." }, 500);
  }
}

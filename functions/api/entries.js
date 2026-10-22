// GET /api/entries — daftar tulisan yang sudah terbit (publik), memuat versi Indonesia dan (bila ada) English.
import { json, ensureLang } from "../../lib/util.js";

export async function onRequestGet({ env }) {
  try {
    await ensureLang(env);
    const { results } = await env.DB.prepare(
      "SELECT id, date, tag, title, body, tag_en, title_en, body_en FROM entries WHERE published = 1 ORDER BY date DESC, created_at DESC"
    ).all();
    return json(results, 200, { "Cache-Control": "public, max-age=30" });
  } catch (e) {
    return json({ error: "Database belum siap." }, 500);
  }
}

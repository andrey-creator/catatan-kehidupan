// GET /api/entries — daftar tulisan yang sudah terbit (publik).
import { json } from "../../lib/util.js";

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      "SELECT id, date, tag, title, body FROM entries WHERE published = 1 ORDER BY date DESC, created_at DESC"
    ).all();
    return json(results, 200, { "Cache-Control": "public, max-age=30" });
  } catch (e) {
    return json({ error: "Database belum siap." }, 500);
  }
}

// GET / PUT / DELETE /api/admin/entries/:id
import { json, validateEntry, ensureLang } from "../../../../lib/util.js";
import { photoIds } from "../../../../lib/seo.js";

export async function onRequestGet({ env, params }) {
  await ensureLang(env);
  const row = await env.DB.prepare(
    "SELECT id, date, tag, title, body, tag_en, title_en, body_en, published, updated_at FROM entries WHERE id = ?"
  ).bind(params.id).first();
  return row ? json(row) : json({ error: "Tidak ditemukan." }, 404);
}

export async function onRequestPut({ request, env, params }) {
  let input;
  try { input = await request.json(); } catch { return json({ error: "JSON tidak valid." }, 400); }
  await ensureLang(env);
  const v = validateEntry(input);
  if (v.error) return json({ error: v.error }, 400);
  const e = v.data;
  const r = await env.DB.prepare(
    "UPDATE entries SET title = ?, tag = ?, date = ?, body = ?, published = ?, updated_at = ?, title_en = ?, body_en = ?, tag_en = ? WHERE id = ?"
  ).bind(e.title, e.tag, e.date, e.body, e.published, new Date().toISOString(), e.title_en, e.body_en, e.tag_en, params.id).run();
  return r.meta.changes ? json({ id: params.id }) : json({ error: "Tidak ditemukan." }, 404);
}

export async function onRequestDelete({ env, params }) {
  await ensureLang(env);
  const old = await env.DB.prepare("SELECT body, body_en FROM entries WHERE id = ?").bind(params.id).first();
  const r = await env.DB.prepare("DELETE FROM entries WHERE id = ?").bind(params.id).run();
  if (old) {
    // Bersihkan foto milik tulisan ini (versi Indonesia maupun English) yang tidak dipakai tulisan lain (gagal pun tidak masalah).
    for (const pid of new Set([...photoIds(old.body), ...photoIds(old.body_en || "")])) {
      try {
        const like = `%[[foto:${pid}|%`;
        const used = await env.DB.prepare("SELECT 1 FROM entries WHERE body LIKE ? OR body_en LIKE ?").bind(like, like).first();
        if (!used) await env.DB.prepare("DELETE FROM images WHERE id = ?").bind(pid).run();
      } catch { /* abaikan */ }
    }
  }
  return r.meta.changes ? json({ ok: true }) : json({ error: "Tidak ditemukan." }, 404);
}

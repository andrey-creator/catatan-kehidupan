// GET / PUT / DELETE /api/admin/entries/:id
import { json, validateEntry } from "../../../../lib/util.js";
import { photoIds } from "../../../../lib/seo.js";

export async function onRequestGet({ env, params }) {
  const row = await env.DB.prepare(
    "SELECT id, date, tag, title, body, published, updated_at FROM entries WHERE id = ?"
  ).bind(params.id).first();
  return row ? json(row) : json({ error: "Tidak ditemukan." }, 404);
}

export async function onRequestPut({ request, env, params }) {
  let input;
  try { input = await request.json(); } catch { return json({ error: "JSON tidak valid." }, 400); }
  const v = validateEntry(input);
  if (v.error) return json({ error: v.error }, 400);
  const e = v.data;
  const r = await env.DB.prepare(
    "UPDATE entries SET title = ?, tag = ?, date = ?, body = ?, published = ?, updated_at = ? WHERE id = ?"
  ).bind(e.title, e.tag, e.date, e.body, e.published, new Date().toISOString(), params.id).run();
  return r.meta.changes ? json({ id: params.id }) : json({ error: "Tidak ditemukan." }, 404);
}

export async function onRequestDelete({ env, params }) {
  const old = await env.DB.prepare("SELECT body FROM entries WHERE id = ?").bind(params.id).first();
  const r = await env.DB.prepare("DELETE FROM entries WHERE id = ?").bind(params.id).run();
  if (old) {
    // Bersihkan foto milik tulisan ini yang tidak dipakai tulisan lain (gagal pun tidak masalah).
    for (const pid of new Set(photoIds(old.body))) {
      try {
        const used = await env.DB.prepare("SELECT 1 FROM entries WHERE body LIKE ?").bind(`%[[foto:${pid}|%`).first();
        if (!used) await env.DB.prepare("DELETE FROM images WHERE id = ?").bind(pid).run();
      } catch { /* abaikan */ }
    }
  }
  return r.meta.changes ? json({ ok: true }) : json({ error: "Tidak ditemukan." }, 404);
}

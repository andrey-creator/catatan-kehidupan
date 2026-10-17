// GET / PUT / DELETE /api/admin/entries/:id
import { json, validateEntry } from "../../../../lib/util.js";

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
  const r = await env.DB.prepare("DELETE FROM entries WHERE id = ?").bind(params.id).run();
  return r.meta.changes ? json({ ok: true }) : json({ error: "Tidak ditemukan." }, 404);
}

// GET  /api/admin/entries — semua tulisan (termasuk draf)
// POST /api/admin/entries — buat tulisan baru
import { json, slugify, validateEntry } from "../../../../lib/util.js";

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    "SELECT id, date, tag, title, body, published, updated_at FROM entries ORDER BY date DESC, created_at DESC"
  ).all();
  return json(results);
}

export async function onRequestPost({ request, env }) {
  let input;
  try { input = await request.json(); } catch { return json({ error: "JSON tidak valid." }, 400); }
  const v = validateEntry(input);
  if (v.error) return json({ error: v.error }, 400);
  const e = v.data;

  const base = slugify(e.title);
  let id = base, n = 1;
  while (await env.DB.prepare("SELECT 1 FROM entries WHERE id = ?").bind(id).first()) {
    id = `${base}-${++n}`;
    if (n > 99) return json({ error: "Tidak bisa membuat alamat unik." }, 409);
  }
  const now = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO entries (id, title, tag, date, body, published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(id, e.title, e.tag, e.date, e.body, e.published, now, now).run();
  return json({ id }, 201);
}

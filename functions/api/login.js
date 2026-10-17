// POST /api/login  { "password": "..." } → cookie sesi. Maks. 5 salah per IP per 15 menit.
import { json } from "../../lib/util.js";
import { configProblem, passwordMatches, createSessionCookie, sameOrigin, isJson } from "../../lib/auth.js";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;

export async function onRequestPost({ request, env }) {
  const problem = configProblem(env);
  if (problem) return json({ error: problem }, 503);
  if (!sameOrigin(request)) return json({ error: "Asal permintaan ditolak." }, 403);
  if (!isJson(request)) return json({ error: "Content-Type harus application/json." }, 415);
  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON tidak valid." }, 400); }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  try {
    await env.DB.prepare("DELETE FROM login_fails WHERE at < ?").bind(Date.now() - WINDOW_MS).run();
    const row = await env.DB.prepare("SELECT COUNT(*) AS c FROM login_fails WHERE ip = ?").bind(ip).first();
    if (row.c >= MAX_FAILS) return json({ error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." }, 429);

    if (!(await passwordMatches(typeof body?.password === "string" ? body.password : "", env))) {
      await env.DB.prepare("INSERT INTO login_fails (ip, at) VALUES (?, ?)").bind(ip, Date.now()).run();
      return json({ error: "Kata sandi salah." }, 401);
    }
    await env.DB.prepare("DELETE FROM login_fails WHERE ip = ?").bind(ip).run();
  } catch {
    return json({ error: "Database belum siap." }, 500);
  }
  return json({ ok: true }, 200, { "Set-Cookie": await createSessionCookie(env) });
}

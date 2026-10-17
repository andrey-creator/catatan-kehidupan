// GET /api/session — apakah browser ini sedang login?
import { json } from "../../lib/util.js";
import { configProblem, hasValidSession } from "../../lib/auth.js";

export async function onRequestGet({ request, env }) {
  const problem = configProblem(env);
  if (problem) return json({ error: problem }, 503);
  return (await hasValidSession(request, env)) ? json({ ok: true }) : json({ error: "Belum masuk." }, 401);
}

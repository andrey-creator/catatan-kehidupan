// Penjaga untuk semua /api/admin/*: wajib punya cookie sesi yang sah.
import { json } from "../../../lib/util.js";
import { configProblem, hasValidSession, sameOrigin, isJson } from "../../../lib/auth.js";

export async function onRequest({ request, env, next }) {
  const problem = configProblem(env);
  if (problem) return json({ error: problem }, 503);
  if (!(await hasValidSession(request, env))) return json({ error: "Silakan masuk dulu." }, 401);

  if (!["GET", "HEAD"].includes(request.method)) {
    if (!sameOrigin(request)) return json({ error: "Asal permintaan ditolak." }, 403);
    const upload = request.method === "POST" && new URL(request.url).pathname === "/api/admin/images";
    if (!upload && request.method !== "DELETE" && !isJson(request)) return json({ error: "Content-Type harus application/json." }, 415);
  }
  return next();
}

// POST /api/logout — hapus cookie sesi.
import { json } from "../../lib/util.js";
import { clearCookie, sameOrigin } from "../../lib/auth.js";

export async function onRequestPost({ request }) {
  if (!sameOrigin(request)) return json({ error: "Asal permintaan ditolak." }, 403);
  return json({ ok: true }, 200, { "Set-Cookie": clearCookie });
}

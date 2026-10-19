// GET / — index.html + canonical, og:url, og:image (URL absolut) + daftar tulisan yang sudah dirender di server.
import { baseUrl, homeTags, homeHtml } from "../lib/seo.js";

export async function onRequestGet({ request, env }) {
  const res = await env.ASSETS.fetch(request);
  if (!res.ok || !(res.headers.get("Content-Type") || "").includes("text/html")) return res;

  let rows = null;
  try {
    ({ results: rows } = await env.DB.prepare(
      "SELECT id, date, tag, title, body FROM entries WHERE published = 1 ORDER BY date DESC, created_at DESC"
    ).all());
  } catch { /* database belum siap: biarkan app.js yang menggambar beranda */ }

  const tags = homeTags(baseUrl(env, request.url));
  let rw = new HTMLRewriter().on("head", { element(el) { el.append("\n  " + tags + "\n", { html: true }); } });
  if (rows) rw = rw.on("main#app", { element(el) { el.setInnerContent(homeHtml(rows), { html: true }); } });

  const out = rw.transform(res);
  const headers = new Headers(out.headers);
  headers.delete("Content-Length");
  headers.delete("ETag");
  headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  return new Response(out.body, { status: out.status, headers });
}

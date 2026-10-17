// GET / — index.html + canonical, og:url, og:image, twitter:image dengan URL absolut.
import { baseUrl, homeTags } from "../lib/seo.js";

export async function onRequestGet({ request, env }) {
  const res = await env.ASSETS.fetch(request);
  if (!res.ok || !(res.headers.get("Content-Type") || "").includes("text/html")) return res;
  const tags = homeTags(baseUrl(env, request.url));
  const out = new HTMLRewriter()
    .on("head", { element(el) { el.append("\n  " + tags + "\n", { html: true }); } })
    .transform(res);
  const headers = new Headers(out.headers);
  headers.delete("Content-Length");
  headers.delete("ETag");
  return new Response(out.body, { status: out.status, headers });
}

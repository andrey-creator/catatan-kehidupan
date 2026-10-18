// GET /tentang — halaman tentang, dirender di server dengan title, deskripsi, canonical, OG, dan JSON-LD.
import { baseUrl, aboutTags, aboutHtml } from "../lib/seo.js";
import { ABOUT_TITLE, ABOUT_DESC, ABOUT_PARAGRAPHS } from "../lib/about.js";

const POTRET_URL = "https://potret-kehidupan.pages.dev/";

export async function onRequestGet({ request, env }) {
  const origin = new URL(request.url).origin;
  const shell = await env.ASSETS.fetch(new Request(origin + "/", { headers: request.headers }));
  if (!shell.ok) return shell;

  const base = baseUrl(env, request.url);
  const title = `${ABOUT_TITLE} — Catatan Kehidupan`;
  const set = (v) => ({ element(el) { el.setAttribute("content", v); } });

  const out = new HTMLRewriter()
    .on("title", { element(el) { el.setInnerContent(title); } })
    .on('meta[name="description"]', set(ABOUT_DESC))
    .on('meta[property="og:title"]', set(`${ABOUT_TITLE} — Catatan Kehidupan`))
    .on('meta[property="og:description"]', set(ABOUT_DESC))
    .on("head", { element(el) { el.append("\n  " + aboutTags(base) + "\n", { html: true }); } })
    .on("main#app", { element(el) { el.setInnerContent(aboutHtml(ABOUT_PARAGRAPHS, POTRET_URL), { html: true }); } })
    .transform(shell);

  const headers = new Headers(out.headers);
  headers.delete("Content-Length");
  headers.delete("ETag");
  headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  return new Response(out.body, { status: 200, headers });
}

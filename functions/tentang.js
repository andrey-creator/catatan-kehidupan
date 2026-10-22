// GET /tentang — halaman tentang, dirender di server dengan title, deskripsi, canonical, OG, dan JSON-LD.
// Tambahkan ?lang=en untuk versi English.
import { baseUrl, aboutTags, aboutHtml, pageLang, langRewrites } from "../lib/seo.js";
import { ABOUT } from "../lib/about.js";

const POTRET_URL = "https://potret-kehidupan.pages.dev/";

export async function onRequestGet({ request, env }) {
  const origin = new URL(request.url).origin;
  const shell = await env.ASSETS.fetch(new Request(origin + "/", { headers: request.headers }));
  if (!shell.ok) return shell;

  const lang = pageLang(request.url);
  const about = ABOUT[lang];
  const base = baseUrl(env, request.url);
  const title = `${about.title} — Catatan Kehidupan`;
  const set = (v) => ({ element(el) { el.setAttribute("content", v); } });

  const out = langRewrites(new HTMLRewriter(), lang)
    .on("title", { element(el) { el.setInnerContent(title); } })
    .on('meta[name="description"]', set(about.desc))
    .on('meta[property="og:title"]', set(title))
    .on('meta[property="og:description"]', set(about.desc))
    .on("head", { element(el) { el.append("\n  " + aboutTags(base, lang, about) + "\n", { html: true }); } })
    .on("main#app", { element(el) { el.setInnerContent(aboutHtml(about, POTRET_URL, lang), { html: true }); } })
    .transform(shell);

  const headers = new Headers(out.headers);
  headers.delete("Content-Length");
  headers.delete("ETag");
  headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  return new Response(out.body, { status: 200, headers });
}

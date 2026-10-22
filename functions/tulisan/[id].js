// GET /tulisan/:id — halaman satu tulisan dengan title, deskripsi, canonical, Open Graph,
// JSON-LD, dan isi tulisan yang sudah dirender di server (untuk Google, WhatsApp, dll).
import { baseUrl, entryTags, excerpt, articleHtml, esc, pageLang, localize, langRewrites } from "../../lib/seo.js";
import { ensureLang } from "../../lib/util.js";
import i18n from "../../public/assets/i18n.js";

function notFound(lang) {
  const T = (k) => i18n.t(lang, k);
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<meta name="robots" content="noindex"><title>${T("post_nf")} — Catatan Kehidupan</title><link rel="icon" href="/favicon.svg" type="image/svg+xml">` +
    `<link rel="stylesheet" href="/assets/styles.css"><script src="/assets/theme.js"></script></head><body><main class="shell nf"><p class="up">404</p><h1>${T("nf_title")}</h1>` +
    `<p class="lede"><a href="/${lang === "en" ? "?lang=en" : ""}">${T("nf_back")}</a></p></main></body></html>`;
  return new Response(html, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function onRequestGet({ request, env, params }) {
  let row;
  try {
    await ensureLang(env);
    row = await env.DB.prepare("SELECT id, date, tag, title, body, tag_en, title_en, body_en, updated_at FROM entries WHERE id = ? AND published = 1")
      .bind(String(params.id)).first();
  } catch {
    return new Response("Database belum siap.", { status: 500 });
  }
  const lang = pageLang(request.url);
  if (!row) return notFound(lang);
  row = localize(row, lang);

  const origin = new URL(request.url).origin;
  const shell = await env.ASSETS.fetch(new Request(origin + "/", { headers: request.headers }));
  if (!shell.ok) return shell;

  const base = baseUrl(env, request.url);
  const title = `${row.title} — Catatan Kehidupan`;
  const desc = excerpt(row.body);
  const set = (attr) => ({ element(el) { el.setAttribute("content", attr); } });

  const out = langRewrites(new HTMLRewriter(), row.lang)
    .on("title", { element(el) { el.setInnerContent(title); } })
    .on('meta[name="description"]', set(desc))
    .on('meta[property="og:title"]', set(row.title))
    .on('meta[property="og:description"]', set(desc))
    .on('meta[property="og:type"]', set("article"))
    .on("head", { element(el) { el.append("\n  " + entryTags(row, base) + "\n", { html: true }); } })
    .on("main#app", { element(el) { el.setInnerContent(articleHtml(row, base, lang), { html: true }); } })
    .transform(shell);

  const headers = new Headers(out.headers);
  headers.delete("Content-Length");
  headers.delete("ETag");
  headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  return new Response(out.body, { status: 200, headers });
}

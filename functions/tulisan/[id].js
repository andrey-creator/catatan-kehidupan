// GET /tulisan/:id — halaman satu tulisan dengan title, deskripsi, canonical, Open Graph,
// JSON-LD, dan isi tulisan yang sudah dirender di server (untuk Google, WhatsApp, dll).
import { baseUrl, entryTags, excerpt, articleHtml, esc } from "../../lib/seo.js";

function notFound() {
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<meta name="robots" content="noindex"><title>Tulisan tidak ditemukan — Catatan Kehidupan</title><link rel="icon" href="/favicon.svg" type="image/svg+xml">` +
    `<link rel="stylesheet" href="/assets/styles.css"><script src="/assets/theme.js"></script></head><body><main class="shell nf"><p class="up">404</p><h1>Tidak<br>ditemukan</h1>` +
    `<p class="lede"><a href="/">← Kembali ke tulisan</a></p></main></body></html>`;
  return new Response(html, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function onRequestGet({ request, env, params }) {
  let row;
  try {
    row = await env.DB.prepare("SELECT id, date, tag, title, body, updated_at FROM entries WHERE id = ? AND published = 1")
      .bind(String(params.id)).first();
  } catch {
    return new Response("Database belum siap.", { status: 500 });
  }
  if (!row) return notFound();

  const origin = new URL(request.url).origin;
  const shell = await env.ASSETS.fetch(new Request(origin + "/", { headers: request.headers }));
  if (!shell.ok) return shell;

  const base = baseUrl(env, request.url);
  const title = `${row.title} — Catatan Kehidupan`;
  const desc = excerpt(row.body);
  const set = (attr) => ({ element(el) { el.setAttribute("content", attr); } });

  const out = new HTMLRewriter()
    .on("title", { element(el) { el.setInnerContent(title); } })
    .on('meta[name="description"]', set(desc))
    .on('meta[property="og:title"]', set(row.title))
    .on('meta[property="og:description"]', set(desc))
    .on('meta[property="og:type"]', set("article"))
    .on("head", { element(el) { el.append("\n  " + entryTags(row, base) + "\n", { html: true }); } })
    .on("main#app", { element(el) { el.setInnerContent(articleHtml(row, base), { html: true }); } })
    .transform(shell);

  const headers = new Headers(out.headers);
  headers.delete("Content-Length");
  headers.delete("ETag");
  headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  return new Response(out.body, { status: 200, headers });
}

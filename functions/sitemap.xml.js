// GET /sitemap.xml — halaman utama + semua tulisan yang terbit.
import { baseUrl, entryUrl } from "../lib/seo.js";

const x = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function onRequestGet({ request, env }) {
  const base = baseUrl(env, request.url);
  let rows = [];
  try {
    ({ results: rows } = await env.DB.prepare("SELECT id, date, updated_at FROM entries WHERE published = 1 ORDER BY date DESC").all());
  } catch { /* tetap sajikan halaman utama */ }
  const last = (r) => (r.updated_at || r.date).slice(0, 10);
  const newest = rows.map(last).sort().pop();
  const urls = [`  <url><loc>${x(base + "/")}</loc>${newest ? `<lastmod>${newest}</lastmod>` : ""}</url>`]
    .concat(rows.map((r) => `  <url><loc>${x(entryUrl(base, r.id))}</loc><lastmod>${last(r)}</lastmod></url>`));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}

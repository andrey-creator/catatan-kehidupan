// GET /robots.txt — memuat alamat sitemap yang absolut.
import { baseUrl } from "../lib/seo.js";

export async function onRequestGet({ request, env }) {
  const base = baseUrl(env, request.url);
  const txt = `User-agent: *\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${base}/sitemap.xml\n`;
  return new Response(txt, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}

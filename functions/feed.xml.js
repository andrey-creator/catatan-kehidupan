// GET /feed.xml — RSS 2.0 untuk 30 tulisan terbaru yang terbit. /feed.xml?lang=en memakai versi English bila ada.
import { baseUrl, entryUrl, excerpt, bodyHtml, pageLang, localize, SITE_NAME, AUTHOR } from "../lib/seo.js";
import { ensureLang } from "../lib/util.js";
import i18n from "../public/assets/i18n.js";

const x = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cdata = (s) => "<![CDATA[" + String(s).replace(/]]>/g, "]]]]><![CDATA[>") + "]]>";
const rfc = (d) => new Date(`${d}T12:00:00Z`).toUTCString();

export async function onRequestGet({ request, env }) {
  const base = baseUrl(env, request.url);
  const lang = pageLang(request.url);
  let rows = [];
  try {
    await ensureLang(env);
    ({ results: rows } = await env.DB.prepare(
      "SELECT id, date, tag, title, body, tag_en, title_en, body_en, updated_at FROM entries WHERE published = 1 ORDER BY date DESC LIMIT 30"
    ).all());
    rows = rows.map((r) => localize(r, lang));
  } catch { /* tetap sajikan feed kosong */ }

  const items = rows.map((r) => {
    const url = entryUrl(base, r.id, r.lang);
    return `    <item>
      <title>${x(r.title)}</title>
      <link>${x(url)}</link>
      <guid isPermaLink="true">${x(url)}</guid>
      <pubDate>${rfc(r.date)}</pubDate>
      <category>${x(r.tag)}</category>
      <dc:creator>${x(AUTHOR)}</dc:creator>
      <dc:language>${r.lang}</dc:language>
      <description>${x(excerpt(r.body))}</description>
      <content:encoded>${cdata(bodyHtml(r.body, base))}</content:encoded>
    </item>`;
  });

  const newest = rows.length ? rfc(rows[0].date) : new Date().toUTCString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${x(SITE_NAME)}</title>
    <link>${x(base + "/")}</link>
    <atom:link href="${x(base + "/feed.xml" + (lang === "en" ? "?lang=en" : ""))}" rel="self" type="application/rss+xml"/>
    <description>${x(i18n.t(lang, "site_desc", { author: AUTHOR }))}</description>
    <language>${lang}</language>
    <lastBuildDate>${newest}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}

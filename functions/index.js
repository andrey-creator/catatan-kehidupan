// GET / (dan /?lang=en) — index.html + canonical, og:url, og:image (URL absolut) + daftar tulisan yang sudah dirender di server.
import { baseUrl, homeTags, homeHtml, pageLang, localize, langRewrites } from "../lib/seo.js";
import { ensureLang } from "../lib/util.js";
import i18n from "../public/assets/i18n.js";

export async function onRequestGet({ request, env }) {
  const res = await env.ASSETS.fetch(request);
  if (!res.ok || !(res.headers.get("Content-Type") || "").includes("text/html")) return res;

  const lang = pageLang(request.url);
  let rows = null;
  try {
    await ensureLang(env);
    ({ results: rows } = await env.DB.prepare(
      "SELECT id, date, tag, title, body, tag_en, title_en, body_en FROM entries WHERE published = 1 ORDER BY date DESC, created_at DESC"
    ).all());
  } catch { /* database belum siap: biarkan app.js yang menggambar beranda */ }

  const tags = homeTags(baseUrl(env, request.url), lang);
  const set = (v) => ({ element(el) { el.setAttribute("content", v); } });
  let rw = langRewrites(new HTMLRewriter(), lang).on("head", { element(el) { el.append("\n  " + tags + "\n", { html: true }); } });
  if (lang === "en") {
    const desc = i18n.t("en", "site_desc", { author: "Aryasatya Keandre Ramadhan" });
    rw = rw.on('meta[name="description"]', set(`Catatan Kehidupan — ${desc}`)).on('meta[property="og:description"]', set(desc))
      .on("title", { element(el) { el.setInnerContent(`Catatan Kehidupan — ${i18n.t("en", "tagline").replace(/\.$/, "")} — Aryasatya Keandre Ramadhan`); } });
  }
  if (rows) rw = rw.on("main#app", { element(el) { el.setInnerContent(homeHtml(rows.map((r) => localize(r, lang)), lang), { html: true }); } });

  const out = rw.transform(res);
  const headers = new Headers(out.headers);
  headers.delete("Content-Length");
  headers.delete("ETag");
  headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  return new Response(out.body, { status: out.status, headers });
}

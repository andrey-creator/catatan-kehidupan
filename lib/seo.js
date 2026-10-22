// Pembangun tag SEO bersama: canonical, Open Graph, JSON-LD, ringkasan, dan HTML tulisan untuk crawler.
import i18n from "../public/assets/i18n.js"; // kamus ID/EN yang sama dengan yang dipakai browser
const T = (lang, key, vars) => i18n.t(lang, key, vars);

export const SITE_NAME = "Catatan Kehidupan";
export const AUTHOR = "Aryasatya Keandre Ramadhan";

export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Alamat dasar: SITE_URL (jika valid) atau alamat yang sedang dibuka. Selalu berupa origin saja.
export function baseUrl(env, requestUrl) {
  try {
    const u = new URL(env.SITE_URL);
    if (u.protocol === "https:" || u.protocol === "http:") return u.origin;
  } catch { /* pakai alamat permintaan */ }
  return new URL(requestUrl).origin;
}

// Bahasa halaman dari alamat: ?lang=en → "en", selain itu "id".
export const pageLang = (requestUrl) => (new URL(requestUrl).searchParams.get("lang") === "en" ? "en" : "id");
export const hasEn = (r) => !!(r && r.title_en && r.body_en);
// Satu baris tulisan dalam bahasa yang diminta. Tanpa versi English, isi Indonesia dipakai dan `missing` bernilai true.
export function localize(r, lang) {
  const en = lang === "en" && hasEn(r);
  return { ...r, title: en ? r.title_en : r.title, body: en ? r.body_en : r.body, tag: en && r.tag_en ? r.tag_en : r.tag, lang: en ? "en" : "id", missing: lang === "en" && !en };
}
export const langQ = (lang) => (lang === "en" ? "?lang=en" : "");
// Penanda bahasa pada <html> dan og:locale untuk halaman yang dirender dari index.html.
export function langRewrites(rw, lang) {
  return rw
    .on("html", { element(el) { el.setAttribute("lang", lang); } })
    .on('meta[property="og:locale"]', { element(el) { el.setAttribute("content", lang === "en" ? "en_US" : "id_ID"); } });
}
// <link rel="alternate" hreflang> untuk halaman yang punya dua versi.
function alternates(urlId, urlEn) {
  return [
    `<link rel="alternate" hreflang="id" href="${esc(urlId)}">`,
    `<link rel="alternate" hreflang="en" href="${esc(urlEn)}">`,
    `<link rel="alternate" hreflang="x-default" href="${esc(urlId)}">`,
  ];
}

const IMG_TAGS = (img, lang = "id") => [
  `<meta property="og:image" content="${esc(img)}">`,
  `<meta property="og:image:type" content="image/png">`,
  `<meta property="og:image:width" content="1200">`,
  `<meta property="og:image:height" content="630">`,
  `<meta property="og:image:alt" content="${SITE_NAME} — ${T(lang, "tagline").replace(/\.$/, "").toLowerCase()}.">`,
  `<meta name="twitter:image" content="${esc(img)}">`,
];

// Akun resmi penulis; membantu Google menghubungkan nama ini dengan situs dan profil Anda.
// Samakan dengan tautan di public/index.html dan public/assets/config.js.
const SAME_AS = [
  "https://www.instagram.com/andreyson_hamilton_a",
  "https://youtube.com/@aryasatyakeandre",
  "https://potret-kehidupan.pages.dev/",
];

// Data terstruktur beranda: siapa penulisnya (Person) dan situs apa ini (WebSite).
export function homeJsonLd(base, lang = "id") {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${base}/#person`,
        name: AUTHOR,
        alternateName: "Aryasatya Keandre",
        url: `${base}/`,
        sameAs: SAME_AS,
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        name: SITE_NAME,
        url: `${base}/`,
        inLanguage: ["id", "en"],
        description: T(lang, "site_desc", { author: AUTHOR }),
        author: { "@id": `${base}/#person` },
        publisher: { "@id": `${base}/#person` },
      },
    ],
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// Halaman utama.
export function homeTags(base, lang = "id") {
  const page = `${base}/${langQ(lang)}`;
  return [
    `<link rel="canonical" href="${esc(page)}">`,
    ...alternates(`${base}/`, `${base}/?lang=en`),
    `<meta property="og:url" content="${esc(page)}">`,
    ...IMG_TAGS(`${base}/og-image.png`, lang),
    `<script type="application/ld+json">${homeJsonLd(base, lang)}</script>`,
  ].join("\n  ");
}

// Foto di dalam tulisan: satu paragraf berisi [[foto:ID|keterangan]] (keterangan default = nama berkas).
const PHOTO = /^\[\[foto:([A-Za-z0-9_-]{6,40})\|([^\]\n]{0,200})\]\]$/;
const PHOTO_ANY = /\[\[foto:[A-Za-z0-9_-]{6,40}\|[^\]\n]{0,200}\]\]/g;
export const photoIds = (body) => [...String(body).matchAll(/\[\[foto:([A-Za-z0-9_-]{6,40})\|/g)].map((m) => m[1]);

// Tautan di paragraf: [teks](https://…) atau alamat http(s) polos → <a>. Hanya http/https; teks selalu di-escape.
const LINK = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>"']+)/g;
export function linkify(raw) {
  const a = (url, text) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer nofollow">${esc(text)}</a>`;
  let out = "", last = 0, m;
  LINK.lastIndex = 0;
  while ((m = LINK.exec(raw))) {
    out += esc(raw.slice(last, m.index));
    if (m[1]) out += a(m[2], m[1]);
    else {
      const t = m[3].match(/^(.*?)([.,;:!?)\]]*)$/);
      out += a(t[1], t[1]) + esc(t[2]);
    }
    last = m.index + m[0].length;
  }
  return out + esc(raw.slice(last));
}

// Isi tulisan → HTML: paragraf biasa, dan <figure> + <figcaption> untuk foto. `base` (opsional) membuat alamat foto absolut (RSS).
function inlineFormat(raw) {
  return linkify(raw)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/(^|[^_])_([^_\n]+)_(?!_)/g, "$1<em>$2</em>");
}

// Isi tulisan mendukung Markdown ringan: heading, tebal/miring, kutipan, dan daftar.
export function bodyHtml(body, base = "") {
  return String(body).split(/\n{2,}/).map((block) => {
    const p = block.trim();
    if (!p) return "";
    const photo = p.match(PHOTO);
    if (photo) {
      return `<figure class="foto"><img src="${esc(base)}/foto/${photo[1]}" alt="${esc(photo[2])}" loading="lazy">` +
        (photo[2] ? `<figcaption>${esc(photo[2])}</figcaption>` : "") + `</figure>`;
    }
    const heading = p.match(/^(#{2,3})\s+([\s\S]*)$/);
    if (heading) {
      const level = heading[1].length + 1;
      return `<h${level}>${inlineFormat(heading[2])}</h${level}>`;
    }
    if (/^>\s?/.test(p)) {
      return `<blockquote>${p.split("\n").map((line) => inlineFormat(line.replace(/^>\s?/, ""))).join("<br>")}</blockquote>`;
    }
    const lines = p.split("\n");
    if (lines.every((line) => /^\s*[-*+]\s+/.test(line))) {
      return `<ul>${lines.map((line) => `<li>${inlineFormat(line.replace(/^\s*[-*+]\s+/, ""))}</li>`).join("")}</ul>`;
    }
    if (lines.every((line) => /^\s*\d+[.)]\s+/.test(line))) {
      return `<ol>${lines.map((line) => `<li>${inlineFormat(line.replace(/^\s*\d+[.)]\s+/, ""))}</li>`).join("")}</ol>`;
    }
    return `<p>${inlineFormat(p).replace(/\n/g, "<br>")}</p>`;
  }).join("");
}

export function excerpt(body, max = 155) {
  const t = String(body).replace(PHOTO_ANY, " ").replace(/\[([^\]\n]+)\]\(https?:\/\/[^\s)]+\)/g, "$1").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

export const entryUrl = (base, id, lang = "id") => `${base}/tulisan/${encodeURIComponent(id)}${langQ(lang)}`;

export function jsonLd(e, base) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: e.title,
    description: excerpt(e.body),
    datePublished: e.date,
    dateModified: (e.updated_at || e.date).slice(0, 10),
    inLanguage: e.lang || "id",
    articleSection: e.tag,
    url: entryUrl(base, e.id, e.lang),
    mainEntityOfPage: entryUrl(base, e.id, e.lang),
    image: `${base}/og-image.png`,
    author: { "@type": "Person", "@id": `${base}/#person`, name: AUTHOR },
    isPartOf: { "@type": "Blog", name: SITE_NAME, url: `${base}/` },
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// Tag yang ditambahkan ke <head> halaman satu tulisan.
export function entryTags(e, base) {
  const url = entryUrl(base, e.id, e.lang); // tulisan tanpa versi English: canonical tetap ke versi Indonesia
  return [
    `<link rel="canonical" href="${esc(url)}">`,
    ...(hasEn(e) ? alternates(entryUrl(base, e.id), entryUrl(base, e.id, "en")) : []),
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="article:published_time" content="${esc(e.date)}">`,
    `<meta property="article:section" content="${esc(e.tag)}">`,
    `<meta property="article:author" content="${esc(AUTHOR)}">`,
    ...IMG_TAGS(`${base}/og-image.png`, e.lang),
    `<script type="application/ld+json">${jsonLd(e, base)}</script>`,
  ].join("\n  ");
}

// Halaman /tentang. `about` = { title, desc, paragraphs } dari lib/about.js untuk bahasa yang dipilih.
export function aboutJsonLd(base, lang = "id", about = {}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: `${base}/tentang${langQ(lang)}`,
    name: `${about.title || "Tentang"} — ${SITE_NAME}`,
    inLanguage: lang,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: `${base}/` },
    mainEntity: { "@type": "Person", "@id": `${base}/#person`, name: AUTHOR, url: `${base}/`, sameAs: SAME_AS },
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function aboutTags(base, lang = "id", about = {}) {
  const url = `${base}/tentang${langQ(lang)}`;
  return [
    `<link rel="canonical" href="${esc(url)}">`,
    ...alternates(`${base}/tentang`, `${base}/tentang?lang=en`),
    `<meta property="og:url" content="${esc(url)}">`,
    ...IMG_TAGS(`${base}/og-image.png`, lang),
    `<script type="application/ld+json">${aboutJsonLd(base, lang, about)}</script>`,
  ].join("\n  ");
}

export function aboutHtml(about, potretUrl, lang = "id") {
  const link = (p) => {
    const t = esc(p);
    return potretUrl ? t.replace("Potret Kehidupan", `<a href="${esc(potretUrl)}" target="_blank" rel="noreferrer">Potret Kehidupan</a>`) : t;
  };
  return `<article class="about"><a class="back up" href="/${langQ(lang)}">${esc(T(lang, "back"))}</a>` +
    `<h1>${esc(about.title)}</h1><div class="body">${about.paragraphs.map((p) => `<p>${link(p)}</p>`).join("")}</div></article>`;
}

export function formatDate(d, lang = "id") { return i18n.date(lang, d); }

// Isi tulisan sebagai HTML (teks di-escape) agar terbaca crawler dan muncul tanpa menunggu JavaScript.
export function shareHtml(title, url, lang = "id") {
  const wa = "https://wa.me/?text=" + encodeURIComponent(title + "\n" + url);
  return `<div class="share"><span class="up">${esc(T(lang, "share"))}</span>` +
    `<button type="button" class="chip" data-copy><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg> ${esc(T(lang, "copy"))}</button>` +
    `<a class="chip" href="${esc(wa)}" target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/></svg> WhatsApp</a>` +
    `<button type="button" class="chip" data-share hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M5 12v8h14v-8"/></svg> ${esc(T(lang, "more"))}</button>` +
    `<span class="up share-note" role="status" aria-live="polite"></span></div>`;
}

const readMin = (b, lang = "id") => T(lang, "read_time", { n: Math.max(1, Math.round(String(b).split(/\s+/).length / 200)) });

// `e` sudah dilokalkan (localize); `lang` = bahasa halaman (untuk teks antarmuka).
export function articleHtml(e, base, lang = "id") {
  const paras = bodyHtml(e.body);
HEAD
  return `<article><a class="back up" href="/">← Semua tulisan</a>` +
    `<div class="up mt">${esc(formatDate(e.date))} · <span class="tag">${esc(e.tag)}</span> · ${readMin(e.body)}</div>` +
    `<h1>${esc(e.title)}</h1><div class="body">${paras}</div>` +
    (base ? shareHtml(e.title, entryUrl(base, e.id)) : "") + `</article>`;

  return `<article${e.missing ? ' lang="id"' : ""}><a class="back up" href="/${langQ(lang)}">${esc(T(lang, "back"))}</a>` +
    `<div class="up mt">${esc(formatDate(e.date, lang))} · <span class="tag">${esc(e.tag)}</span> · ${readMin(e.body, lang)}</div>` +
    `<h1>${esc(e.title)}</h1>` +
    (e.missing ? `<p class="lang-note" lang="${lang}">${esc(T(lang, "only_id"))}</p>` : "") +
    `<div class="body">${paras}</div>` +
    (base ? shareHtml(e.title, entryUrl(base, e.id, lang), lang) : "") + `</article>`;
11126f3 (ideng)
}

// Beranda sebagai HTML (sama dengan yang digambar app.js) agar daftar tulisan terbaca crawler tanpa JavaScript.
// `rows` sudah dilokalkan (localize).
export const SITE_TAGLINE = i18n.STR.id.tagline;

export function homeHtml(rows, lang = "id") {
  const tags = [];
  rows.forEach((r) => { if (!tags.includes(r.tag)) tags.push(r.tag); });
  const chips = `<button class="chip" aria-pressed="true" data-tag="">${esc(T(lang, "all"))}</button>` +
    tags.map((t) => `<button class="chip" aria-pressed="false" data-tag="${esc(t)}">${esc(t)}</button>`).join("");
  const items = rows.length
    ? rows.map((r) =>
        `<a class="entry" href="/tulisan/${encodeURIComponent(r.id)}${langQ(lang)}"><time class="up">${esc(formatDate(r.date, lang))}</time>` +
        `<div><h2>${esc(r.title)}</h2><p>${esc(excerpt(r.body, 150))}</p></div>` +
        `<div class="up rt"><span class="tag">${esc(r.tag)}</span><br>${readMin(r.body, lang)}` +
        (r.missing ? ` <span class="lang-badge" title="${esc(T(lang, "badge_id_title"))}">${esc(T(lang, "badge_id"))}</span>` : "") + `</div></a>`).join("")
    : `<p class="empty">${esc(T(lang, "empty"))}</p>`;
  return `<header class="hero shell"><div class="meta up"><span>${esc(T(lang, "meta_left"))}</span><span>${esc(T(lang, "meta_right", { year: new Date().getFullYear() }))}</span></div>` +
    `<h1>Catatan<br>Kehidupan</h1><p class="note">${esc(T(lang, "tagline"))}</p>` +
    `<p class="lede">${esc(T(lang, "lede", { author: AUTHOR }))}</p></header>` +
    `<section class="shell"><div class="tools"><div class="chips">${chips}</div>` +
    `<input class="search" id="q" type="search" placeholder="${esc(T(lang, "search_ph"))}" aria-label="${esc(T(lang, "search_aria"))}" value=""></div>${items}</section>`;
}

// Pembangun tag SEO bersama: canonical, Open Graph, JSON-LD, ringkasan, dan HTML tulisan untuk crawler.
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

const IMG_TAGS = (img) => [
  `<meta property="og:image" content="${esc(img)}">`,
  `<meta property="og:image:type" content="image/png">`,
  `<meta property="og:image:width" content="1200">`,
  `<meta property="og:image:height" content="630">`,
  `<meta property="og:image:alt" content="${SITE_NAME} — kepingan hidup dalam kalimat.">`,
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
export function homeJsonLd(base) {
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
        inLanguage: "id",
        description: "Kepingan hidup dalam kalimat. Jurnal tulisan " + AUTHOR + ".",
        author: { "@id": `${base}/#person` },
        publisher: { "@id": `${base}/#person` },
      },
    ],
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// Halaman utama.
export function homeTags(base) {
  const page = `${base}/`;
  return [
    `<link rel="canonical" href="${esc(page)}">`,
    `<meta property="og:url" content="${esc(page)}">`,
    ...IMG_TAGS(`${base}/og-image.png`),
    `<script type="application/ld+json">${homeJsonLd(base)}</script>`,
  ].join("\n  ");
}

export function excerpt(body, max = 155) {
  const t = String(body).replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

export const entryUrl = (base, id) => `${base}/tulisan/${encodeURIComponent(id)}`;

export function jsonLd(e, base) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: e.title,
    description: excerpt(e.body),
    datePublished: e.date,
    dateModified: (e.updated_at || e.date).slice(0, 10),
    inLanguage: "id",
    articleSection: e.tag,
    url: entryUrl(base, e.id),
    mainEntityOfPage: entryUrl(base, e.id),
    image: `${base}/og-image.png`,
    author: { "@type": "Person", "@id": `${base}/#person`, name: AUTHOR },
    isPartOf: { "@type": "Blog", name: SITE_NAME, url: `${base}/` },
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// Tag yang ditambahkan ke <head> halaman satu tulisan.
export function entryTags(e, base) {
  const url = entryUrl(base, e.id);
  return [
    `<link rel="canonical" href="${esc(url)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="article:published_time" content="${esc(e.date)}">`,
    `<meta property="article:section" content="${esc(e.tag)}">`,
    `<meta property="article:author" content="${esc(AUTHOR)}">`,
    ...IMG_TAGS(`${base}/og-image.png`),
    `<script type="application/ld+json">${jsonLd(e, base)}</script>`,
  ].join("\n  ");
}

// Halaman /tentang.
export function aboutJsonLd(base) {
  const data = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: `${base}/tentang`,
    name: `Tentang — ${SITE_NAME}`,
    inLanguage: "id",
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: `${base}/` },
    mainEntity: { "@type": "Person", "@id": `${base}/#person`, name: AUTHOR, url: `${base}/`, sameAs: SAME_AS },
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function aboutTags(base) {
  const url = `${base}/tentang`;
  return [
    `<link rel="canonical" href="${esc(url)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    ...IMG_TAGS(`${base}/og-image.png`),
    `<script type="application/ld+json">${aboutJsonLd(base)}</script>`,
  ].join("\n  ");
}

export function aboutHtml(paragraphs, potretUrl) {
  const link = (p) => {
    const t = esc(p);
    return potretUrl ? t.replace("Potret Kehidupan", `<a href="${esc(potretUrl)}" target="_blank" rel="noreferrer">Potret Kehidupan</a>`) : t;
  };
  return `<article class="about"><a class="back up" href="/">← Semua tulisan</a>` +
    `<h1>Tentang</h1><div class="body">${paragraphs.map((p) => `<p>${link(p)}</p>`).join("")}</div></article>`;
}

const BLN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
export function formatDate(d) {
  const p = d.split("-");
  return `${+p[2]} ${BLN[+p[1] - 1]} ${p[0]}`;
}

// Isi tulisan sebagai HTML (teks di-escape) agar terbaca crawler dan muncul tanpa menunggu JavaScript.
export function shareHtml(title, url) {
  const wa = "https://wa.me/?text=" + encodeURIComponent(title + "\n" + url);
  return `<div class="share"><span class="up">Bagikan</span>` +
    `<button type="button" class="chip" data-copy><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg> Salin tautan</button>` +
    `<a class="chip" href="${esc(wa)}" target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/></svg> WhatsApp</a>` +
    `<button type="button" class="chip" data-share hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M5 12v8h14v-8"/></svg> Lainnya</button>` +
    `<span class="up share-note" role="status" aria-live="polite"></span></div>`;
}

export function articleHtml(e, base) {
  const paras = String(e.body).split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
  return `<article><a class="back up" href="/">← Semua tulisan</a>` +
    `<div class="up mt">${esc(formatDate(e.date))} · <span class="tag">${esc(e.tag)}</span></div>` +
    `<h1>${esc(e.title)}</h1><div class="body">${paras}</div>` +
    (base ? shareHtml(e.title, entryUrl(base, e.id)) : "") + `</article>`;
}

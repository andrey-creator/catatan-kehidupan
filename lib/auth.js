// Login admin tanpa layanan pihak ketiga: kata sandi (secret Cloudflare) + cookie sesi bertanda tangan HMAC.
const enc = new TextEncoder();
const dec = new TextDecoder();
export const COOKIE = "__Host-session";
const MAX_AGE = 7 * 24 * 3600; // 7 hari
const ATTR = "Path=/; HttpOnly; Secure; SameSite=Strict";

function b64u(buf) {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function unb64u(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}
const hmacKey = (secret, use) => crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, use);

// Gagal tertutup: tanpa konfigurasi yang kuat, login dan admin ditolak.
export function configProblem(env) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) return "SESSION_SECRET belum diisi (minimal 32 karakter).";
  if (!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < 12) return "ADMIN_PASSWORD belum diisi atau terlalu pendek (minimal 12 karakter).";
  return null;
}

// Perbandingan waktu-konstan: bandingkan HMAC dari kedua teks dengan kunci acak.
export async function passwordMatches(input, env) {
  const k = await crypto.subtle.generateKey({ name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const a = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(String(input ?? ""))));
  const b = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(env.ADMIN_PASSWORD)));
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

export async function createSessionCookie(env) {
  const payload = b64u(enc.encode(JSON.stringify({ exp: Date.now() + MAX_AGE * 1000 })));
  const sig = b64u(await crypto.subtle.sign("HMAC", await hmacKey(env.SESSION_SECRET, ["sign"]), enc.encode(payload)));
  return `${COOKIE}=${payload}.${sig}; ${ATTR}; Max-Age=${MAX_AGE}`;
}
export const clearCookie = `${COOKIE}=; ${ATTR}; Max-Age=0`;

export async function hasValidSession(request, env) {
  const c = (request.headers.get("Cookie") || "").split(/;\s*/).find((x) => x.startsWith(COOKIE + "="));
  if (!c) return false;
  const [p, s] = c.slice(COOKIE.length + 1).split(".");
  if (!p || !s) return false;
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(env.SESSION_SECRET, ["verify"]), unb64u(s), enc.encode(p));
    if (!ok) return false;
    const { exp } = JSON.parse(dec.decode(unb64u(p)));
    return typeof exp === "number" && exp > Date.now();
  } catch { return false; }
}

// Permintaan yang mengubah sesuatu harus datang dari situs ini sendiri.
export const sameOrigin = (request) => request.headers.get("Origin") === new URL(request.url).origin;
export const isJson = (request) => (request.headers.get("Content-Type") || "").startsWith("application/json");

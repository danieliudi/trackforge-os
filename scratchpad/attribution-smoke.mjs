/**
 * Smoke do content_id / URL de atribuição / encurtador (PRD rastreio §5 + Fase 3).
 * Roda sem browser: `node scratchpad/attribution-smoke.mjs`
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

// Espelha a lógica de allocateContentId / buildQrCodeUrl / shortener sem localStorage.
function allocate(prefix, taken) {
  for (let i = 0; i < 32; i++) {
    const id = `${prefix}-${randomUUID().replace(/-/g, "").slice(0, 4)}`;
    if (!taken.has(id)) return id;
  }
  throw new Error("falhou alocar");
}

function buildUrl({ base, contentId, campaignName, path }) {
  const url = new URL(path ? `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}` : base);
  url.searchParams.set("utm_source", "qr");
  url.searchParams.set("utm_medium", "impresso");
  if (campaignName) url.searchParams.set("utm_campaign", campaignName);
  url.searchParams.set("utm_content", contentId.toLowerCase());
  return url.toString();
}

function getShortenerBase(envValue) {
  const raw = (envValue || "").trim();
  if (!raw) return null;
  try {
    const withProto = raw.includes("://") ? raw : `https://${raw}`;
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.origin;
  } catch {
    return null;
  }
}

function buildShortUrl(base, contentId) {
  if (!base) return null;
  const id = String(contentId || "").trim().toLowerCase();
  if (!/^(rb|sw)-[0-9a-f]{4}$/.test(id)) return null;
  return `${base}/${id}`;
}

const taken = new Set();
const a = allocate("rb", taken);
taken.add(a);
const b = allocate("rb", taken);
assert.match(a, /^rb-[0-9a-f]{4}$/);
assert.match(b, /^rb-[0-9a-f]{4}$/);
assert.notEqual(a, b);

const url = buildUrl({
  base: "https://resibag.com.br",
  contentId: "rb-7a2f",
  campaignName: "resibag-202609-rapp",
  path: "rapp",
});
assert.equal(
  url,
  "https://resibag.com.br/rapp?utm_source=qr&utm_medium=impresso&utm_campaign=resibag-202609-rapp&utm_content=rb-7a2f",
);

// Sem domínio: short = null (QR continua na URL completa).
assert.equal(getShortenerBase(""), null);
assert.equal(buildShortUrl(null, "rb-7a2f"), null);

// Com domínio: short disponível, mas buildQrCodeUrl (preferShort=false) não usa.
const shortBase = getShortenerBase("https://go.exemplo.com.br");
assert.equal(shortBase, "https://go.exemplo.com.br");
assert.equal(buildShortUrl(shortBase, "rb-7a2f"), "https://go.exemplo.com.br/rb-7a2f");
assert.equal(buildShortUrl(shortBase, "INVALID"), null);

console.log("ok", { a, b, url, short: buildShortUrl(shortBase, "rb-7a2f") });

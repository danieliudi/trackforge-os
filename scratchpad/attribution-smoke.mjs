/**
 * Smoke do content_id / URL de atribuição (PRD rastreio §5).
 * Roda sem browser: `node scratchpad/attribution-smoke.mjs`
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

// Espelha a lógica de allocateContentId / buildQrCodeUrl sem localStorage.
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

console.log("ok", { a, b, url });

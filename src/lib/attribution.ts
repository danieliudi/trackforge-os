import type { BrandId } from "@/constants/brands";
import { getProductionsSnapshot } from "@/lib/produced";

/**
 * Identificador de peça e URL de atribuição (PRD rastreio §5).
 *
 * `content_id` nasce na produção, nunca no corpo do render. Colisão contra as
 * peças já guardadas em `produced.ts` gera outro sufixo — o TrackForge não tem
 * banco próprio, então o sufixo é aleatório (UUID truncado), não sequencial.
 */

export const CONTENT_ID_PREFIX: Record<BrandId, string> = {
  resibag: "rb",
  sanwey: "sw",
};

/** Landing usada no QR quando a peça ainda não tem path de conversão próprio. */
export const BRAND_LANDING: Record<BrandId, string> = {
  resibag: "https://resibag.com.br",
  sanwey: "https://www.sanwey.com.br",
};

const CONTENT_ID_RE = /^(rb|sw)-[0-9a-f]{4}$/;

export function isContentId(value: string): boolean {
  return CONTENT_ID_RE.test(value);
}

/** Forma falada/impressa: maiúsculas. Na URL, minúsculas. */
export function displayContentId(contentId: string): string {
  return contentId.toUpperCase();
}

/**
 * Aloca um `content_id` no formato `{frente}-{4 hex}` conferindo colisão
 * contra as produções já persistidas. Só chamar de callback / efeito agendado.
 */
export function allocateContentId(brandId: BrandId): string {
  const prefix = CONTENT_ID_PREFIX[brandId];
  const taken = new Set(
    getProductionsSnapshot()
      .map((item) => item.contentId)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  );

  for (let attempt = 0; attempt < 32; attempt += 1) {
    const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 4);
    const id = `${prefix}-${suffix}`;
    if (!taken.has(id)) return id;
  }

  // Extremamente improvável; sufixo maior evita travar a geração paga.
  const fallback = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `${prefix}-${fallback}`;
}

export type AttributionUrlInput = {
  brandId: BrandId;
  contentId: string;
  /** Nome da campanha (§5.3), idêntico a `utm_campaign`. */
  campaignName?: string | null;
  utmSource?: string;
  utmMedium?: string;
  /** Path relativo à landing da frente, sem barra inicial. Ex.: `rapp`. */
  path?: string | null;
};

/**
 * Monta a URL com UTM. Parâmetro vazio não entra — ruído na URL (PRD §5.4).
 */
export function buildAttributionUrl({
  brandId,
  contentId,
  campaignName,
  utmSource = "qr",
  utmMedium = "impresso",
  path,
}: AttributionUrlInput): string {
  const base = BRAND_LANDING[brandId].replace(/\/$/, "");
  const cleanedPath = (path ?? "").replace(/^\/+/, "").replace(/\/+$/, "");
  const url = new URL(cleanedPath ? `${base}/${cleanedPath}` : base);

  url.searchParams.set("utm_source", utmSource);
  url.searchParams.set("utm_medium", utmMedium);
  const campaign = campaignName?.trim();
  if (campaign) url.searchParams.set("utm_campaign", campaign);
  url.searchParams.set("utm_content", contentId.toLowerCase());

  return url.toString();
}

/** Atalho do QR impresso na peça (source=qr, medium=impresso). */
export function buildQrCodeUrl(
  brandId: BrandId,
  contentId: string,
  campaignName?: string | null,
  path?: string | null,
): string {
  return buildAttributionUrl({ brandId, contentId, campaignName, path });
}

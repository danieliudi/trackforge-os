import type { BrandId } from "@/constants/brands";
import { getProductionsSnapshot } from "@/lib/produced";

/**
 * Identificador de peça e URL de atribuição (PRD rastreio §5).
 *
 * `content_id` nasce na produção, nunca no corpo do render. Colisão contra as
 * peças já guardadas em `produced.ts` gera outro sufixo — o TrackForge não tem
 * banco próprio, então o sufixo é aleatório (UUID truncado), não sequencial.
 *
 * Encurtador (Fase 3): só emite short link se `NEXT_PUBLIC_SHORTENER_BASE`
 * estiver definido. Link publicado não aceita implementação parcial — sem
 * domínio estável o QR continua na URL completa com UTM.
 */

export const CONTENT_ID_PREFIX: Record<BrandId, string> = {
  resibag: "rb",
  sanwey: "sw",
  meu: "eu",
};

/** Landing usada no QR quando a peça ainda não tem path de conversão próprio. */
export const BRAND_LANDING: Record<BrandId, string> = {
  resibag: "https://resibag.com.br",
  sanwey: "https://www.sanwey.com.br",
  // Frente pessoal: sem site corporativo. QR só faz sentido com path explícito
  // depois — até lá a bancada esconde o bloco de atribuição CRM.
  meu: "",
};

const CONTENT_ID_RE = /^(rb|sw|eu)-[0-9a-f]{4}$/;

export function isContentId(value: string): boolean {
  return CONTENT_ID_RE.test(value);
}

export function hasBrandLanding(brandId: BrandId): boolean {
  return BRAND_LANDING[brandId].trim().length > 0;
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

/**
 * Base do encurtador (`NEXT_PUBLIC_SHORTENER_BASE`), ou null.
 * Não inventar domínio — sem env, short link não existe.
 */
export function getShortenerBase(): string | null {
  const raw = (process.env.NEXT_PUBLIC_SHORTENER_BASE || "").trim();
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

export function isShortenerConfigured(): boolean {
  return getShortenerBase() !== null;
}

/**
 * `{base}/{content_id}` em minúsculas. Null se encurtador off ou id inválido.
 * Não usar em material publicado até o host do domínio redirecionar de verdade.
 */
export function buildShortUrl(contentId: string): string | null {
  const base = getShortenerBase();
  if (!base) return null;
  const id = contentId.trim().toLowerCase();
  if (!CONTENT_ID_RE.test(id)) return null;
  return `${base}/${id}`;
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
  /**
   * Se true e o encurtador estiver configurado, devolve o short link.
   * Default false: QR/impresso só usa short quando Daniel ligar o domínio
   * E a rota de redirect estiver no ar.
   */
  preferShort?: boolean;
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
  preferShort = false,
}: AttributionUrlInput): string {
  if (preferShort) {
    const short = buildShortUrl(contentId);
    if (short) return short;
  }

  const base = BRAND_LANDING[brandId].replace(/\/$/, "");
  if (!base) {
    throw new Error("a frente Meu não tem landing para QR — peça pessoal fica sem atribuição web");
  }
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
  // preferShort fica false de propósito: sem domínio+redirect no ar,
  // short link em QR impresso é permanente e irrecuperável (PRD §3).
  return buildAttributionUrl({ brandId, contentId, campaignName, path });
}

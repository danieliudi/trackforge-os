import type { BrandId } from "@/constants/brands";
import { brands } from "@/constants/brands";
import { formatOptions, platformOptions, type Format, type Platform } from "@/constants/format";
import { slideThemes, type SlideThemeId } from "@/constants/themes";
import { apresentacaoSchema, carouselSchema, type Carousel } from "@/types/carousel";

/** Versionado: mudar o formato invalida o payload antigo em vez de quebrar. */
const KEY = "carousel-builder:drafts:v1";

const VALID_FORMATS = new Set(formatOptions.map(({ id }) => id));
const VALID_PLATFORMS = new Set(platformOptions.map(({ id }) => id));

export type Draft = {
  id: string;
  title: string;
  updatedAt: number;
  carousel: Carousel;
  themeId: SlideThemeId;
  brandId: BrandId | null;
  customLogo: string | null;
  format: Format;
  platform: Platform;
};

export type StoredState = {
  drafts: Draft[];
  activeId: string | null;
};

function isValidDraft(value: unknown): value is Draft {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Record<string, unknown>;

  // Formato decide qual schema valida o carrossel — Apresentação aceita até
  // 20 slides, e validar sempre pelo teto do carrossel (12) descartaria em
  // silêncio qualquer rascunho de apresentação mais longo que isso.
  if (typeof data.format !== "string" || !VALID_FORMATS.has(data.format as Format)) return false;
  const carouselValidator = data.format === "apresentacao" ? apresentacaoSchema : carouselSchema;

  return (
    typeof data.id === "string" &&
    typeof data.title === "string" &&
    typeof data.updatedAt === "number" &&
    carouselValidator.safeParse(data.carousel).success &&
    typeof data.themeId === "string" &&
    data.themeId in slideThemes &&
    (data.brandId === null || (typeof data.brandId === "string" && data.brandId in brands)) &&
    (data.customLogo === null || typeof data.customLogo === "string") &&
    typeof data.platform === "string" &&
    VALID_PLATFORMS.has(data.platform as Platform)
  );
}

/**
 * Lê os rascunhos salvos. Qualquer payload inválido é descartado em
 * silêncio: o schema é a fronteira, então um rascunho de uma versão antiga
 * do formato some da lista em vez de derrubar a tela na primeira renderização.
 */
export function loadState(): StoredState {
  if (typeof window === "undefined") return { drafts: [], activeId: null };

  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { drafts: [], activeId: null };

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return { drafts: [], activeId: null };
    const data = parsed as Record<string, unknown>;

    const drafts = Array.isArray(data.drafts) ? data.drafts.filter(isValidDraft) : [];
    const activeId = typeof data.activeId === "string" ? data.activeId : null;

    return {
      drafts,
      activeId: drafts.some((draft) => draft.id === activeId) ? activeId : null,
    };
  } catch {
    return { drafts: [], activeId: null };
  }
}

/**
 * Salva os rascunhos. Retorna false quando o navegador recusa.
 *
 * Imagem e logo entram como data URL, então vários rascunhos com uploads
 * passam fácil dos ~5MB de cota. Quem chama mostra o aviso: falhar calado
 * faria o usuário confiar num autosave que não existe.
 */
export function saveState(state: StoredState): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

const CONTEXT_KEY = "carousel-builder:brand-context:v1";

/** Estratégia/posicionamento colado pelo usuário — um texto por marca. */
export type BrandContext = Record<BrandId, string>;

const EMPTY_CONTEXT: BrandContext = { sanwey: "", resibag: "" };

export function loadBrandContext(): BrandContext {
  if (typeof window === "undefined") return EMPTY_CONTEXT;

  try {
    const raw = window.localStorage.getItem(CONTEXT_KEY);
    if (!raw) return EMPTY_CONTEXT;

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return EMPTY_CONTEXT;
    const data = parsed as Record<string, unknown>;

    return {
      sanwey: typeof data.sanwey === "string" ? data.sanwey : "",
      resibag: typeof data.resibag === "string" ? data.resibag : "",
    };
  } catch {
    return EMPTY_CONTEXT;
  }
}

export function saveBrandContext(context: BrandContext): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(CONTEXT_KEY, JSON.stringify(context));
    return true;
  } catch {
    return false;
  }
}

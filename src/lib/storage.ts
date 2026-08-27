import type { BrandId } from "@/constants/brands";
import { brands } from "@/constants/brands";
import { slideThemes, type SlideThemeId } from "@/constants/themes";
import { carouselSchema, type Carousel } from "@/types/carousel";

/** Versionado: mudar o formato invalida o payload antigo em vez de quebrar. */
const KEY = "carousel-builder:drafts:v1";

export type Draft = {
  id: string;
  title: string;
  updatedAt: number;
  carousel: Carousel;
  themeId: SlideThemeId;
  brandId: BrandId | null;
  customLogo: string | null;
};

export type StoredState = {
  drafts: Draft[];
  activeId: string | null;
};

function isValidDraft(value: unknown): value is Draft {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Record<string, unknown>;

  return (
    typeof data.id === "string" &&
    typeof data.title === "string" &&
    typeof data.updatedAt === "number" &&
    carouselSchema.safeParse(data.carousel).success &&
    typeof data.themeId === "string" &&
    data.themeId in slideThemes &&
    (data.brandId === null || (typeof data.brandId === "string" && data.brandId in brands)) &&
    (data.customLogo === null || typeof data.customLogo === "string")
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

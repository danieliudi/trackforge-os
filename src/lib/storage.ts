import type { BrandId } from "@/constants/brands";
import { brands } from "@/constants/brands";
import { slideThemes, type SlideThemeId } from "@/constants/themes";
import { carouselSchema, type Carousel } from "@/types/carousel";

/** Versionado: mudar o formato invalida o payload antigo em vez de quebrar. */
const KEY = "carousel-builder:session:v1";

export type Session = {
  carousel: Carousel | null;
  themeId: SlideThemeId;
  brandId: BrandId | null;
  customLogo: string | null;
};

/**
 * Lê a sessão salva. Qualquer payload inválido é descartado em silêncio: o
 * schema é a fronteira, então um carrossel de uma versão antiga do formato
 * volta como null em vez de derrubar a tela na primeira renderização.
 */
export function loadSession(): Partial<Session> | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const data = parsed as Record<string, unknown>;

    const carousel = carouselSchema.safeParse(data.carousel);
    const themeId = data.themeId;
    const brandId = data.brandId;
    const customLogo = data.customLogo;

    return {
      carousel: carousel.success ? carousel.data : null,
      themeId:
        typeof themeId === "string" && themeId in slideThemes
          ? (themeId as SlideThemeId)
          : undefined,
      brandId:
        typeof brandId === "string" && brandId in brands
          ? (brandId as BrandId)
          : null,
      customLogo: typeof customLogo === "string" ? customLogo : null,
    };
  } catch {
    return null;
  }
}

/**
 * Salva a sessão. Retorna false quando o navegador recusa.
 *
 * Imagem e logo entram como data URL, então um carrossel com uploads passa
 * fácil dos ~5MB de cota. Quem chama mostra o aviso: falhar calado faria o
 * usuário confiar num autosave que não existe.
 */
export function saveSession(session: Session): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // storage indisponível (modo privado); nada a limpar de qualquer forma
  }
}

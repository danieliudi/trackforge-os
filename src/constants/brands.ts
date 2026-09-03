import type { SlideThemeId } from "./themes";

export type BrandId = "sanwey" | "resibag";

export type Brand = {
  id: BrandId;
  label: string;
  /**
   * Arquivos em public/logos. Os dois manuais proíbem recriar o wordmark,
   * então estes apontam para os originais que precisam ser depositados ali.
   * Fundo escuro exige a versão invertida em ambos os manuais.
   */
  logoSrc: string;
  logoSrcOnDark: string;
  themeId: SlideThemeId;
  /**
   * "all" = logo em todos os slides.
   * "cover-and-last" = só na capa e no último slide.
   * Sanwey MIV v2.0: "Logo somente na capa e na última slide".
   * Resibag v9.0 (redes sociais): "Logo sempre presente (mínimo: ícone no canto)".
   */
  logoPolicy: "all" | "cover-and-last";
  /**
   * Assinatura institucional verbatim (footerNote) — fatos canônicos de cada
   * marca, nunca parafraseada. A IA não escreve isso; o servidor sobrescreve
   * o que ela gerar por este valor exato.
   */
  tagline: string;
};

export const brands: Record<BrandId, Brand> = {
  sanwey: {
    id: "sanwey",
    label: "Sanwey",
    logoSrc: "/logos/sanwey.svg",
    logoSrcOnDark: "/logos/sanwey-branco.svg",
    themeId: "sanwey",
    logoPolicy: "cover-and-last",
    tagline: "A marca que valoriza o seu produto.",
  },
  resibag: {
    id: "resibag",
    label: "Resibag",
    /**
     * Wordmark verde do kit (`#12855c` em public/logos/resibag.svg).
     * O preto (`resibag-preto.svg`) fica só se alguém precisar de monocromático.
     */
    logoSrc: "/logos/resibag.svg",
    logoSrcOnDark: "/logos/resibag-branco.svg",
    themeId: "resibag",
    logoPolicy: "all",
    tagline: "Gestão inteligente de resíduos industriais.",
  },
};

export const brandOptions = Object.values(brands).map(({ id, label }) => ({
  id,
  label,
}));

export function shouldShowLogo(
  policy: Brand["logoPolicy"],
  slideNumber: number,
  totalSlides: number,
) {
  if (policy === "all") return true;
  return slideNumber === 1 || slideNumber === totalSlides;
}

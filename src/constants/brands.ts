import { z } from "zod";

import type { SlideThemeId } from "./themes";

export const BRAND_IDS = ["sanwey", "resibag", "meu"] as const;
export type BrandId = (typeof BRAND_IDS)[number];

export const brandIdSchema = z.enum(BRAND_IDS);

/** Frente pessoal: gera e exporta local; nunca entra na fila do CRM. */
export function isPersonalFront(brandId: BrandId | null | undefined): boolean {
  return brandId === "meu";
}

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
    logoSrc: "/logos/resibag-preto.svg",
    logoSrcOnDark: "/logos/resibag-branco.svg",
    themeId: "resibag",
    logoPolicy: "all",
    tagline: "Gestão inteligente de resíduos industriais.",
  },
  meu: {
    id: "meu",
    label: "Meu",
    logoSrc: "/logos/meu.svg",
    logoSrcOnDark: "/logos/meu-branco.svg",
    themeId: "dark-modern",
    logoPolicy: "cover-and-last",
    tagline: "Trabalho pessoal — não é peça do Grupo.",
  },
};

export const brandOptions = Object.values(brands).map(({ id, label }) => ({
  id,
  label,
}));

export function brandLabel(brandId: BrandId | null | undefined): string {
  return brandId ? brands[brandId].label : "";
}

export function shouldShowLogo(
  policy: Brand["logoPolicy"],
  slideNumber: number,
  totalSlides: number,
) {
  if (policy === "all") return true;
  return slideNumber === 1 || slideNumber === totalSlides;
}

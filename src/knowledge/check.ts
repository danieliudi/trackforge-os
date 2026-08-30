import type { BrandId } from "@/constants/brands";
import type { Slide } from "@/types/carousel";

import { getBrandKnowledge } from "./index";

/**
 * Checagem determinística do texto gerado contra as proibições da marca.
 *
 * Custo zero e roda em microssegundos — não é uma segunda chamada de IA, é
 * varredura de string. Pega exatamente a classe de erro que já aconteceu de
 * verdade: um termo que a marca proíbe aparecendo numa peça pronta.
 *
 * O que ela NÃO pega: fato inventado que não é termo proibido — o "100%" sem
 * fonte, a data de vigência que não existe. Isso precisa de um verificador que
 * entenda a afirmação, não de regex.
 */
export type ForbiddenHit = {
  /** 0 quando a violação está fora de um slide específico. */
  slideNumber: number;
  /** O trecho que casou, para o aviso citar o que procurar. */
  matched: string;
  term: string;
  reason: string;
};

/**
 * Acento e caixa não podem esconder a violação: "Homologação Marítima" e
 * "homologacao maritima" são o mesmo problema. Os padrões são escritos já
 * normalizados (ver `BrandKnowledge.forbidden`).
 */
function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Todo texto visível de um slide, que é o que sai na peça. */
export function slideText(slide: Slide): string {
  return [
    slide.headline,
    slide.bodyText,
    slide.highlightTag,
    slide.footerNote,
    ...(slide.bullets ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

export function findForbidden(
  parts: { slideNumber: number; text: string }[],
  brandId: BrandId | null | undefined,
): ForbiddenHit[] {
  const knowledge = getBrandKnowledge(brandId);
  if (!knowledge) return [];

  const hits: ForbiddenHit[] = [];

  for (const part of parts) {
    const haystack = normalize(part.text);

    for (const rule of knowledge.forbidden) {
      for (const pattern of rule.match ?? []) {
        const found = pattern.exec(haystack);
        if (!found) continue;

        hits.push({
          slideNumber: part.slideNumber,
          matched: found[0].trim(),
          term: rule.term,
          reason: rule.reason,
        });
        break; // um acerto por regra já basta para o slide
      }
    }
  }

  return hits;
}

export function findForbiddenInSlides(
  slides: Slide[],
  brandId: BrandId | null | undefined,
): ForbiddenHit[] {
  return findForbidden(
    slides.map((slide) => ({ slideNumber: slide.slideNumber, text: slideText(slide) })),
    brandId,
  );
}

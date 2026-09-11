import { brands, type BrandId } from "@/constants/brands";
import { vozCarregaTagline, type VozId } from "@/constants/editorial";
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
  /** Slide no carrossel, seção no artigo. 0 quando é fora de um bloco. */
  blockNumber: number;
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
  parts: { blockNumber: number; text: string }[],
  brandId: BrandId | null | undefined,
  /**
   * Quem assina a peça. Opcional: sem voz, a varredura é a de sempre.
   *
   * Com voz, entra a regra que a Fase 4 trouxe — a assinatura institucional é
   * da PÁGINA, e pessoa carregando a mesma frase vira anúncio. Ela não é uma
   * entrada escrita à mão em `forbidden`: é DERIVADA de `brands[].tagline`, o
   * mesmo valor que o servidor carimba no `footerNote`. Uma fonte só, então a
   * regra não pode divergir da frase — que foi exatamente como a tagline antiga
   * da Resibag sobreviveu dois dias em `brands.ts` depois de virar proibida.
   */
  voz?: VozId | null,
): ForbiddenHit[] {
  const knowledge = getBrandKnowledge(brandId);
  if (!knowledge) return [];

  const hits: ForbiddenHit[] = [];

  // Regra de VOZ, antes das outras: é a única que depende de quem assina.
  if (brandId && voz && !vozCarregaTagline(brandId, voz)) {
    const assinatura = normalize(brands[brandId].tagline).replace(/[.!?]+\s*$/, "").trim();
    if (assinatura) {
      for (const part of parts) {
        if (!normalize(part.text).includes(assinatura)) continue;
        hits.push({
          blockNumber: part.blockNumber,
          matched: brands[brandId].tagline,
          term: "assinatura institucional em peça assinada por pessoa",
          reason:
            "a assinatura da marca é da PÁGINA da empresa. Numa peça que sai no perfil de uma pessoa ela vira anúncio, e é a primeira coisa que o leitor desconta. Quem assina aqui é a pessoa — o argumento fecha com o que ela tem a dizer, não com a frase da marca.",
        });
        break; // um acerto basta: a regra é da peça, não do bloco
      }
    }
  }

  for (const part of parts) {
    const haystack = normalize(part.text);

    for (const rule of knowledge.forbidden) {
      for (const pattern of rule.match ?? []) {
        const found = pattern.exec(haystack);
        if (!found) continue;

        hits.push({
          blockNumber: part.blockNumber,
          matched: found[0].trim(),
          term: rule.term,
          reason: rule.reason,
        });
        break; // um acerto por regra já basta para o slide
      }
    }
  }

  // Segundo passo: regras de COOCORRÊNCIA. O escopo delas é a PEÇA, não o
  // bloco — por isso não cabem no laço acima, que olha um bloco de cada vez e
  // para no primeiro acerto.
  for (const rule of knowledge.forbidden) {
    if (!rule.pair) continue;

    const primeiro = (padroes: RegExp[]) => {
      for (const part of parts) {
        const haystack = normalize(part.text);
        for (const pattern of padroes) {
          const found = pattern.exec(haystack);
          if (found) return { blockNumber: part.blockNumber, matched: found[0].trim() };
        }
      }
      return null;
    };

    const a = primeiro(rule.pair.a);
    if (!a) continue;
    const b = primeiro(rule.pair.b);
    if (!b) continue;

    hits.push({
      // Aponta para o bloco mais adiante dos dois: lendo a peça de cima para
      // baixo, é onde a violação se completou.
      blockNumber: Math.max(a.blockNumber, b.blockNumber),
      // Os dois trechos no mesmo campo de propósito: a tela já sabe renderizar
      // `matched`, e assim o achado novo aparece sem componente novo — que
      // exigiria mockup aprovado antes (seção 4).
      matched: `${a.matched} + ${b.matched}`,
      term: rule.term,
      reason: rule.reason,
    });
  }

  return hits;
}

export function findForbiddenInSlides(
  slides: Slide[],
  brandId: BrandId | null | undefined,
  voz?: VozId | null,
): ForbiddenHit[] {
  return findForbidden(
    slides.map((slide) => ({ blockNumber: slide.slideNumber, text: slideText(slide) })),
    brandId,
    voz,
  );
}

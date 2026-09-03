/**
 * Composição tipográfica do carrossel — eixo separado do tema de cor.
 *
 * Trocar só o tema (Resibag ESG → Escuro → Ativo) muda tinta, não a moldura:
 * capa com barra + headline no fundo, conteúdo centrado, CTA com botão+QR.
 * Sem composição distinta, a grade semanal parece a mesma peça recolhida.
 *
 * Estes presets mudam âncora, escala e chrome. Tokens de cor continuam no tema.
 */

export type CompositionId = "institucional" | "editorial" | "impacto";

export type Composition = {
  id: CompositionId;
  label: string;
  /** Uma linha: o que muda visualmente vs. o padrão. */
  blurb: string;
  /**
   * Âncora do bloco de texto em capa/conteúdo.
   * `end` = editorial (headline baixa sobre foto); `center` = institucional.
   */
  textAnchor: "start" | "center" | "end";
  /** Escala tipográfica relativa (1 = institucional). */
  typeScale: number;
  /** Tracking extra no display (somado ao do tema). */
  trackingBoost: string;
  /** Barra de acento na capa: fina institucional, faixa editorial, nenhuma no impacto. */
  coverBar: "thin" | "band" | "none";
  /** CTA: botão compacto + QR vs. faixa full-bleed. */
  ctaStyle: "button-qr" | "band-qr";
  /** Chrome do frame: contador e selo mais discretos no editorial. */
  chrome: "full" | "minimal";
};

export const compositions: Record<CompositionId, Composition> = {
  institucional: {
    id: "institucional",
    label: "Institucional",
    blurb: "Barra de acento, tipografia equilibrada, CTA com botão + QR.",
    textAnchor: "end",
    typeScale: 1,
    trackingBoost: "0",
    coverBar: "thin",
    ctaStyle: "button-qr",
    chrome: "full",
  },
  editorial: {
    id: "editorial",
    label: "Editorial",
    blurb: "Headline baixa e densa, faixa de acento, cromo enxuto — leitura de revista.",
    textAnchor: "end",
    typeScale: 1.08,
    trackingBoost: "-0.01em",
    coverBar: "band",
    ctaStyle: "button-qr",
    chrome: "minimal",
  },
  impacto: {
    id: "impacto",
    label: "Impacto",
    blurb: "Tipografia maior, sem barra, CTA em faixa — para parar o scroll.",
    textAnchor: "center",
    typeScale: 1.16,
    trackingBoost: "-0.02em",
    coverBar: "none",
    ctaStyle: "band-qr",
    chrome: "minimal",
  },
};

export const COMPOSITION_OPTIONS = Object.values(compositions).map(
  ({ id, label, blurb }) => ({ id, label, blurb }),
);

export const DEFAULT_COMPOSITION: CompositionId = "institucional";

export function isCompositionId(value: string): value is CompositionId {
  return value in compositions;
}

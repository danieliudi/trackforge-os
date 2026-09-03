import { z } from "zod";

import { carouselBaseSchema } from "./carousel";

/**
 * Os formatos que a esteira sabe produzir a partir de um artigo.
 *
 * POR QUE UM SCHEMA POR FORMATO, e não um "texto" genérico: o roteiro de Reels
 * precisa de tempo por bloco, o Stories precisa saber onde vai a enquete, e a
 * legenda do Instagram precisa do gancho separado porque o resto some atrás do
 * "ver mais". Um campo de texto solto entregaria as quatro coisas com a mesma
 * cara, e a diferença entre elas é justamente o que faz cada uma funcionar.
 */

/**
 * Cada opção é uma peça, e a plataforma faz parte da identidade dela: carrossel
 * de LinkedIn e de Instagram têm tom, densidade e capa diferentes. "Carrossel"
 * solto obrigaria a perguntar "de onde?" logo depois — pergunta a mais numa tela
 * cujo trabalho é ter uma decisão só.
 */
export type OutputKind =
  | "carrossel-linkedin"
  | "carrossel-instagram"
  | "post-texto"
  | "legenda"
  | "reels"
  | "stories";

export const outputKindSchema = z.enum([
  "carrossel-linkedin",
  "carrossel-instagram",
  "post-texto",
  "legenda",
  "reels",
  "stories",
]);

export type CarouselKind = Extract<OutputKind, `carrossel-${string}`>;
/** Formato de texto — tudo que não é slide. */
export type TextKind = Exclude<OutputKind, CarouselKind>;

/**
 * Carrossel é slide; o resto é texto. Decide schema, prompt e renderização.
 *
 * É predicado de tipo e não `boolean` para que o compilador estreite o `kind`
 * nos dois ramos — sem isso, quem chama precisa afirmar o tipo à mão, que é
 * exatamente onde um formato novo passaria batido.
 */
export const isCarousel = (kind: OutputKind): kind is CarouselKind =>
  kind.startsWith("carrossel-");

export const OUTPUT_META: Record<
  OutputKind,
  { label: string; platform: string; note: string }
> = {
  "carrossel-linkedin": {
    label: "Carrossel",
    platform: "LinkedIn",
    note: "Slides com densidade — a audiência já está em modo de aprender.",
  },
  "carrossel-instagram": {
    label: "Carrossel",
    platform: "Instagram",
    note: "Capa que segura o polegar, uma ideia por tela, feito pra salvar.",
  },
  "post-texto": {
    label: "Post de texto",
    platform: "LinkedIn",
    note: "Texto puro, sem imagem. É o que mais circula para norma e dado técnico.",
  },
  legenda: {
    label: "Legenda de post único",
    platform: "Instagram",
    note: "Uma imagem só. O gancho tem que segurar antes do “ver mais”.",
  },
  reels: {
    label: "Roteiro de Reels",
    platform: "Instagram",
    note: "Vídeo curto, com fala e o que aparece na tela por bloco.",
  },
  stories: {
    label: "Sequência de Stories",
    platform: "Instagram",
    note: "3 a 5 telas, com enquete ou caixa de pergunta. Some em 24h.",
  },
};

/** Post de texto do LinkedIn — o gancho é a única linha garantida antes do corte. */
export const postTextoSchema = z.object({
  hook: z.string().min(1).max(220),
  paragraphs: z.array(z.string().min(1)).min(3).max(9),
  cta: z.string().min(1).max(200),
});

export const legendaSchema = z.object({
  /** Primeira linha, a única visível antes do "ver mais". */
  hook: z.string().min(1).max(150),
  body: z.array(z.string().min(1)).min(1).max(4),
  cta: z.string().min(1).max(160),
  /** Sem invenção de tag de campanha; só termo que descreve o assunto. */
  hashtags: z.array(z.string().min(2).max(30)).max(8).default([]),
});

export const reelsSchema = z.object({
  hook: z.string().min(1).max(160),
  beats: z
    .array(
      z.object({
        seconds: z.number().int().min(1).max(30),
        /** O que é falado. */
        fala: z.string().min(1).max(320),
        /** O que aparece escrito na tela — curto, é legenda de vídeo. */
        naTela: z.string().min(1).max(70),
      }),
    )
    .min(3)
    .max(7),
  cta: z.string().min(1).max(160),
});

export const storiesSchema = z.object({
  screens: z
    .array(
      z.object({
        texto: z.string().min(1).max(180),
        /** Enquete ou caixa de pergunta, quando a tela pedir. */
        interacao: z.string().max(120).optional(),
      }),
    )
    .min(3)
    .max(5),
  cta: z.string().min(1).max(160),
});

export const OUTPUT_SCHEMAS = {
  "carrossel-linkedin": carouselBaseSchema,
  "carrossel-instagram": carouselBaseSchema,
  "post-texto": postTextoSchema,
  legenda: legendaSchema,
  reels: reelsSchema,
  stories: storiesSchema,
} as const;

export type PostTexto = z.infer<typeof postTextoSchema>;
export type Legenda = z.infer<typeof legendaSchema>;
export type Reels = z.infer<typeof reelsSchema>;
export type Stories = z.infer<typeof storiesSchema>;

/** Teto do rótulo de motivo. Vive fora do schema porque `normalizeArticle` corta por ele. */
export const MAX_SUGGESTION_REASON = 180;

/** Sugestão que o redator do artigo devolve junto — não custa chamada extra. */
export const outputSuggestionSchema = z.object({
  kind: outputKindSchema,
  /** Uma frase dizendo por que este formato serve a ESTE conteúdo. */
  reason: z.string().min(1).max(MAX_SUGGESTION_REASON),
});

export type OutputSuggestion = z.infer<typeof outputSuggestionSchema>;

/**
 * Texto corrido de uma peça pronta, para auditoria e para o pacote de aprovação.
 *
 * O auditor confere afirmação, não formato — então cada peça precisa saber se
 * achatar em blocos numerados, seja ela slide, parágrafo ou fala de vídeo.
 */
export function outputBlocks(
  kind: OutputKind,
  data: unknown,
): { number: number; label: string; text: string }[] {
  if (isCarousel(kind)) {
    const carousel = data as z.infer<typeof carouselBaseSchema>;
    return carousel.slides.map((slide) => ({
      number: slide.slideNumber,
      label: `slide ${slide.slideNumber}`,
      text: [slide.headline, slide.bodyText, ...(slide.bullets ?? [])].filter(Boolean).join(" "),
    }));
  }

  if (kind === "post-texto") {
    const post = data as PostTexto;
    return [
      { number: 0, label: "gancho", text: post.hook },
      ...post.paragraphs.map((paragraph, index) => ({
        number: index + 1,
        label: `parágrafo ${index + 1}`,
        text: paragraph,
      })),
      { number: post.paragraphs.length + 1, label: "chamada", text: post.cta },
    ];
  }

  if (kind === "legenda") {
    const legenda = data as Legenda;
    return [
      { number: 0, label: "gancho", text: legenda.hook },
      ...legenda.body.map((line, index) => ({
        number: index + 1,
        label: `linha ${index + 1}`,
        text: line,
      })),
      { number: legenda.body.length + 1, label: "chamada", text: legenda.cta },
    ];
  }

  if (kind === "reels") {
    const reels = data as Reels;
    return [
      { number: 0, label: "gancho", text: reels.hook },
      ...reels.beats.map((beat, index) => ({
        number: index + 1,
        label: `bloco ${index + 1} (${beat.seconds}s)`,
        text: `${beat.fala} ${beat.naTela}`,
      })),
      { number: reels.beats.length + 1, label: "chamada", text: reels.cta },
    ];
  }

  const stories = data as Stories;
  return [
    ...stories.screens.map((screen, index) => ({
      number: index + 1,
      label: `tela ${index + 1}`,
      text: [screen.texto, screen.interacao].filter(Boolean).join(" "),
    })),
    { number: stories.screens.length + 1, label: "chamada", text: stories.cta },
  ];
}

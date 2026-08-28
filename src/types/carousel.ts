import { z } from "zod";

export const MAX_BODY_LENGTH = 30;
export const MAX_BULLET_LENGTH = 70;
export const MIN_BULLETS = 2;
export const MAX_BULLETS = 6;

/** Fonte única de verdade — o schema valida e a UI trava os botões nos mesmos limites. */
export const MIN_SLIDES = 4;
export const MAX_SLIDES = 12;
/** Apresentação lê como documento, não como scroll — cabe mais conteúdo por peça. */
export const MAX_SLIDES_APRESENTACAO = 20;

/** Aceita URL remota ou data URL vinda de upload local. */
const IMAGE_SRC = /^(https?:\/\/|data:image\/)/i;
const HTTP_URL = /^https?:\/\//i;

export const imageLayoutSchema = z.enum(["background", "card", "split"]);

export const imageSchema = z.object({
  url: z.string().regex(IMAGE_SRC, "a imagem deve ser http(s) ou data:image"),
  layout: imageLayoutSchema,
});

export const slideTypeSchema = z.enum([
  "cover",
  "content",
  "quote",
  "data_metric",
  "cta",
  /** Lista de pontos — agenda, riscos, prioridades. Exclusivo de Apresentação. */
  "bullets",
  /** Divisor de bloco temático, tela cheia, quase sem texto. Exclusivo de Apresentação. */
  "section",
]);

export const slideSchema = z
  .object({
    slideNumber: z.number().int().positive(),
    type: slideTypeSchema,
    headline: z.string().min(1, "headline é obrigatório"),
    /** Não usado em "bullets"/"section" — o refine abaixo só exige nos demais tipos. */
    bodyText: z
      .string()
      .max(MAX_BODY_LENGTH, `bodyText deve ter no máximo ${MAX_BODY_LENGTH} caracteres`)
      .optional(),
    highlightTag: z.string().min(1).optional(),
    footerNote: z.string().min(1, "footerNote é obrigatório"),
    /** Imagem do slide e como ela ocupa o layout. */
    image: imageSchema.optional(),
    /** Destino do QR Code. Usado apenas no slide de type "cta". */
    qrCodeUrl: z
      .string()
      .regex(HTTP_URL, "qrCodeUrl deve começar com http:// ou https://")
      .optional(),
    /** Itens da lista. Obrigatório e usado apenas no slide de type "bullets". */
    bullets: z
      .array(
        z
          .string()
          .min(1)
          .max(MAX_BULLET_LENGTH, `cada item deve ter no máximo ${MAX_BULLET_LENGTH} caracteres`),
      )
      .min(MIN_BULLETS)
      .max(MAX_BULLETS)
      .optional(),
  })
  .refine(
    (slide) => slide.type === "bullets" || slide.type === "section" || !!slide.bodyText,
    { message: "bodyText é obrigatório para este tipo de slide", path: ["bodyText"] },
  )
  .refine(
    (slide) => slide.type !== "bullets" || (slide.bullets?.length ?? 0) >= MIN_BULLETS,
    {
      message: `slides do tipo 'bullets' precisam de ao menos ${MIN_BULLETS} itens em 'bullets'`,
      path: ["bullets"],
    },
  );

function buildBaseSchema(maxSlides: number) {
  return z.object({
    title: z.string().min(1, "title é obrigatório"),
    targetAudience: z.string().min(1, "targetAudience é obrigatório"),
    slides: z
      .array(slideSchema)
      .min(MIN_SLIDES, `deve ter no mínimo ${MIN_SLIDES} slides`)
      .max(maxSlides, `deve ter no máximo ${maxSlides} slides`),
  });
}

export const carouselBaseSchema = buildBaseSchema(MAX_SLIDES);

export const carouselSchema = carouselBaseSchema
  .refine(
    ({ slides }) => slides.every((slide, index) => slide.slideNumber === index + 1),
    {
      message: "slideNumber deve ser sequencial começando em 1",
      path: ["slides"],
    },
  )
  .refine(({ slides }) => slides[0]?.type === "cover", {
    message: "o primeiro slide deve ser do tipo 'cover'",
    path: ["slides", 0, "type"],
  })
  .refine(({ slides }) => slides[slides.length - 1]?.type === "cta", {
    message: "o último slide deve ser do tipo 'cta'",
    path: ["slides"],
  });

/** Mesmas regras estruturais do carrossel — só o teto de slides muda. */
export const apresentacaoBaseSchema = buildBaseSchema(MAX_SLIDES_APRESENTACAO);

export const apresentacaoSchema = apresentacaoBaseSchema
  .refine(
    ({ slides }) => slides.every((slide, index) => slide.slideNumber === index + 1),
    {
      message: "slideNumber deve ser sequencial começando em 1",
      path: ["slides"],
    },
  )
  .refine(({ slides }) => slides[0]?.type === "cover", {
    message: "o primeiro slide deve ser do tipo 'cover'",
    path: ["slides", 0, "type"],
  })
  .refine(({ slides }) => slides[slides.length - 1]?.type === "cta", {
    message: "o último slide deve ser do tipo 'cta'",
    path: ["slides"],
  });

export type SlideType = z.infer<typeof slideTypeSchema>;
export type ImageLayout = z.infer<typeof imageLayoutSchema>;
export type SlideImage = z.infer<typeof imageSchema>;
export type Slide = z.infer<typeof slideSchema>;
export type Carousel = z.infer<typeof carouselSchema>;

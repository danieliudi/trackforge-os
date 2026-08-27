import { z } from "zod";

export const MAX_BODY_LENGTH = 30;

/** Fonte única de verdade — o schema valida e a UI trava os botões nos mesmos limites. */
export const MIN_SLIDES = 4;
export const MAX_SLIDES = 12;

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
]);

export const slideSchema = z.object({
  slideNumber: z.number().int().positive(),
  type: slideTypeSchema,
  headline: z.string().min(1, "headline é obrigatório"),
  bodyText: z
    .string()
    .min(1, "bodyText é obrigatório")
    .max(MAX_BODY_LENGTH, `bodyText deve ter no máximo ${MAX_BODY_LENGTH} caracteres`),
  highlightTag: z.string().min(1).optional(),
  footerNote: z.string().min(1, "footerNote é obrigatório"),
  /** Imagem do slide e como ela ocupa o layout. */
  image: imageSchema.optional(),
  /** Destino do QR Code. Usado apenas no slide de type "cta". */
  qrCodeUrl: z
    .string()
    .regex(HTTP_URL, "qrCodeUrl deve começar com http:// ou https://")
    .optional(),
});

export const carouselBaseSchema = z.object({
  title: z.string().min(1, "title é obrigatório"),
  targetAudience: z.string().min(1, "targetAudience é obrigatório"),
  slides: z
    .array(slideSchema)
    .min(MIN_SLIDES, `o carrossel deve ter no mínimo ${MIN_SLIDES} slides`)
    .max(MAX_SLIDES, `o carrossel deve ter no máximo ${MAX_SLIDES} slides`),
});

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

export type SlideType = z.infer<typeof slideTypeSchema>;
export type ImageLayout = z.infer<typeof imageLayoutSchema>;
export type SlideImage = z.infer<typeof imageSchema>;
export type Slide = z.infer<typeof slideSchema>;
export type Carousel = z.infer<typeof carouselSchema>;

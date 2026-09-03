import { z } from "zod";

/**
 * Limites do slide — da UI e do prompt, NÃO do schema de validação.
 *
 * Era o schema que os fazia valer, e isso custava a peça inteira: a Anthropic
 * não aplica `maxLength` nem `maxItems` (o provider os arranca antes de enviar,
 * ver `src/types/article.ts`), então um `bodyText` com 34 caracteres derrubava
 * o carrossel todo na validação de volta, depois de pago.
 *
 * O editor já trata excesso do jeito certo e sempre tratou: `headline` nunca
 * teve teto de schema, tem contador que fica negativo, e o layout corta com
 * `line-clamp`. `bodyText` tinha as duas coisas — contador E portão —, e o
 * portão era o único que destruía trabalho. Agora os dois são contador.
 */
export const MAX_BODY_LENGTH = 30;
export const MAX_BULLET_LENGTH = 70;
export const MIN_BULLETS = 2;
export const MAX_BULLETS = 6;

/** Alvo do prompt e teto dos botões do editor. O schema aceita o que vier. */
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
    /**
     * Não usado em "bullets"/"section" — o refine abaixo só exige nos demais tipos.
     * Sem teto: `MAX_BODY_LENGTH` é o contador do editor, e o layout corta.
     */
    bodyText: z.string().optional(),
    highlightTag: z.string().min(1).optional(),
    footerNote: z.string().min(1, "footerNote é obrigatório"),
    /** Imagem do slide e como ela ocupa o layout. */
    image: imageSchema.optional(),
    /** Destino do QR Code. Usado apenas no slide de type "cta". */
    qrCodeUrl: z
      .string()
      .regex(HTTP_URL, "qrCodeUrl deve começar com http:// ou https://")
      .optional(),
    /**
     * Itens da lista. Obrigatório e usado apenas no slide de type "bullets".
     * O piso vive no refine abaixo; o teto e o tamanho do item, no editor.
     */
    bullets: z.array(z.string().min(1)).optional(),
  })
  // O refine que exigia bodyText saiu: todo layout renderiza `bodyText ?? ""`,
  // o editor tem o campo, e o que ele fazia na prática era descartar um
  // carrossel inteiro por causa de um subtítulo que faltou.
  .refine(
    (slide) => slide.type !== "bullets" || (slide.bullets?.length ?? 0) >= MIN_BULLETS,
    {
      message: `slides do tipo 'bullets' precisam de ao menos ${MIN_BULLETS} itens em 'bullets'`,
      path: ["bullets"],
    },
  );

/**
 * Piso de um slide, sem teto.
 *
 * `MIN_SLIDES` e `MAX_SLIDES` continuam sendo o alvo do prompt e o limite dos
 * botões do editor — mas reprovar aqui um carrossel de treze slides só apagaria
 * treze slides pagos. Tirar três no editor leva segundos; regerar custa de novo.
 */
function buildBaseSchema() {
  return z.object({
    title: z.string().min(1, "title é obrigatório"),
    targetAudience: z.string().min(1, "targetAudience é obrigatório"),
    slides: z.array(slideSchema).min(1, "a peça precisa de ao menos um slide"),
  });
}

export const carouselBaseSchema = buildBaseSchema();

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

/** Mesmas regras estruturais do carrossel; o teto de slides é do editor. */
export const apresentacaoBaseSchema = buildBaseSchema();

/**
 * O slide como ele vai PARA o modelo: forma, sem teto e sem refine.
 *
 * Refine no schema de geração é a armadilha menos óbvia desta família de bugs.
 * A Anthropic não sabe executar um `refine` — ele roda só na volta, dentro do
 * AI SDK —, então um slide "bullets" que veio com um item só não vira um aviso:
 * vira `NoObjectGeneratedError`, e leva junto os outros cinco slides e as
 * outras cinco peças do lote. `normalizeCarousel` conserta isso depois.
 */
export const slideWireSchema = z.object({
  slideNumber: z.number(),
  type: slideTypeSchema,
  headline: z.string(),
  bodyText: z.string().nullish(),
  highlightTag: z.string().nullish(),
  footerNote: z.string().nullish(),
  image: z.object({ url: z.string(), layout: imageLayoutSchema }).nullish(),
  qrCodeUrl: z.string().nullish(),
  bullets: z.array(z.string()).nullish(),
});

export const carouselWireSchema = z.object({
  title: z.string(),
  targetAudience: z.string(),
  slides: z.array(slideWireSchema),
});

export type SlideWire = z.infer<typeof slideWireSchema>;
export type CarouselWire = z.infer<typeof carouselWireSchema>;

/**
 * Conserta o carrossel antes de validar — determinístico, sem segunda chamada.
 *
 * Vivia copiado em `derive` e `avulso` fazendo só duas coisas (renumerar e
 * cravar a assinatura). É a terceira ocorrência com a chegada do schema de fio,
 * que é quando este repo extrai, e agora ele também resolve o que os refines
 * cobravam — porque cobrar sem consertar era o que apagava a peça:
 *
 * - renumera pela ordem do array, que é a verdade;
 * - crava a assinatura canônica da marca, que a IA nunca sabe;
 * - primeiro slide vira "cover", último vira "cta". `type` escolhe LAYOUT, não
 *   conteúdo: trocar a moldura não mexe numa palavra do que o slide diz;
 * - slide "bullets" que sobrou com menos de dois itens vira "content", porque
 *   uma lista de um item não é uma lista;
 * - URL que não é http(s) sai. Um QR code apontando para lixo é pior que
 *   nenhum QR code — e este é impresso.
 */
export function normalizeCarousel(wire: CarouselWire, tagline?: string) {
  const limpos = wire.slides.map((slide) => {
    const bullets = (slide.bullets ?? []).map((item) => item.trim()).filter(Boolean);
    const bodyText = slide.bodyText?.trim();
    const qrCodeUrl = slide.qrCodeUrl?.trim();

    return {
      type: slide.type,
      headline: slide.headline.trim(),
      ...(bodyText ? { bodyText } : {}),
      ...(slide.highlightTag?.trim() ? { highlightTag: slide.highlightTag.trim() } : {}),
      footerNote: tagline ?? slide.footerNote?.trim() ?? "",
      ...(slide.image && IMAGE_SRC.test(slide.image.url.trim())
        ? { image: { url: slide.image.url.trim(), layout: slide.image.layout } }
        : {}),
      ...(qrCodeUrl && HTTP_URL.test(qrCodeUrl) ? { qrCodeUrl } : {}),
      ...(bullets.length > 0 ? { bullets } : {}),
    };
  });

  const ultimo = limpos.length - 1;

  return {
    title: wire.title.trim(),
    targetAudience: wire.targetAudience.trim(),
    slides: limpos.map((slide, index) => {
      let type = slide.type;
      if (index === 0) type = "cover";
      else if (index === ultimo) type = "cta";
      else if (type === "bullets" && (slide.bullets?.length ?? 0) < MIN_BULLETS) type = "content";

      return { ...slide, slideNumber: index + 1, type };
    }),
  };
}

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

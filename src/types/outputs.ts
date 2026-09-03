import { z } from "zod";

import {
  carouselBaseSchema,
  carouselSchema,
  carouselWireSchema,
  normalizeCarousel,
} from "./carousel";

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

/**
 * Tamanho de gancho por plataforma — alvo do prompt, não portão do schema.
 *
 * Pela mesma razão do artigo e do carrossel: a Anthropic não aplica
 * `maxLength`, então exigi-lo na volta só transformava um gancho doze
 * caracteres mais longo na perda da peça inteira. E aqui o custo é maior que no
 * artigo, porque as peças saem em lote: uma reprovada derrubava as seis.
 *
 * Passar do número não quebra nada — o Instagram corta no "ver mais" e o resto
 * continua lá. É texto para o Daniel colar e ajustar, não medida de layout.
 */
export const HOOK_TARGET = {
  "post-texto": 220,
  legenda: 150,
  reels: 160,
  stories: 180,
} as const;

/** Post de texto do LinkedIn — o gancho é a única linha garantida antes do corte. */
export const postTextoSchema = z.object({
  hook: z.string().min(1, "o gancho não pode vir vazio"),
  paragraphs: z
    .array(z.string().min(1, "parágrafo vazio"))
    .min(1, "o post precisa de ao menos um parágrafo"),
  cta: z.string().min(1, "a chamada não pode vir vazia"),
});

export const legendaSchema = z.object({
  /** Primeira linha, a única visível antes do "ver mais". */
  hook: z.string().min(1, "o gancho não pode vir vazio"),
  body: z
    .array(z.string().min(1, "bloco vazio"))
    .min(1, "a legenda precisa de ao menos um bloco"),
  cta: z.string().min(1, "a chamada não pode vir vazia"),
  /** Sem invenção de tag de campanha; só termo que descreve o assunto. */
  hashtags: z.array(z.string().min(2, "hashtag curta demais")).default([]),
});

export const reelsSchema = z.object({
  hook: z.string().min(1, "o gancho não pode vir vazio"),
  beats: z
    .array(
      z.object({
        /** Sem teto: bloco de 40s é escolha editorial, e a soma aparece na tela. */
        seconds: z.number().int().min(1, "o bloco precisa durar ao menos 1 segundo"),
        /** O que é falado. */
        fala: z.string().min(1, "o bloco precisa da fala"),
        /** O que aparece escrito na tela — curto, é legenda de vídeo. */
        naTela: z.string().min(1, "o bloco precisa do texto de tela"),
      }),
    )
    .min(1, "o roteiro precisa de ao menos um bloco"),
  cta: z.string().min(1, "a chamada não pode vir vazia"),
});

export const storiesSchema = z.object({
  screens: z
    .array(
      z.object({
        texto: z.string().min(1, "a tela precisa de texto"),
        /** Enquete ou caixa de pergunta, quando a tela pedir. */
        interacao: z.string().optional(),
      }),
    )
    .min(1, "a sequência precisa de ao menos uma tela"),
  cta: z.string().min(1, "a chamada não pode vir vazia"),
});

/**
 * O schema que VALIDA a peça já normalizada — o portão, não o pedido.
 *
 * Carrossel usa o `carouselSchema` completo (com os refines de capa e de CTA) e
 * não o base: agora que a geração acontece contra `OUTPUT_WIRE_SCHEMAS`, os
 * refines não têm mais como derrubar a chamada — e `normalizeCarousel` já
 * entrega o slide numerado e com a moldura certa, então eles viraram o que
 * sempre deviam ter sido: uma conferência que passa.
 */
export const OUTPUT_SCHEMAS = {
  "carrossel-linkedin": carouselSchema,
  "carrossel-instagram": carouselSchema,
  "post-texto": postTextoSchema,
  legenda: legendaSchema,
  reels: reelsSchema,
  stories: storiesSchema,
} as const;

/**
 * O que vai PARA o modelo: a forma de cada peça, sem um limite sequer.
 *
 * Mesma razão do artigo — a Anthropic garante campo, tipo e enum, e joga fora
 * `maxLength`, `maxItems` e `pattern` antes de enviar; o AI SDK valida a volta
 * contra o schema inteiro. A diferença aqui é o estrago: as peças são geradas
 * num laço, e uma reprovada derrubava o lote inteiro com as que já tinham
 * saído. O conserto é `normalizeOutput`, determinístico e sem segunda chamada.
 */
const postTextoWireSchema = z.object({
  hook: z.string(),
  paragraphs: z.array(z.string()),
  cta: z.string(),
});

const legendaWireSchema = z.object({
  hook: z.string(),
  body: z.array(z.string()),
  cta: z.string(),
  hashtags: z.array(z.string()).nullish(),
});

const reelsWireSchema = z.object({
  hook: z.string(),
  beats: z.array(z.object({ seconds: z.number(), fala: z.string(), naTela: z.string() })),
  cta: z.string(),
});

const storiesWireSchema = z.object({
  screens: z.array(z.object({ texto: z.string(), interacao: z.string().nullish() })),
  cta: z.string(),
});

export const OUTPUT_WIRE_SCHEMAS = {
  "carrossel-linkedin": carouselWireSchema,
  "carrossel-instagram": carouselWireSchema,
  "post-texto": postTextoWireSchema,
  legenda: legendaWireSchema,
  reels: reelsWireSchema,
  stories: storiesWireSchema,
} as const;

const limpa = (linhas: string[]) => linhas.map((linha) => linha.trim()).filter(Boolean);

/**
 * Conserta a peça antes de validar. Nunca reescreve o que ela diz.
 *
 * Corta espaço, descarta item vazio e tira hashtag repetida — coisas que o
 * modelo produz por descuido e que nenhuma leitura humana quer ver. O que ele
 * NÃO faz é encurtar texto: um gancho comprido continua comprido, porque
 * decidir a frase é do Daniel, e a plataforma corta sozinha na hora de publicar.
 *
 * `seconds` é o único número mexido — arredondado e com piso de 1, porque bloco
 * de "0 segundos" ou de "2,5" não existe num roteiro que alguém vai gravar.
 */
export function normalizeOutput(kind: OutputKind, data: unknown, tagline?: string): unknown {
  if (isCarousel(kind)) {
    return normalizeCarousel(data as z.infer<typeof carouselWireSchema>, tagline);
  }

  if (kind === "post-texto") {
    const post = data as z.infer<typeof postTextoWireSchema>;
    return {
      hook: post.hook.trim(),
      paragraphs: limpa(post.paragraphs),
      cta: post.cta.trim(),
    };
  }

  if (kind === "legenda") {
    const legenda = data as z.infer<typeof legendaWireSchema>;
    const vistas = new Set<string>();
    return {
      hook: legenda.hook.trim(),
      body: limpa(legenda.body),
      cta: legenda.cta.trim(),
      hashtags: limpa(legenda.hashtags ?? [])
        // Sem "#" e sem repetida: o render já põe o "#" e duas iguais na mesma
        // legenda é erro que o leitor vê antes de qualquer outra coisa.
        .map((tag) => tag.replace(/^#+/, ""))
        .filter((tag) => {
          const chave = tag.toLowerCase();
          if (tag.length < 2 || vistas.has(chave)) return false;
          vistas.add(chave);
          return true;
        }),
    };
  }

  if (kind === "reels") {
    const reels = data as z.infer<typeof reelsWireSchema>;
    return {
      hook: reels.hook.trim(),
      beats: reels.beats
        .map((beat) => ({
          seconds: Math.max(1, Math.round(beat.seconds)),
          fala: beat.fala.trim(),
          naTela: beat.naTela.trim(),
        }))
        .filter((beat) => beat.fala !== "" && beat.naTela !== ""),
      cta: reels.cta.trim(),
    };
  }

  const stories = data as z.infer<typeof storiesWireSchema>;
  return {
    screens: stories.screens
      .map((screen) => {
        const interacao = screen.interacao?.trim();
        return { texto: screen.texto.trim(), ...(interacao ? { interacao } : {}) };
      })
      .filter((screen) => screen.texto !== ""),
    cta: stories.cta.trim(),
  };
}

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
 * Peça que não saiu — o slot dela na tela, com o motivo e o que já custou.
 *
 * Existe porque uma peça reprovada não pode mais derrubar as outras cinco. Ela
 * ocupa o lugar dela na coluna, diz qual campo reprovou e mostra o gasto da
 * tentativa: a geração foi cobrada, então some do recibo seria esconder gasto.
 */
export type PieceFailure = {
  kind: OutputKind;
  /** Campos reprovados, no formato "caminho: mensagem". */
  issues: string[];
  /** O que esta tentativa custou. Cobrada, logo visível. */
  usd: number;
};

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

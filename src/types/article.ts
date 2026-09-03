import { z } from "zod";

import { MAX_SUGGESTION_REASON, outputKindSchema, outputSuggestionSchema } from "./outputs";

/**
 * Artigo longo — o ativo permanente do ciclo editorial.
 *
 * POR QUE É OBJETO E NÃO MARKDOWN: o artigo é a origem, não o fim. A regra da
 * esteira é que o LinkedIn deriva do artigo e o Instagram deriva do LinkedIn,
 * nunca os três escritos do zero em paralelo — é assim que aparece afirmação na
 * peça derivada que não existe no artigo. Um blob de markdown obrigaria o
 * derivador a reinterpretar o texto; seção e parágrafo separados deixam ele
 * mapear afirmação por afirmação.
 *
 * Pelo mesmo motivo o verificador recebe parágrafo a parágrafo: um aviso que
 * aponta "seção 3" é acionável, um que aponta "o artigo" não é.
 */

/**
 * Alvo editorial do artigo — o que o PROMPT pede, não o que o schema exige.
 *
 * A distinção nasceu de um bug caro. A Anthropic garante a FORMA da resposta e
 * mais nada: o provider (`sanitizeJsonSchema`, em `@ai-sdk/anthropic`) tira
 * `minItems`, `maxItems`, `minLength`, `maxLength` e `pattern` do schema antes
 * de enviar e devolve cada um como frase solta dentro de `description`. O AI
 * SDK, porém, valida a resposta contra o schema INTEIRO. Pedir com um limite
 * que a API não faz valer e depois exigi-lo na validação cria um erro que só
 * aparece com o artigo pronto e pago — foi assim que 2,4 minutos de Sonnet
 * viraram "No object generated: response did not match schema" com o recibo
 * zerado, porque uma seção veio com sete parágrafos em vez de seis.
 *
 * Então o número vive aqui e no prompt, e o schema exige só o que o código
 * depois precisa. Ver `articleWireSchema` e `normalizeArticle`.
 */
export const MIN_SECTIONS = 3;
export const MAX_SECTIONS = 8;
export const MIN_PARAGRAPHS = 1;
export const MAX_PARAGRAPHS = 6;
export const MIN_TAKEAWAYS = 2;
export const MAX_TAKEAWAYS = 5;
export const MAX_IMAGE_IDEAS = 4;

/**
 * Tetos de texto auxiliar — rótulo, descrição e termo de busca.
 *
 * Estes continuam sendo cortados de verdade (em `normalizeArticle`), e podem
 * ser: nenhum deles é afirmação. Passar do teto num rótulo é problema de
 * layout, não de fato. Parágrafo de artigo não tem teto nenhum, justamente
 * porque cortá-lo seria mexer no que o texto diz.
 */
export const MAX_IMAGE_SLOT = 80;
export const MAX_IMAGE_DESCRIBES = 160;
export const MAX_IMAGE_QUERY = 60;

/** Máximo de palavras que o prompt pede. Não é validação — é orientação de densidade. */
export const TARGET_WORDS = { min: 700, max: 1400 } as const;

const HTTP_URL = /^https?:\/\//i;

export const articleSectionSchema = z.object({
  heading: z.string().min(1, "cada seção precisa de um título"),
  /** Sem teto: `MAX_PARAGRAPHS` orienta o prompt, não reprova o texto pronto. */
  paragraphs: z
    .array(z.string().min(1))
    .min(MIN_PARAGRAPHS, "cada seção precisa de ao menos um parágrafo"),
});

/**
 * Fonte citada no fim do artigo.
 *
 * `url` é opcional porque norma se identifica por número e órgão — "Resolução
 * ANTT nº 5.998/2022" é referência completa mesmo sem link, e exigir URL faria a
 * IA inventar um.
 */
export const articleSourceSchema = z.object({
  label: z.string().min(1),
  url: z
    .string()
    .regex(HTTP_URL, "a URL da fonte deve começar com http:// ou https://")
    .optional(),
});

/**
 * Ideia de imagem para o artigo — termo de busca, não imagem gerada.
 *
 * POR QUE NÃO GERAR A IMAGEM: uma foto sintética de big bag num pátio é uma
 * afirmação visual sobre um produto que existe, feita por um modelo que nunca
 * o viu. A ferramenta inteira existe para não afirmar o que não pode sustentar,
 * e a imagem é a afirmação que o leitor acredita primeiro. Então o que sai
 * daqui é uma busca: a foto vem do acervo ou da biblioteca da marca, e quem
 * escolhe é quem responde por ela.
 */
export const imageIdeaSchema = z.object({
  /** Onde entra: "capa" ou o título de uma seção. */
  slot: z.string().min(1).max(MAX_IMAGE_SLOT),
  /** O que a foto deve mostrar, em português — é isto que você julga. */
  describes: z.string().min(1).max(MAX_IMAGE_DESCRIBES),
  /** Termo de busca em inglês: o acervo do Unsplash é indexado em inglês. */
  query: z.string().min(2).max(MAX_IMAGE_QUERY),
});

export type ImageIdea = z.infer<typeof imageIdeaSchema>;

/** Imagem efetivamente escolhida para um slot, com o crédito que ela exige. */
export type ChosenImage = {
  slot: string;
  url: string;
  alt: string;
  credit: string | null;
  creditUrl: string | null;
  /** Nome do arquivo, quando veio da biblioteca da marca. */
  fileName: string | null;
};

export const articleSchema = z.object({
  title: z.string().min(1, "title é obrigatório"),
  /** Linha de apoio sob o título — o resumo que aparece na listagem. */
  dek: z.string().min(1, "dek é obrigatório"),
  targetAudience: z.string().min(1, "targetAudience é obrigatório"),
  /**
   * Sem teto, e com piso de uma. `MIN_SECTIONS`/`MAX_SECTIONS` são o pedido do
   * prompt; aqui reprovar uma nona seção só destruiria texto já escrito e pago.
   */
  sections: z.array(articleSectionSchema).min(1, "o artigo precisa de ao menos uma seção"),
  /** O que o leitor faz depois de ler. É daqui que sai o CTA das peças derivadas. */
  takeaways: z
    .array(z.string().min(1))
    .min(1, "o artigo precisa de ao menos um item em 'o que fazer'"),
  sources: z.array(articleSourceSchema).default([]),
  /**
   * Que formatos curtos este conteúdo sustenta, e por quê.
   *
   * Vem do redator do artigo em vez de uma chamada própria: ele acabou de ler o
   * material e decidir a estrutura, então já sabe se o assunto é passo a passo
   * (carrossel), prazo (post de texto) ou lembrete (stories). Perguntar de novo
   * seria pagar duas vezes pela mesma leitura.
   */
  suggestedOutputs: z.array(outputSuggestionSchema).default([]),
  /**
   * Que imagens o artigo pede, e com que termo procurá-las.
   *
   * Vem junto do texto pelo mesmo motivo dos formatos: quem acabou de escrever
   * a seção sabe o que ela mostra. Pedir depois seria pagar de novo pela mesma
   * leitura — e o termo sairia do título, que é a parte mais vaga do artigo.
   */
  imageIdeas: z.array(imageIdeaSchema).default([]),
});

/**
 * O schema que vai PARA o modelo: a forma, sem um único limite numérico.
 *
 * POR QUE DUAS VERSÕES DO MESMO ARTIGO. A Anthropic faz valer a forma —
 * campo obrigatório, tipo, enum, `additionalProperties` — e ignora o resto: o
 * provider remove `maxLength`, `maxItems` e `pattern` antes de enviar. Só que o
 * AI SDK valida a resposta contra o schema que recebeu, limites inclusive. Pedir
 * com limite que a API não aplica e cobrá-lo na volta é fabricar um erro que só
 * existe depois de o artigo estar pronto, e que joga fora tudo: o texto e o
 * dinheiro. Aqui pede-se a forma; o conserto do resto é determinístico, em
 * `normalizeArticle`, sem uma segunda chamada.
 *
 * É a mesma ordem que o carrossel já usa — gerar no schema base, normalizar,
 * validar no estrito.
 */
export const articleWireSchema = z.object({
  title: z.string(),
  dek: z.string(),
  targetAudience: z.string(),
  sections: z.array(z.object({ heading: z.string(), paragraphs: z.array(z.string()) })),
  takeaways: z.array(z.string()),
  /**
   * `nullish` no `url` porque o modelo preenche `null` na propriedade opcional
   * que resolveu não usar — e `null` num campo apenas `optional` reprovaria a
   * resposta inteira por causa de uma fonte que nem tinha link.
   */
  sources: z
    .array(z.object({ label: z.string(), url: z.string().nullish() }))
    .nullish(),
  suggestedOutputs: z.array(z.object({ kind: outputKindSchema, reason: z.string() })),
  imageIdeas: z.array(
    z.object({ slot: z.string(), describes: z.string(), query: z.string() }),
  ),
});

export type ArticleWire = z.infer<typeof articleWireSchema>;

/** Corta no espaço mais próximo, para não terminar no meio de uma palavra. */
function trimTo(value: string, max: number): string {
  const clean = value.trim().replace(/\s+/g, " ");
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return (space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd();
}

/**
 * Conserta o que voltou fora do combinado, sem gastar uma segunda chamada.
 *
 * O QUE ELE NUNCA FAZ É JOGAR CONTEÚDO FORA. Seção, parágrafo e takeaway a mais
 * passam inteiros: são o texto que o Daniel pediu, pagou e pode editar, e
 * cortá-los para caber num teto de estilo seria a ferramenta decidir sozinha o
 * que o artigo deixa de dizer.
 *
 * O que ele corta é só o que não é afirmação — o rótulo do motivo, a descrição
 * da foto, o termo de busca — e o que quebraria alguém adiante:
 * - URL que não é http(s) sai e a fonte fica pelo nome, que é como norma se cita
 *   de qualquer jeito ("Resolução ANTT nº 5.998/2022"). Um link quebrado com
 *   cara de link bom é pior que link nenhum, e este vai para o CRM.
 * - formato repetido sai, senão a mesma caixa seria marcada duas vezes e a
 *   derivação estouraria o teto de seis peças.
 * - ideia de imagem sem slot, sem descrição ou com termo de busca de uma letra
 *   sai sozinha: é acessório do artigo, nunca motivo para perdê-lo.
 */
export function normalizeArticle(wire: ArticleWire) {
  const jaSugeridos = new Set<string>();

  return {
    title: wire.title.trim(),
    dek: wire.dek.trim(),
    targetAudience: wire.targetAudience.trim(),
    sections: wire.sections
      .map((section) => ({
        heading: section.heading.trim(),
        paragraphs: section.paragraphs.map((paragraph) => paragraph.trim()).filter(Boolean),
      }))
      .filter((section) => section.heading !== "" && section.paragraphs.length > 0),
    takeaways: wire.takeaways.map((takeaway) => takeaway.trim()).filter(Boolean),
    sources: (wire.sources ?? [])
      .map((source) => {
        const url = source.url?.trim();
        return {
          label: source.label.trim(),
          ...(url && HTTP_URL.test(url) ? { url } : {}),
        };
      })
      .filter((source) => source.label !== ""),
    suggestedOutputs: wire.suggestedOutputs
      .map((suggestion) => ({
        kind: suggestion.kind,
        reason: trimTo(suggestion.reason, MAX_SUGGESTION_REASON),
      }))
      .filter((suggestion) => {
        if (suggestion.reason === "" || jaSugeridos.has(suggestion.kind)) return false;
        jaSugeridos.add(suggestion.kind);
        return true;
      }),
    imageIdeas: wire.imageIdeas
      .map((idea) => ({
        slot: trimTo(idea.slot, MAX_IMAGE_SLOT),
        describes: trimTo(idea.describes, MAX_IMAGE_DESCRIBES),
        query: trimTo(idea.query, MAX_IMAGE_QUERY),
      }))
      .filter((idea) => idea.slot !== "" && idea.describes !== "" && idea.query.length >= 2),
  };
}

export type ArticleSection = z.infer<typeof articleSectionSchema>;
export type ArticleSource = z.infer<typeof articleSourceSchema>;
export type Article = z.infer<typeof articleSchema>;

/** Palavras do corpo — o que conta pra densidade, sem título nem fontes. */
export function countWords(article: Article): number {
  const body = article.sections
    .flatMap((section) => [section.heading, ...section.paragraphs])
    .concat(article.takeaways)
    .join(" ");
  return body.split(/\s+/).filter(Boolean).length;
}

/**
 * Blocos numerados para checagem e auditoria.
 *
 * A numeração é a da seção (1..N), não do parágrafo: é o que o leitor consegue
 * localizar no texto. Takeaways e o dek entram como blocos próprios porque
 * afirmação factual aparece tanto ali quanto no corpo.
 */
export function articleBlocks(article: Article): { number: number; label: string; text: string }[] {
  const blocks = [{ number: 0, label: "Abertura", text: `${article.title} ${article.dek}` }];

  article.sections.forEach((section, index) => {
    blocks.push({
      number: index + 1,
      label: section.heading,
      text: [section.heading, ...section.paragraphs].join(" "),
    });
  });

  blocks.push({
    number: article.sections.length + 1,
    label: "O que fazer",
    text: article.takeaways.join(" "),
  });

  return blocks;
}

/**
 * URL que só resolve na máquina de quem gerou.
 *
 * A biblioteca da marca é servida pelo próprio app; num `next dev` isso é
 * localhost. Mandar esse link para a agência entrega um link quebrado com cara
 * de link bom — pior que entregar o nome do arquivo e deixar claro que ele
 * precisa ser anexado.
 */
const isLocalUrl = (url: string) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])[:/]/i.test(url);

/** Linha de imagem em markdown, com o crédito que o acervo exige. */
function imageMarkdown(image: ChosenImage): string[] {
  const local = isLocalUrl(image.url);
  const target = local ? (image.fileName ?? image.url) : image.url;
  const line = `![${image.alt || image.slot}](${target})`;

  const note = local
    ? `_Arquivo da biblioteca: ${image.fileName ?? target} — anexar junto._`
    : image.credit
      ? `_Foto: ${image.credit}${image.creditUrl ? ` (${image.creditUrl})` : ""}._`
      : null;

  return note ? [line, "", note, ""] : [line, ""];
}

/**
 * Markdown para entregar como documento — é assim que a peça sai da ferramenta.
 *
 * As imagens entram AQUI e não num campo à parte porque é este texto que chega
 * a quem publica. Uma sugestão de imagem que fica só na tela da geração não
 * chegou a lugar nenhum.
 */
export function articleToMarkdown(article: Article, images: ChosenImage[] = []): string {
  const bySlot = new Map(images.map((image) => [image.slot, image]));
  const cover = bySlot.get("capa");

  const parts = [`# ${article.title}`, "", `_${article.dek}_`, ""];
  if (cover) parts.push(...imageMarkdown(cover));

  for (const section of article.sections) {
    parts.push(`## ${section.heading}`, "");
    const image = bySlot.get(section.heading);
    if (image) parts.push(...imageMarkdown(image));
    for (const paragraph of section.paragraphs) parts.push(paragraph, "");
  }

  parts.push("## O que fazer", "");
  for (const takeaway of article.takeaways) parts.push(`- ${takeaway}`);
  parts.push("");

  if (article.sources.length > 0) {
    parts.push("## Fontes", "");
    for (const source of article.sources) {
      parts.push(source.url ? `- [${source.label}](${source.url})` : `- ${source.label}`);
    }
    parts.push("");
  }

  return parts.join("\n");
}

import { z } from "zod";

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

export const MIN_SECTIONS = 3;
export const MAX_SECTIONS = 8;
export const MIN_PARAGRAPHS = 1;
export const MAX_PARAGRAPHS = 6;
export const MIN_TAKEAWAYS = 2;
export const MAX_TAKEAWAYS = 5;

/** Máximo de palavras que o prompt pede. Não é validação — é orientação de densidade. */
export const TARGET_WORDS = { min: 700, max: 1400 } as const;

const HTTP_URL = /^https?:\/\//i;

export const articleSectionSchema = z.object({
  heading: z.string().min(1, "cada seção precisa de um título"),
  paragraphs: z
    .array(z.string().min(1))
    .min(MIN_PARAGRAPHS)
    .max(MAX_PARAGRAPHS, `cada seção deve ter no máximo ${MAX_PARAGRAPHS} parágrafos`),
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

export const articleSchema = z.object({
  title: z.string().min(1, "title é obrigatório"),
  /** Linha de apoio sob o título — o resumo que aparece na listagem. */
  dek: z.string().min(1, "dek é obrigatório"),
  targetAudience: z.string().min(1, "targetAudience é obrigatório"),
  sections: z
    .array(articleSectionSchema)
    .min(MIN_SECTIONS, `o artigo deve ter no mínimo ${MIN_SECTIONS} seções`)
    .max(MAX_SECTIONS, `o artigo deve ter no máximo ${MAX_SECTIONS} seções`),
  /** O que o leitor faz depois de ler. É daqui que sai o CTA das peças derivadas. */
  takeaways: z.array(z.string().min(1)).min(MIN_TAKEAWAYS).max(MAX_TAKEAWAYS),
  sources: z.array(articleSourceSchema).max(12).default([]),
});

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

/** Markdown para entregar como documento — é assim que a peça sai da ferramenta. */
export function articleToMarkdown(article: Article): string {
  const parts = [`# ${article.title}`, "", `_${article.dek}_`, ""];

  for (const section of article.sections) {
    parts.push(`## ${section.heading}`, "");
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

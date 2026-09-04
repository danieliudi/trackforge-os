import type { BrandId } from "@/constants/brands";

import meuNormas from "./facts/meu-normas.json";
import resibagNormas from "./facts/resibag-normas.json";
import sanweyNormas from "./facts/sanwey-normas.json";

/**
 * Procedência de um fato — e a regra que decide o que pode virar alegação pública.
 *
 * Existe por causa de uma falha real: a ANTT 6.078/2026 circulou por meses na base
 * de compliance descrita como "atualização da 5.998/2022", com quatro mudanças
 * listadas. Não era. Ninguém tinha conferido na ANTT, e nada no sistema registrava
 * isso — a descrição era plausível, então passou.
 *
 * Nenhuma checagem de saída pegaria esse erro: o gerador usou o fato errado
 * corretamente. O que pega é exigir que o fato diga de onde veio antes de virar
 * número numa peça.
 */
export type SourceTier =
  /** Texto oficial do órgão, Diário Oficial, ou documento próprio (certificado, laudo). */
  | "primaria"
  /** Associação setorial, imprensa especializada, escritório jurídico. */
  | "secundaria"
  /** Afirmação de alguém do time, sem documento. Inclui aritmética própria. */
  | "interna"
  /** Veio da base canônica e ninguém conferiu contra a fonte. O default honesto. */
  | "nao-verificado";

export type FactRecord = {
  id: string;
  /** A afirmação como ela sairia numa peça. */
  claim: string;
  tier: SourceTier;
  /** Quem afirma: órgão + documento, ou a skill de origem. */
  source: string;
  url?: string;
  /** Data em que alguém conferiu contra a fonte. Ausente = nunca. */
  checkedAt?: string;
  checkedBy?: string;
  /** Depois desta data o fato não é publicável até ser reconferido. */
  revalidateBy?: string;
  notes?: string;
};

const NORMAS: Record<BrandId, FactRecord[]> = {
  resibag: resibagNormas.facts as FactRecord[],
  sanwey: sanweyNormas.facts as FactRecord[],
  meu: meuNormas.facts as FactRecord[],
};

export function getNormativeFacts(brandId: BrandId | null | undefined): FactRecord[] {
  return brandId ? NORMAS[brandId] : [];
}

export function isExpired(fact: FactRecord, today = new Date()): boolean {
  if (!fact.revalidateBy) return false;
  return new Date(fact.revalidateBy) < today;
}

/**
 * Só fonte primária dentro da validade vira número, data ou artigo de norma numa
 * peça pública.
 *
 * A régua é deliberadamente dura. Hoje quase nada passa — e é essa a informação
 * útil: mede o tamanho real da dívida de verificação em vez de escondê-la.
 */
export function isPublishable(fact: FactRecord, today = new Date()): boolean {
  return fact.tier === "primaria" && !isExpired(fact, today);
}

const TIER_RULE = `## Como usar cada fato, pela procedência

Cada fato normativo abaixo vem marcado com a confiabilidade da sua fonte. A marca
decide o que você pode escrever com ele:

- **[primária]** — fonte oficial conferida. Pode virar alegação direta na peça,
  com número, data e artigo.
- **[secundária]** — fonte confiável mas indireta. Pode entrar, e a peça precisa
  atribuir a quem afirmou ("segundo a CETESB", "em audiência pública da ANTT").
  Nunca apresente como fato próprio.
- **[interna]** — afirmação do time sem documento. Sustenta o argumento em termos
  gerais. NUNCA vira número, data ou citação de norma na peça.
- **[não verificado]** — veio da base interna e ninguém conferiu na fonte original.
  Mesma regra da interna: NUNCA vira número, data nem citação de norma.
  Use o conteúdo para orientar o argumento, não para afirmar o dado.
- **[vencido]** — passou da data de revalidação. Não use de forma alguma.

Regra que resume tudo: **se o fato não é primária, a peça não cita o número.**
Um slide a menos é melhor que um número que ninguém consegue defender numa
auditoria. Foi exatamente assim que uma resolução que trata de outro assunto
entrou numa peça como se fosse a norma-base de transporte de perigosos.`;

/**
 * Rótulo exibido no prompt.
 *
 * Precisa bater caractere a caractere com os rótulos da regra acima — se a regra
 * fala em `[primária]` e o fato vem marcado `[primaria]`, o modelo tem que
 * adivinhar que são a mesma coisa, e a regra deixa de prender.
 */
export const TIER_LABEL: Record<SourceTier, string> = {
  primaria: "primária",
  secundaria: "secundária",
  interna: "interna",
  "nao-verificado": "não verificado",
};

/** Bloco de fatos normativos para o prompt, cada um com sua procedência. */
export function buildNormativeBlock(
  brandId: BrandId | null | undefined,
  today = new Date(),
): string {
  const facts = getNormativeFacts(brandId);
  if (facts.length === 0) return "";

  const lines = facts.map((fact) => {
    const tier = isExpired(fact, today) ? "vencido" : TIER_LABEL[fact.tier];
    const attribution = fact.url ? `${fact.source} — ${fact.url}` : fact.source;
    return `- **[${tier}]** ${fact.claim}\n  Fonte: ${attribution}`;
  });

  return `# FATOS NORMATIVOS E NUMÉRICOS

${TIER_RULE}

## Os fatos

${lines.join("\n")}`;
}

import type { BrandId } from "@/constants/brands";

import { buildNormativeBlock } from "./provenance";
import { meuKnowledge } from "./meu";
import { resibagKnowledge } from "./resibag";
import { sanweyKnowledge } from "./sanwey";
import type { BrandKnowledge } from "./types";

export type { BrandKnowledge };

const knowledgeByBrand: Record<BrandId, BrandKnowledge> = {
  resibag: resibagKnowledge,
  sanwey: sanweyKnowledge,
  meu: meuKnowledge,
};

export function getBrandKnowledge(brandId: BrandId | null | undefined) {
  return brandId ? knowledgeByBrand[brandId] : null;
}

/**
 * Monta o bloco de fatos + proibições para o prompt.
 *
 * A proibição vem com motivo de propósito. "Não escreva NORMAM" o modelo
 * contorna escrevendo "homologação da Marinha"; "não escreva NORMAM porque a
 * marca não tem essa homologação" fecha a categoria inteira.
 */
/**
 * Só as proibições, sem a base inteira.
 *
 * Serve a chamada barata que não redige a peça — sugestão de tema, por exemplo.
 * Colar ~2000 tokens de fatos para produzir quatro linhas quadruplicaria o custo
 * dela; o que importa ali é não sugerir um tema que a peça final teria de recusar.
 */
export function buildProhibitionsBlock(brandId: BrandId | null | undefined): string {
  const knowledge = getBrandKnowledge(brandId);
  if (!knowledge) return "";

  return `# PROIBIÇÕES DA MARCA

Nunca sugira um tema que dependa de:

${knowledge.forbidden.map(({ term, reason }) => `- ${term} — ${reason}`).join("\n")}`;
}

export function buildKnowledgeBlock(brandId: BrandId | null | undefined): string {
  const knowledge = getBrandKnowledge(brandId);
  if (!knowledge) return "";

  const prohibitions = knowledge.forbidden
    .map(({ term, reason }) => `- ${term} — ${reason}`)
    .join("\n");

  return `# BASE DE FATOS VERIFICADOS DA MARCA

Esta é a única fonte de fatos autorizada para esta peça.

${knowledge.facts}

# PROIBIÇÕES DA MARCA

Cada item abaixo já saiu errado em material real. Violar qualquer um invalida a peça inteira:

${prohibitions}`;
}

/**
 * Data de hoje, em São Paulo.
 *
 * O modelo não sabe que dia é. Sem isso ele datou a capa de um carrossel de
 * agosto/2026 com "COMPLIANCE 2025", e nada no prompt o contradizia.
 */
function todayLine() {
  const today = new Date().toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return `Hoje é ${today}. Nunca escreva um ano em tag, badge ou headline sem conferir contra essa data.`;
}

/**
 * Procedência do fato — vale acima de qualquer regra de estilo.
 *
 * Sem isto o modelo preenche lacuna com memória. No primeiro carrossel real da
 * ferramenta ele citou uma homologação marítima que a marca não tem, inventou
 * "100%" numa métrica e atribuiu vigência a uma norma que não a declara. Os três
 * são o mesmo defeito: o prompt pedia um número e não dizia de onde ele sai.
 */
const SOURCING_RULES = `Regras de procedência (acima de qualquer regra de estilo):
- Norma, lei, certificação, código, data, prazo, percentual, quantidade e valor de
  multa só podem aparecer se estiverem literalmente na base de fatos ou no conteúdo
  de origem desta mensagem.
- Não estando lá, não escreva. Um slide a menos é sempre melhor que um dado inventado.
- Nunca cite norma pelo número se o número não veio de uma dessas fontes.
- Nunca arredonde, atualize ou "melhore" um número da base — copie como está.
- Não afirme vigência, prazo nem data de norma que a base não declara.
- Cada slide precisa acrescentar algo que os anteriores não disseram. Duas listas
  cobrindo o mesmo terreno são um slide desperdiçado.`;

/**
 * System prompt completo: regra de formato + procedência + data + base da marca.
 *
 * A base entra no system, não no brief: é contexto estável da marca, não a tarefa
 * do dia — e fica no lugar certo para virar prefixo cacheado se a conta de tokens
 * pedir.
 */
export function buildGroundedSystem(base: string, brandId: BrandId | null | undefined) {
  return [
    base,
    SOURCING_RULES,
    todayLine(),
    buildKnowledgeBlock(brandId),
    // Depois da base de marca de propósito: a regra de procedência é a última
    // coisa que o modelo lê antes de escrever, e é a que decide se um número
    // pode aparecer.
    buildNormativeBlock(brandId),
  ]
    .filter(Boolean)
    .join("\n\n");
}

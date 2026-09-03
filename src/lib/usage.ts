import { NoObjectGeneratedError, type LanguageModelUsage, type ProviderMetadata } from "ai";

import {
  EMPTY_USAGE,
  GENERATION_MODEL,
  priceUsage,
  type CostStep,
  type PricedModel,
  type TokenUsage,
} from "@/constants/pricing";

/**
 * Leitura do uso real de uma chamada, para virar dinheiro em `priceUsage`.
 *
 * Os campos do AI SDK são todos `number | undefined` porque nem todo provedor
 * reporta tudo. Ausência vira zero: um recibo que subestima é melhor que um
 * `NaN` no meio da tela.
 */
export function toTokenUsage(usage: LanguageModelUsage): TokenUsage {
  return {
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    cacheReadTokens: usage.inputTokenDetails?.cacheReadTokens ?? 0,
    cacheWriteTokens: usage.inputTokenDetails?.cacheWriteTokens ?? 0,
  };
}

export function addUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    cacheReadTokens: a.cacheReadTokens + b.cacheReadTokens,
    cacheWriteTokens: a.cacheWriteTokens + b.cacheWriteTokens,
  };
}

export { EMPTY_USAGE };

/**
 * Buscas na web cobradas em uma etapa.
 *
 * O AI SDK não normaliza uso de ferramenta de servidor — o contador só existe
 * no `usage` cru da Anthropic, repassado como JSON sem tipo em
 * `providerMetadata`. Daí a checagem manual de forma em vez de um acesso direto:
 * é dado de fora do sistema de tipos.
 */
export function countWebSearches(metadata: ProviderMetadata | undefined): number {
  const usage = metadata?.anthropic?.usage;
  if (typeof usage !== "object" || usage === null || Array.isArray(usage)) return 0;

  const serverToolUse = (usage as Record<string, unknown>).server_tool_use;
  if (
    typeof serverToolUse !== "object" ||
    serverToolUse === null ||
    Array.isArray(serverToolUse)
  ) {
    return 0;
  }

  const requests = (serverToolUse as Record<string, unknown>).web_search_requests;
  return typeof requests === "number" && Number.isFinite(requests) ? requests : 0;
}

/**
 * Soma as buscas de todas as etapas de um `generateText` com ferramenta.
 *
 * O `providerMetadata` do resultado descreve só a última etapa; com busca web a
 * Anthropic devolve uma etapa por rodada de ferramenta, então ler só o topo
 * perderia as buscas anteriores — justamente as caras.
 */
export function countWebSearchesAcrossSteps(
  steps: readonly { providerMetadata?: ProviderMetadata }[],
): number {
  return steps.reduce((total, step) => total + countWebSearches(step.providerMetadata), 0);
}

/**
 * A linha de recibo de uma geração que foi cobrada e não virou conteúdo.
 *
 * Quando `generateObject` reprova a resposta, o modelo JÁ rodou e a Anthropic já
 * cobrou — o `NoObjectGeneratedError` carrega o uso exatamente por isso. Sem
 * esta linha o recibo mostra US$ 0,0000 depois de minutos de Sonnet, que é a
 * forma mais cara de esconder gasto que aconteceu.
 *
 * Devolve `null` quando o erro é outro — rede, chave, tempo esgotado antes da
 * resposta —, porque aí não houve cobrança a registrar e inventar uma linha
 * seria mentir para o outro lado.
 */
export function failedGenerationStep(
  error: unknown,
  label: string,
  model: PricedModel = GENERATION_MODEL,
): CostStep | null {
  if (!NoObjectGeneratedError.isInstance(error) || !error.usage) return null;

  const usage = toTokenUsage(error.usage);
  return { label, usage, webSearches: 0, usd: priceUsage(usage, 0, model) };
}

/**
 * O erro é da PEÇA ou do LOTE?
 *
 * `NoObjectGeneratedError` é conteúdo: aquela peça específica voltou fora do
 * schema, e as outras do lote não têm nada com isso. Qualquer outro erro —
 * rede, chave, tempo esgotado — atinge o lote inteiro, e seis cartões repetindo
 * "sem conexão" seria ruído, não aviso. A separação é o que deixa uma peça
 * falhar sozinha sem transformar uma queda de rede em seis falhas de conteúdo.
 */
export const isContentFailure = (error: unknown) => NoObjectGeneratedError.isInstance(error);

/**
 * A mensagem de uma geração que falhou, em português e dizendo o que fazer.
 *
 * `NoObjectGeneratedError` chega como "No object generated: response did not
 * match schema." — inglês, vocabulário de biblioteca, e sem dizer se o certo é
 * clicar de novo ou mexer no prompt. Foi essa frase que apareceu na tela depois
 * de 2,4 minutos de espera. Qualquer outro erro (rede, chave, tempo esgotado)
 * passa com o texto original, que aí descreve mesmo o que aconteceu.
 */
export function generationErrorMessage(error: unknown, oQue: string): string {
  if (NoObjectGeneratedError.isInstance(error)) {
    return `a IA devolveu ${oQue} numa forma que a ferramenta não lê. Gere de novo — se repetir, o material de origem provavelmente é o problema.`;
  }
  return error instanceof Error ? error.message : "erro desconhecido";
}

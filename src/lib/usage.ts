import type { LanguageModelUsage, ProviderMetadata } from "ai";

import { EMPTY_USAGE, type TokenUsage } from "@/constants/pricing";

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

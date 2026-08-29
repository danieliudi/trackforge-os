/**
 * Preço da API da Anthropic e conversão de uso em dinheiro.
 *
 * Tabela oficial consultada em 29/08/2026:
 * https://platform.claude.com/docs/en/about-claude/pricing
 *
 * Só o Sonnet 5 está aqui porque é o único modelo que as rotas chamam. Trocar
 * de modelo sem acrescentar a linha correspondente quebra o build no `satisfies`
 * lá embaixo — de propósito: um preço errado é pior que preço nenhum.
 */

/** Dólares por token. A tabela da Anthropic é por milhão. */
const perMillion = (dollars: number) => dollars / 1_000_000;

export const MODEL_PRICING = {
  "claude-sonnet-5": {
    input: perMillion(2),
    output: perMillion(10),
    cacheRead: perMillion(0.2),
    cacheWrite: perMillion(2.5),
  },
} satisfies Record<string, Record<"input" | "output" | "cacheRead" | "cacheWrite", number>>;

export type PricedModel = keyof typeof MODEL_PRICING;

/** O modelo que as três rotas de geração usam hoje. */
export const GENERATION_MODEL: PricedModel = "claude-sonnet-5";

/**
 * US$ 10 por 1.000 buscas, cobrados por busca além dos tokens do resultado.
 * É o item mais caro de uma geração com notícias — daí ele aparecer como linha
 * separada no recibo em vez de diluído no total.
 */
export const WEB_SEARCH_PRICE = 0.01;

/**
 * Cotação usada para exibir o custo em real.
 *
 * Sem `NEXT_PUBLIC_USD_BRL` configurado a interface mostra só dólar. Cravar uma
 * cotação padrão aqui seria inventar um número que envelhece sozinho e vira
 * mentira silenciosa no recibo; melhor mostrar menos e certo.
 */
export function usdToBrlRate(): number | null {
  const raw = process.env.NEXT_PUBLIC_USD_BRL;
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** Uso de tokens de uma chamada, no formato que o AI SDK devolve. */
export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
};

/** Uma etapa da geração — vira uma linha do recibo. */
export type CostStep = {
  /** Rótulo exibido ao usuário, já em português. */
  label: string;
  usage: TokenUsage;
  /** Buscas na web cobradas nesta etapa. */
  webSearches: number;
  usd: number;
};

export type GenerationCost = {
  usd: number;
  steps: CostStep[];
};

/**
 * Custo em dólar de uma chamada.
 *
 * Token em cache tem preço próprio (leitura sai por 10% da entrada), então os
 * tokens cacheados são descontados da entrada cheia em vez de somados por cima.
 * Hoje o app não usa cache e as duas parcelas são zero — a conta já fica certa
 * para quando usar.
 */
export function priceUsage(
  usage: TokenUsage,
  webSearches = 0,
  model: PricedModel = GENERATION_MODEL,
): number {
  const price = MODEL_PRICING[model];
  const uncachedInput = Math.max(
    0,
    usage.inputTokens - usage.cacheReadTokens - usage.cacheWriteTokens,
  );

  return (
    uncachedInput * price.input +
    usage.cacheReadTokens * price.cacheRead +
    usage.cacheWriteTokens * price.cacheWrite +
    usage.outputTokens * price.output +
    webSearches * WEB_SEARCH_PRICE
  );
}

export const EMPTY_USAGE: TokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
};

export function sumUsage(steps: CostStep[]): TokenUsage {
  return steps.reduce<TokenUsage>(
    (total, step) => ({
      inputTokens: total.inputTokens + step.usage.inputTokens,
      outputTokens: total.outputTokens + step.usage.outputTokens,
      cacheReadTokens: total.cacheReadTokens + step.usage.cacheReadTokens,
      cacheWriteTokens: total.cacheWriteTokens + step.usage.cacheWriteTokens,
    }),
    { ...EMPTY_USAGE },
  );
}

export function totalSearches(steps: CostStep[]): number {
  return steps.reduce((total, step) => total + step.webSearches, 0);
}

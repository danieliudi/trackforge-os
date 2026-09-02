import { usdToBrlRate, type GenerationCost } from "@/constants/pricing";

/** Versionado igual aos rascunhos: formato novo descarta o payload antigo. */
const KEY = "carousel-builder:cost-log:v1";

/**
 * Teto de entradas guardadas.
 *
 * O log divide os ~5MB de cota do localStorage com os rascunhos, que carregam
 * imagem em data URL e são muito mais pesados. 500 entradas resolvem meses de
 * histórico e ocupam poucos KB; passar disso derrubaria o autosave do rascunho,
 * que é o dado que o usuário não pode perder.
 */
const MAX_ENTRIES = 500;

export type CostKind =
  | "carrossel"
  | "apresentacao"
  | "artigo"
  | "derivacao"
  | "avulso"
  | "slide"
  | "sugestoes";

export const costKindLabels: Record<CostKind, string> = {
  carrossel: "Carrossel",
  apresentacao: "Apresentação",
  artigo: "Artigo",
  derivacao: "Derivação",
  avulso: "Peça avulsa",
  slide: "Slide avulso",
  sugestoes: "Sugestões de tema",
};

export type CostEntry = {
  id: string;
  at: number;
  kind: CostKind;
  /** Título do documento na hora da geração — dá contexto ao histórico. */
  title: string;
  usd: number;
  inputTokens: number;
  outputTokens: number;
  webSearches: number;
  /** Geração cobrada que não virou conteúdo (resposta fora das regras). */
  failed: boolean;
};

const VALID_KINDS = new Set<string>(Object.keys(costKindLabels));

function isValidEntry(value: unknown): value is CostEntry {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Record<string, unknown>;

  return (
    typeof data.id === "string" &&
    typeof data.at === "number" &&
    typeof data.kind === "string" &&
    VALID_KINDS.has(data.kind) &&
    typeof data.title === "string" &&
    typeof data.usd === "number" &&
    Number.isFinite(data.usd) &&
    typeof data.inputTokens === "number" &&
    typeof data.outputTokens === "number" &&
    typeof data.webSearches === "number" &&
    typeof data.failed === "boolean"
  );
}

export function loadCostLog(): CostEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidEntry) : [];
  } catch {
    return [];
  }
}

/**
 * Store externo do log, consumido por `useSyncExternalStore`.
 *
 * O chip de custo some quando o log está vazio, então ler o localStorage no
 * inicializador de um `useState` fazia o servidor renderizar sem o chip e o
 * cliente com ele — mismatch de hidratação que derruba a árvore. O store resolve
 * porque tem snapshot de servidor próprio: hidrata vazio como o HTML, e troca
 * pelo valor real logo depois, sem `setState` dentro de efeito.
 */
const EMPTY: CostEntry[] = [];
let cache: CostEntry[] | null = null;
const listeners = new Set<() => void>();

export function subscribeCostLog(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Precisa ser referencialmente estável entre chamadas, ou o React entra em loop. */
export function getCostLogSnapshot(): CostEntry[] {
  cache ??= loadCostLog();
  return cache;
}

export function getCostLogServerSnapshot(): CostEntry[] {
  return EMPTY;
}

/**
 * Grava uma geração no log e avisa quem observa.
 *
 * Falha de escrita não interrompe nada: perder uma linha do extrato é menos
 * grave que travar a geração que o usuário acabou de pagar.
 */
export function pushCostEntry(entry: Omit<CostEntry, "id" | "at">): void {
  cache = [
    { ...entry, id: crypto.randomUUID(), at: Date.now() },
    ...getCostLogSnapshot(),
  ].slice(0, MAX_ENTRIES);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(cache));
    } catch {
      // segue com o valor em memória
    }
  }

  listeners.forEach((listener) => listener());
}

/** Converte um `GenerationCost` da API no que o log guarda. */
export function entryFromCost(
  cost: GenerationCost,
  kind: CostKind,
  title: string,
  failed = false,
): Omit<CostEntry, "id" | "at"> {
  return {
    kind,
    title,
    failed,
    usd: cost.usd,
    inputTokens: cost.steps.reduce((total, step) => total + step.usage.inputTokens, 0),
    outputTokens: cost.steps.reduce((total, step) => total + step.usage.outputTokens, 0),
    webSearches: cost.steps.reduce((total, step) => total + step.webSearches, 0),
  };
}

export type MonthSummary = {
  usd: number;
  count: number;
  byKind: { kind: CostKind; label: string; usd: number; count: number }[];
  /** Só o que as buscas na web custaram — o item que costuma surpreender. */
  searchUsd: number;
  searchCount: number;
  /** Média por documento gerado (carrossel ou apresentação), não por chamada. */
  averagePostUsd: number;
};

const SEARCH_PRICE = 0.01;

/** Documentos de verdade; slide avulso e sugestão são acessórios do mesmo post. */
const POST_KINDS = new Set<CostKind>(["carrossel", "apresentacao"]);

export function summarizeMonth(entries: CostEntry[], reference = new Date()): MonthSummary {
  const year = reference.getFullYear();
  const month = reference.getMonth();

  const inMonth = entries.filter((entry) => {
    const date = new Date(entry.at);
    return date.getFullYear() === year && date.getMonth() === month;
  });

  const byKind = (Object.keys(costKindLabels) as CostKind[])
    .map((kind) => {
      const rows = inMonth.filter((entry) => entry.kind === kind);
      return {
        kind,
        label: costKindLabels[kind],
        usd: rows.reduce((total, entry) => total + entry.usd, 0),
        count: rows.length,
      };
    })
    .filter((row) => row.count > 0)
    .sort((a, b) => b.usd - a.usd);

  const searchCount = inMonth.reduce((total, entry) => total + entry.webSearches, 0);
  const postCount = inMonth.filter((entry) => POST_KINDS.has(entry.kind)).length;
  const usd = inMonth.reduce((total, entry) => total + entry.usd, 0);

  return {
    usd,
    count: inMonth.length,
    byKind,
    searchUsd: searchCount * SEARCH_PRICE,
    searchCount,
    averagePostUsd: postCount > 0 ? usd / postCount : 0,
  };
}

/** US$ com 4 casas — a granularidade em que uma geração ainda é visível. */
export function formatUsd(value: number): string {
  return `US$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })}`;
}

export function formatBrl(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Dólar sempre; real só quando há cotação configurada.
 *
 * Sem `NEXT_PUBLIC_USD_BRL` a interface mostra o valor exato em dólar em vez de
 * converter por um número inventado.
 */
export function formatCost(usd: number): { primary: string; secondary: string | null } {
  const rate = usdToBrlRate();
  return rate
    ? { primary: formatBrl(usd * rate), secondary: formatUsd(usd) }
    : { primary: formatUsd(usd), secondary: null };
}

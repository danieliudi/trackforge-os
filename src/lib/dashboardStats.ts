import type { BrandId } from "@/constants/brands";
import {
  costKindLabels,
  summarizeMonth,
  type CostEntry,
  type CostKind,
  type MonthSummary,
} from "@/lib/costLog";
import type { Production } from "@/lib/produced";

/**
 * Agregações do painel de Situação.
 *
 * Tudo aqui é puro: recebe o snapshot do localStorage e devolve o que a UI
 * precisa. Sem Date.now() no render — o `reference` vem de quem chama.
 */

export type PendingPieceRow = {
  id: string;
  title: string;
  summary: string | null;
  priority: string;
  createdAt?: string;
};

export type DailySpendPoint = {
  day: string;
  label: string;
  usd: number;
  count: number;
};

export type KindBarPoint = {
  kind: CostKind;
  label: string;
  usd: number;
  count: number;
};

export type DashboardStats = {
  pendingCount: number;
  unsent: Production[];
  flagged: Production[];
  flaggedClaimCount: number;
  month: MonthSummary;
  byKind: KindBarPoint[];
  daily: DailySpendPoint[];
  failedCount: number;
};

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Produções da frente ativa (null brand só entra quando a frente também é null — não acontece no shell). */
export function productionsForFront(
  productions: Production[],
  brandId: BrandId,
): Production[] {
  return productions.filter((item) => item.brandId === brandId);
}

export function flaggedClaimTotal(production: Production): number {
  return production.pieces.reduce((total, piece) => total + piece.flagged, 0);
}

/**
 * Série diária do mês de `reference`. Dias sem gasto entram com zero para o
 * gráfico não saltar — e o rótulo curto (dia do mês) cabe no eixo.
 */
export function dailySpendInMonth(
  entries: CostEntry[],
  reference: Date,
): DailySpendPoint[] {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const bucket = new Map<string, { usd: number; count: number }>();

  for (const entry of entries) {
    const date = new Date(entry.at);
    if (date.getFullYear() !== year || date.getMonth() !== month) continue;
    const key = dayKey(date);
    const current = bucket.get(key) ?? { usd: 0, count: 0 };
    bucket.set(key, { usd: current.usd + entry.usd, count: current.count + 1 });
  }

  const points: DailySpendPoint[] = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const key = dayKey(date);
    const row = bucket.get(key) ?? { usd: 0, count: 0 };
    points.push({
      day: key,
      label: String(day),
      usd: row.usd,
      count: row.count,
    });
  }
  return points;
}

export function buildDashboardStats(input: {
  productions: Production[];
  costEntries: CostEntry[];
  brandId: BrandId;
  pending: PendingPieceRow[];
  reference?: Date;
}): DashboardStats {
  const reference = input.reference ?? new Date();
  const mine = productionsForFront(input.productions, input.brandId);
  const unsent = mine.filter((item) => !item.sent);
  const flagged = mine.filter((item) => flaggedClaimTotal(item) > 0);
  const flaggedClaimCount = flagged.reduce(
    (total, item) => total + flaggedClaimTotal(item),
    0,
  );

  const month = summarizeMonth(input.costEntries, reference);
  const byKind: KindBarPoint[] = month.byKind.map((row) => ({
    kind: row.kind,
    label: costKindLabels[row.kind],
    usd: row.usd,
    count: row.count,
  }));

  const monthPrefix = monthKey(reference);
  const failedCount = input.costEntries.filter((entry) => {
    if (!entry.failed) return false;
    const date = new Date(entry.at);
    return monthKey(date) === monthPrefix;
  }).length;

  return {
    pendingCount: input.pending.length,
    unsent,
    flagged,
    flaggedClaimCount,
    month,
    byKind,
    daily: dailySpendInMonth(input.costEntries, reference),
    failedCount,
  };
}

/** Meses que têm pelo menos uma entrada no log — para o seletor do painel. */
export function monthsWithCost(entries: CostEntry[]): { year: number; month: number; label: string }[] {
  const seen = new Map<string, { year: number; month: number }>();
  for (const entry of entries) {
    const date = new Date(entry.at);
    const key = monthKey(date);
    if (!seen.has(key)) {
      seen.set(key, { year: date.getFullYear(), month: date.getMonth() });
    }
  }

  const MONTHS = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];

  return [...seen.values()]
    .sort((a, b) => b.year - a.year || b.month - a.month)
    .map(({ year, month }) => ({
      year,
      month,
      label: `${MONTHS[month]}/${year}`,
    }));
}

/**
 * O que espera decisão sua, e qual é o primeiro da fila.
 *
 * POR QUE ISTO É UMA FUNÇÃO E NÃO DUAS CONTAS: a faixa da casca e o glifo da
 * home respondem à MESMA pergunta em telas diferentes. Se cada uma ordenasse por
 * conta própria, um dia a faixa diria "2 esperando" e a home mostraria outra
 * coisa — e aí nenhuma das duas seria confiável. A ordem mora aqui.
 *
 * Custo NÃO entra: é leitura, não pendência. Uma conta alta pede atenção sua
 * noutro momento, não interrompe o trabalho.
 *
 * Devolve `null` quando nada pede decisão — o que é uma resposta, não a ausência
 * de uma: é o que autoriza a faixa a dizer "em dia".
 */
export type EsperaId = "fila" | "nao-enviados" | "sem-fonte";

export type Espera = {
  id: EsperaId;
  /** Quantos itens, para o glifo e para a faixa. */
  total: number;
  /** Rótulo curto, na voz da faixa. */
  rotulo: string;
};

export function esperandoDecisao(input: {
  productions: Production[];
  brandId: BrandId;
  /** `null` quando o CRM não está configurado: fila desconhecida ≠ fila vazia. */
  pendingCount: number | null;
}): Espera | null {
  const mine = productionsForFront(input.productions, input.brandId);
  const naoEnviados = mine.filter((item) => !item.sent).length;
  const semFonte = mine.filter((item) => flaggedClaimTotal(item) > 0).length;

  // `null` é fila DESCONHECIDA e não fila vazia, e a diferença não se resolve
  // aqui: sem número, esta função não tem o que contar, e quem sabe que a fila
  // não foi consultada é a casca — que mostra "fila não configurada" em vez de
  // "em dia". Antes isto era `?? 0`, que apagava a distinção na linha seguinte
  // ao comentário que a declara.
  const fila = input.pendingCount;
  if (fila !== null && fila > 0) return { id: "fila", total: fila, rotulo: "na fila do CRM" };
  if (naoEnviados > 0) return { id: "nao-enviados", total: naoEnviados, rotulo: "não enviados" };
  if (semFonte > 0) return { id: "sem-fonte", total: semFonte, rotulo: "sem fonte" };
  return null;
}

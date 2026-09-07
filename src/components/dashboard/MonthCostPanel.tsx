"use client";

import { formatCost, type MonthSummary } from "@/lib/costLog";
import { labelClass, metaClass, panelClass } from "@/lib/ui";

type MonthCostPanelProps = {
  month: MonthSummary;
  failedCount: number;
};

export function MonthCostPanel({ month, failedCount }: MonthCostPanelProps) {
  const total = formatCost(month.usd);
  const search = formatCost(month.searchUsd);
  const average = formatCost(month.averagePostUsd);

  return (
    <div className={`${panelClass} flex flex-col gap-2 px-4 py-3.5`}>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-ok" aria-hidden />
        <span className={labelClass}>Resumo do mês</span>
      </div>

      <div className="flex flex-col gap-0.5 border-b border-line2 pb-3">
        <span className="text-2xl font-semibold tabular-nums tracking-tight text-ok">
          {total.primary}
        </span>
        <span className="text-[11px] text-mut">
          {total.secondary ? `${total.secondary} · ` : ""}
          {month.count} {month.count === 1 ? "geração" : "gerações"}
        </span>
      </div>

      <div className="flex flex-col">
        <div className="flex items-baseline justify-between gap-2 border-b border-line2 py-2.5">
          <span className="text-[13px] text-ink2">Busca web</span>
          <span className="text-right font-mono text-[11px] tabular-nums text-ink">
            {search.primary}
            <span className={metaClass}> · {month.searchCount}</span>
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2 border-b border-line2 py-2.5">
          <span className="text-[13px] text-ink2">Média por post</span>
          <span className="font-mono text-[11px] tabular-nums text-ink">
            {month.averagePostUsd > 0 ? average.primary : "—"}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2 py-2.5">
          <span className="text-[13px] text-ink2">Cobradas sem resultado</span>
          <span className="font-mono text-[11px] tabular-nums text-ink">{failedCount}</span>
        </div>
      </div>
    </div>
  );
}

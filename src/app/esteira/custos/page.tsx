"use client";

import clsx from "clsx";
import { useSyncExternalStore } from "react";

import { EsteiraShell, ShellPage } from "@/components/app/EsteiraShell";
import {
  costKindLabels,
  formatCost,
  getCostLogServerSnapshot,
  getCostLogSnapshot,
  subscribeCostLog,
  summarizeMonth,
  type CostKind,
} from "@/lib/costLog";
import { labelClass, metaClass, panelClass } from "@/lib/ui";

/** O histórico do medidor — com a quebra que o summarizeMonth já calculava. */
export default function CustosPage() {
  const entries = useSyncExternalStore(
    subscribeCostLog,
    getCostLogSnapshot,
    getCostLogServerSnapshot,
  );

  const summary = summarizeMonth(entries);
  const totalUsd = entries.reduce((total, entry) => total + entry.usd, 0);
  const monthCost = formatCost(summary.usd);
  const allCost = formatCost(totalUsd);
  const search = formatCost(summary.searchUsd);
  const average = formatCost(summary.averagePostUsd);
  const maxKindUsd = Math.max(...summary.byKind.map((row) => row.usd), 0);

  return (
    <EsteiraShell>
      <ShellPage>
        <div className="flex flex-col gap-0.5">
          <span className={labelClass}>Custos</span>
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            O que a API cobrou
          </h1>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className={clsx(panelClass, "flex flex-col gap-0.5 px-4 py-3.5")}>
            <span className="text-2xl font-bold leading-none tracking-tight tabular-nums text-ok">
              {monthCost.primary}
            </span>
            <span className="text-xs text-mut">
              neste mês · {summary.count}{" "}
              {summary.count === 1 ? "geração" : "gerações"}
              {summary.averagePostUsd > 0
                ? ` · média ${average.primary}/post`
                : ""}
            </span>
          </div>
          <div className={clsx(panelClass, "flex flex-col gap-0.5 px-4 py-3.5")}>
            <span className="text-2xl font-bold leading-none tracking-tight tabular-nums text-ink">
              {allCost.primary}
            </span>
            <span className="text-xs text-mut">desde que o medidor existe</span>
          </div>
        </div>

        {summary.count > 0 ? (
          <div className={clsx(panelClass, "flex flex-col gap-3 px-4 py-3.5")}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className={labelClass}>Por tipo neste mês</span>
              <span className={metaClass}>
                busca web {search.primary} · n={summary.searchCount}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {summary.byKind.map((row) => (
                <div key={row.kind} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
                    <span className="text-ink2">
                      {costKindLabels[row.kind]}{" "}
                      <span className="font-mono text-[10px] tabular-nums text-faint">
                        n={row.count}
                      </span>
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-ink">
                      {formatCost(row.usd).primary}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface2">
                    <div
                      className="h-full rounded-full bg-acc"
                      style={{
                        width: `${maxKindUsd > 0 ? Math.round((row.usd / maxKindUsd) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {entries.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-3.5 py-3 text-[12.5px] text-mut">
            Nada gerado ainda neste navegador. O histórico é local — não sai daqui.
          </p>
        ) : (
          <div className={clsx(panelClass, "overflow-hidden")}>
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-line2 px-3.5 py-2.5 last:border-b-0"
              >
                <span className="font-mono text-[10px] uppercase tracking-wide text-faint">
                  {costKindLabels[entry.kind as CostKind] ?? entry.kind}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink2">
                  {entry.title}
                </span>
                {entry.failed ? (
                  <span className="font-mono text-[9.5px] uppercase text-warn">
                    cobrada, sem resultado
                  </span>
                ) : null}
                <span className="font-mono text-[10px] tabular-nums text-faint">
                  {new Date(entry.at).toLocaleDateString("pt-BR")}
                </span>
                <span className="w-20 text-right font-mono text-[11px] tabular-nums text-ink2">
                  {formatCost(entry.usd).primary}
                </span>
              </div>
            ))}
          </div>
        )}
      </ShellPage>
    </EsteiraShell>
  );
}

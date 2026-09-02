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
  type CostKind,
} from "@/lib/costLog";
import { labelClass, panelClass } from "@/lib/ui";

/** O histórico do medidor por inteiro, que no cabeçalho só cabia resumido. */
export default function CustosPage() {
  const entries = useSyncExternalStore(
    subscribeCostLog,
    getCostLogSnapshot,
    getCostLogServerSnapshot,
  );

  const month = new Date().getMonth();
  const monthUsd = entries
    .filter((entry) => new Date(entry.at).getMonth() === month)
    .reduce((total, entry) => total + entry.usd, 0);
  const totalUsd = entries.reduce((total, entry) => total + entry.usd, 0);

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
            {formatCost(monthUsd).primary}
          </span>
          <span className="text-xs text-mut">neste mês</span>
        </div>
        <div className={clsx(panelClass, "flex flex-col gap-0.5 px-4 py-3.5")}>
          <span className="text-2xl font-bold leading-none tracking-tight tabular-nums text-ink">
            {formatCost(totalUsd).primary}
          </span>
          <span className="text-xs text-mut">desde que o medidor existe</span>
        </div>
      </div>

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

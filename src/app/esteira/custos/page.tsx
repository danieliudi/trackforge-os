"use client";

import clsx from "clsx";
import { useSyncExternalStore } from "react";

import { EsteiraShell } from "@/components/app/EsteiraShell";
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
      <div className="flex flex-col gap-0.5">
        <span className={labelClass}>Custos</span>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          O que a API cobrou
        </h1>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <div className={clsx(panelClass, "flex flex-col gap-0.5 px-4 py-3.5")}>
          <span className="text-2xl font-bold leading-none tracking-tight tabular-nums text-emerald-700">
            {formatCost(monthUsd).primary}
          </span>
          <span className="text-xs text-zinc-500">neste mês</span>
        </div>
        <div className={clsx(panelClass, "flex flex-col gap-0.5 px-4 py-3.5")}>
          <span className="text-2xl font-bold leading-none tracking-tight tabular-nums text-zinc-900">
            {formatCost(totalUsd).primary}
          </span>
          <span className="text-xs text-zinc-500">desde que o medidor existe</span>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 px-3.5 py-3 text-[12.5px] text-zinc-500">
          Nada gerado ainda neste navegador. O histórico é local — não sai daqui.
        </p>
      ) : (
        <div className={clsx(panelClass, "overflow-hidden")}>
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-zinc-100 px-3.5 py-2.5 last:border-b-0"
            >
              <span className="font-mono text-[10px] uppercase tracking-wide text-zinc-400">
                {costKindLabels[entry.kind as CostKind] ?? entry.kind}
              </span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-zinc-700">
                {entry.title}
              </span>
              {entry.failed ? (
                <span className="font-mono text-[9.5px] uppercase text-amber-700">
                  cobrada, sem resultado
                </span>
              ) : null}
              <span className="font-mono text-[10px] tabular-nums text-zinc-400">
                {new Date(entry.at).toLocaleDateString("pt-BR")}
              </span>
              <span className="w-20 text-right font-mono text-[11px] tabular-nums text-zinc-700">
                {formatCost(entry.usd).primary}
              </span>
            </div>
          ))}
        </div>
      )}
    </EsteiraShell>
  );
}

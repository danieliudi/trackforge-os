"use client";

import clsx from "clsx";
import { AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { usdToBrlRate } from "@/constants/pricing";
import {
  costKindLabels,
  formatCost,
  formatUsd,
  summarizeMonth,
  type CostEntry,
} from "@/lib/costLog";
import { focusRing, labelClass, panelClass } from "@/lib/ui";

type CostMenuProps = {
  entries: CostEntry[];
};

const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function timeLabel(at: number) {
  const date = new Date(at);
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const today = new Date();
  const sameDay =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
  if (sameDay) return `hoje, ${time}`;

  return `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}, ${time}`;
}

/**
 * Acumulado do mês no cabeçalho, com extrato ao clicar.
 *
 * O painel da Anthropic dá o total da conta, não o custo por post — e é o custo
 * por post que decide se vale gerar de novo. Só aparece depois da primeira
 * geração: um contador zerado não informa nada e rouba espaço do cabeçalho.
 */
export function CostMenu({ entries }: CostMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (entries.length === 0) return null;

  const now = new Date();
  const summary = summarizeMonth(entries, now);
  const month = MONTHS[now.getMonth()];
  const total = formatCost(summary.usd);
  const searchShare =
    summary.usd > 0 ? Math.round((summary.searchUsd / summary.usd) * 100) : 0;
  const maxKindUsd = Math.max(...summary.byKind.map((row) => row.usd), 0);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        title={`Gasto de ${month} com a API`}
        className={clsx(
          "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] transition",
          open
            ? "border-zinc-900 text-zinc-900"
            : "border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900",
          focusRing,
        )}
      >
        <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
        <span className="font-medium tabular-nums text-zinc-900">{total.primary}</span>
        <span className="hidden sm:inline">em {month}</span>
      </button>

      {open ? (
        <div
          className={clsx(
            panelClass,
            "absolute right-0 top-full z-10 mt-1.5 w-80 overflow-hidden shadow-lg",
          )}
        >
          <div className="flex flex-col gap-0.5 border-b border-zinc-200 px-4 py-3">
            <span className={labelClass}>Gasto de {month}</span>
            <span className="text-2xl font-semibold tabular-nums tracking-tight text-emerald-700">
              {total.primary}
            </span>
            <span className="text-[11px] text-zinc-500">
              {total.secondary ? `${total.secondary} · ` : ""}
              {summary.count} {summary.count === 1 ? "geração" : "gerações"}
              {summary.averagePostUsd > 0
                ? ` · média de ${formatCost(summary.averagePostUsd).primary} por post`
                : ""}
            </span>
          </div>

          <div className="flex flex-col gap-2 border-b border-zinc-100 px-4 py-3">
            <span className={labelClass}>Por tipo</span>
            <div className="flex flex-col gap-1.5">
              {summary.byKind.map((row) => (
                <div key={row.kind} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2 text-[11.5px]">
                    <span className="text-zinc-600">
                      {costKindLabels[row.kind]}{" "}
                      <span className="font-mono text-[10px] tabular-nums text-zinc-400">
                        {row.count}
                      </span>
                    </span>
                    <span className="font-mono text-[10.5px] tabular-nums text-zinc-900">
                      {formatCost(row.usd).primary}
                    </span>
                  </div>
                  <div className="h-[3px] overflow-hidden rounded-sm bg-zinc-100">
                    <span
                      className="block h-full bg-emerald-600"
                      style={{
                        width: `${maxKindUsd > 0 ? (row.usd / maxKindUsd) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {summary.searchCount > 0 ? (
            <div className="border-b border-zinc-100 px-4 py-3">
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11.5px] leading-relaxed text-amber-900">
                <AlertTriangle size={13} className="mt-px shrink-0" />
                <span>
                  <strong className="font-semibold">
                    {formatCost(summary.searchUsd).primary} ({searchShare}%)
                  </strong>{" "}
                  saíram de buscas de notícia — {summary.searchCount}{" "}
                  {summary.searchCount === 1 ? "busca" : "buscas"} a{" "}
                  {formatUsd(0.01)} cada.
                </span>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 px-4 py-3">
            <span className={labelClass}>Últimas gerações</span>
            <div className="flex max-h-56 flex-col overflow-y-auto">
              {entries.slice(0, 12).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-baseline justify-between gap-3 border-b border-zinc-100 py-1.5 last:border-b-0"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[11.5px] text-zinc-700">
                      {entry.title}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {timeLabel(entry.at)} · {costKindLabels[entry.kind].toLowerCase()}
                      {entry.webSearches > 0 ? " · com notícias" : ""}
                      {entry.failed ? " · falhou" : ""}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-zinc-900">
                    {formatCost(entry.usd).primary}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {usdToBrlRate() === null ? (
            <p className="border-t border-zinc-100 bg-zinc-50 px-4 py-2.5 text-[10.5px] leading-relaxed text-zinc-500">
              Defina <code className="font-mono">NEXT_PUBLIC_USD_BRL</code> no{" "}
              <code className="font-mono">.env.local</code> para ver os valores
              também em real.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

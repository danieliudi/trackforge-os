"use client";

import clsx from "clsx";
import { useSyncExternalStore } from "react";

import { EsteiraShell, ShellPage } from "@/components/app/EsteiraShell";
import { BlockHead, CellGrid, PageHead, Sheet } from "@/components/app/Interior";
import {
  costKindLabels,
  formatCost,
  getCostLogServerSnapshot,
  getCostLogSnapshot,
  subscribeCostLog,
  summarizeMonth,
  type CostKind,
} from "@/lib/costLog";

const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** Extrato local — KPIs Situação + quebra summarizeMonth + lista. */
export default function CustosPage() {
  const entries = useSyncExternalStore(
    subscribeCostLog,
    getCostLogSnapshot,
    getCostLogServerSnapshot,
  );

  const now = new Date();
  const summary = summarizeMonth(entries, now);
  const totalUsd = entries.reduce((total, entry) => total + entry.usd, 0);
  const monthCost = formatCost(summary.usd);
  const allCost = formatCost(totalUsd);
  const search = formatCost(summary.searchUsd);
  const average = formatCost(summary.averagePostUsd);
  const monthLabel = `${MONTHS[now.getMonth()]}/${now.getFullYear()}`;

  return (
    <EsteiraShell>
      <ShellPage>
        <PageHead secao="Custos" titulo="O que a API cobrou" aoLado={monthLabel}>
          Histórico local deste navegador. Não sai daqui, e não existe cobrança
          que não esteja nesta lista.
        </PageHead>

        <CellGrid
          celulas={[
            {
              n: "01",
              valor: monthCost.primary,
              rotulo:
                summary.count === 0
                  ? "neste mês · nenhuma geração"
                  : `neste mês · ${summary.count} ${summary.count === 1 ? "geração" : "gerações"}`,
              // O mês corrente é o que está sendo lido; a inversão espelha isso.
              destaque: true,
            },
            { n: "02", valor: allCost.primary, rotulo: "desde o início" },
            { n: "03", valor: search.primary, rotulo: `busca web · n=${summary.searchCount}` },
            {
              n: "04",
              valor: summary.averagePostUsd > 0 ? average.primary : "—",
              rotulo: "média/post",
            },
          ]}
        />

        {summary.count > 0 ? (
          <>
            <BlockHead nota={`busca web ${search.primary} · n=${summary.searchCount}`}>
              Por tipo, neste mês
            </BlockHead>
            <Sheet>
              {summary.byKind.map((row, i) => (
                <div
                  key={row.kind}
                  className="grid grid-cols-[40px_160px_1fr_auto] items-baseline gap-3 border-b border-dotted border-rule px-6 py-3 last:border-b-0"
                >
                  <span className="font-mono text-[11px] text-mut">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {/* O TIPO é palavra, então sans. O dinheiro é coluna que
                      alinha dígito com dígito, então mono (seção 4). */}
                  <span className="text-[11.5px] font-semibold uppercase tracking-[0.07em] text-mut">
                    {costKindLabels[row.kind]}
                  </span>
                  <span className="text-[14.5px] text-ink">
                    {row.count} {row.count === 1 ? "geração" : "gerações"}
                  </span>
                  <span className="font-mono text-[15px] tabular-nums text-ink">
                    {formatCost(row.usd).primary}
                  </span>
                </div>
              ))}
            </Sheet>
          </>
        ) : null}

        <div className="flex flex-col gap-2">
          <BlockHead nota="o que falhou continua na conta">
            Extrato · n={entries.length}
          </BlockHead>

          {entries.length === 0 ? (
            <p className="border-2 border-dashed border-rule px-4 py-6 text-center text-[15px] text-mut">
              Nada gerado ainda neste navegador. O histórico é local — não sai daqui.
            </p>
          ) : (
            <Sheet>
              {entries.map((entry, i) => (
                <div
                  key={entry.id}
                  className={clsx(
                    "grid grid-cols-[40px_160px_1fr_auto_auto] items-baseline gap-3 border-b border-dotted border-rule py-3 last:border-b-0",
                    // Geração cobrada que não virou peça: a marca é BARRA, não
                    // letra. `urgent` sobre a célula dá 4,26:1 — passa como
                    // ornamento e reprova como corpo (medido no mockup). Mesma
                    // decisão do sinal da faixa: a cor vira preenchimento.
                    // `border-l-solid` explícito: sem ele a barra herda o pontilhado da
                    // borda de baixo da linha e vira tracinho, não marca.
                    entry.failed
                      ? "border-l-[3px] border-l-solid border-l-urgent pl-[21px] pr-6"
                      : "px-6",
                  )}
                >
                  <span className="font-mono text-[11px] text-mut">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[11.5px] font-semibold uppercase leading-[1.35] tracking-[0.07em] text-mut">
                    {costKindLabels[entry.kind as CostKind] ?? entry.kind}
                    {entry.failed ? " · não virou peça" : ""}
                  </span>
                  <span className="min-w-0 truncate text-[14.5px] text-ink">{entry.title}</span>
                  <span className="font-mono text-[11.5px] tabular-nums text-mut">
                    {new Date(entry.at).toLocaleDateString("pt-BR")}
                  </span>
                  <span className="w-24 text-right font-mono text-[15px] tabular-nums text-ink">
                    {formatCost(entry.usd).primary}
                  </span>
                </div>
              ))}
            </Sheet>
          )}
        </div>
      </ShellPage>
    </EsteiraShell>
  );
}

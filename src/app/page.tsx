"use client";

import { Inbox } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { EsteiraShell, useFront } from "@/components/app/EsteiraShell";
import { CostByKindChart } from "@/components/dashboard/CostByKindChart";
import { DailySpendChart } from "@/components/dashboard/DailySpendChart";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { MonthCostPanel } from "@/components/dashboard/MonthCostPanel";
import { PendingOrFactsPanel } from "@/components/dashboard/PendingOrFactsPanel";
import { UnsentList } from "@/components/dashboard/UnsentList";
import { brandLabel } from "@/constants/brands";
import {
  buildDashboardStats,
  monthsWithCost,
  type PendingPieceRow,
} from "@/lib/dashboardStats";
import {
  formatCost,
  getCostLogServerSnapshot,
  getCostLogSnapshot,
  subscribeCostLog,
} from "@/lib/costLog";
import { factVerificationQueue } from "@/lib/factQueue";
import {
  getProductionsServerSnapshot,
  getProductionsSnapshot,
  subscribeProductions,
} from "@/lib/produced";
import { fieldClass, labelClass } from "@/lib/ui";

const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/**
 * Porta de entrada: a situação deste navegador.
 *
 * Substitui o redirect para a bancada. A bancada continua em /esteira — aqui
 * responde o que falta enviar, o que a API cobrou e o que precisa de decisão,
 * com o dado que já existe em localStorage + a fila do CRM.
 */
export default function SituacaoPage() {
  const [brandId] = useFront();
  const productions = useSyncExternalStore(
    subscribeProductions,
    getProductionsSnapshot,
    getProductionsServerSnapshot,
  );
  const costEntries = useSyncExternalStore(
    subscribeCostLog,
    getCostLogSnapshot,
    getCostLogServerSnapshot,
  );

  const [pending, setPending] = useState<PendingPieceRow[]>([]);
  const [crmConfigured, setCrmConfigured] = useState(false);
  const [reference, setReference] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const loadPending = useCallback(() => {
    void fetch(`/api/publish?brandId=${brandId}`)
      .then((response) => response.json())
      .then((data) => {
        setCrmConfigured(data.configured === true);
        setPending(Array.isArray(data.pending) ? data.pending : []);
      })
      .catch(() => {
        setCrmConfigured(false);
        setPending([]);
      });
  }, [brandId]);

  useEffect(() => {
    const timer = setTimeout(loadPending, 0);
    return () => clearTimeout(timer);
  }, [loadPending]);

  const stats = useMemo(
    () =>
      buildDashboardStats({
        productions,
        costEntries,
        brandId,
        pending,
        reference,
      }),
    [productions, costEntries, brandId, pending, reference],
  );

  const facts = useMemo(() => factVerificationQueue(brandId), [brandId]);
  const monthOptions = useMemo(() => {
    const listed = monthsWithCost(costEntries);
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${now.getMonth()}`;
    if (!listed.some((item) => `${item.year}-${item.month}` === currentKey)) {
      return [
        {
          year: now.getFullYear(),
          month: now.getMonth(),
          label: `${MONTHS[now.getMonth()]}/${now.getFullYear()}`,
        },
        ...listed,
      ];
    }
    return listed;
  }, [costEntries]);

  const monthLabel = `${MONTHS[reference.getMonth()]}/${reference.getFullYear()}`;
  const cost = formatCost(stats.month.usd);
  const frente = brandLabel(brandId);

  return (
    <EsteiraShell>
      <div className="h-full overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-6 py-6 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className={labelClass}>Situação</span>
              <h1 className="text-2xl font-semibold tracking-tight text-ink">
                Situação · {frente}
              </h1>
              <p className="text-[13px] text-mut">
                O que falta enviar, o que a API cobrou e o que precisa de decisão · {monthLabel}
              </p>
            </div>

            <label className="flex flex-col gap-1">
              <span className={labelClass}>Mês</span>
              <select
                className={`${fieldClass} w-auto min-w-[10rem]`}
                value={`${reference.getFullYear()}-${reference.getMonth()}`}
                onChange={(event) => {
                  const [year, month] = event.target.value.split("-").map(Number);
                  setReference(new Date(year, month, 1));
                }}
              >
                {monthOptions.map((option) => (
                  <option key={`${option.year}-${option.month}`} value={`${option.year}-${option.month}`}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Na fila do CRM"
              value={crmConfigured ? String(stats.pendingCount) : "—"}
              subtitle={
                crmConfigured
                  ? "esperando aprovação"
                  : "CRM não configurado nesta instalação"
              }
              urgent={crmConfigured && stats.pendingCount > 0}
              icon={<Inbox size={16} className={crmConfigured && stats.pendingCount > 0 ? "text-acc-ink" : "text-faint"} />}
            />
            <KpiCard
              title="Não enviados"
              value={String(stats.unsent.length)}
              subtitle="pagos, ainda na bancada"
            />
            <KpiCard
              title="Sem fonte"
              value={String(stats.flagged.length)}
              subtitle={
                stats.flaggedClaimCount > 0
                  ? `afirmações marcadas · n=${stats.flaggedClaimCount}`
                  : "nenhuma afirmação marcada"
              }
            />
            <KpiCard
              title="Custo do mês"
              value={cost.primary}
              subtitle={
                stats.month.count === 0
                  ? "nenhuma geração neste mês"
                  : `${stats.month.count} ${stats.month.count === 1 ? "geração" : "gerações"}${
                      stats.month.averagePostUsd > 0
                        ? ` · média ${formatCost(stats.month.averagePostUsd).primary}/post`
                        : ""
                    }`
              }
            />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CostByKindChart data={stats.byKind} />
            <DailySpendChart data={stats.daily} />
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <UnsentList items={stats.unsent} />
            <MonthCostPanel month={stats.month} failedCount={stats.failedCount} />
            <PendingOrFactsPanel
              crmConfigured={crmConfigured}
              pending={pending}
              facts={facts}
            />
          </section>
        </div>
      </div>
    </EsteiraShell>
  );
}

"use client";

import clsx from "clsx";
import { useMemo } from "react";

import { EsteiraShell, ShellPage, useFront } from "@/components/app/EsteiraShell";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { factVerificationQueue } from "@/lib/factQueue";
import { TIER_LABEL, getNormativeFacts, isExpired, isPublishable } from "@/knowledge/provenance";
import type { SourceTier } from "@/knowledge/provenance";
import { focusRing, labelClass, panelClass } from "@/lib/ui";

/**
 * A base de fatos — fila de risco no topo, todos os fatos abaixo.
 * Densidade Situação (KPIs + listas em 1440px).
 */

const TIER_STYLE: Record<SourceTier, string> = {
  primaria: "border-ok-line bg-ok-bg text-ok",
  secundaria: "border-line bg-canvas text-mut",
  interna: "border-line bg-canvas text-mut",
  "nao-verificado": "border-warn-line bg-warn-bg text-warn",
};

export default function FatosPage() {
  const [front] = useFront();
  const facts = useMemo(() => getNormativeFacts(front), [front]);
  const queue = useMemo(() => factVerificationQueue(front), [front]);
  const publishable = facts.filter((fact) => isPublishable(fact));
  const expired = facts.filter((fact) => isExpired(fact)).length;
  const hardInQueue = queue.filter((fact) => fact.hasHardData).length;
  const brandLabel = front === "resibag" ? "Resibag" : "Sanwey";

  return (
    <EsteiraShell>
      <ShellPage>
        <div className="flex flex-col gap-0.5">
          <span className={labelClass}>Base de fatos</span>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            O que a ferramenta pode afirmar
          </h1>
          <p className="text-[13px] text-mut">
            Só fonte primária vira número numa peça · {brandLabel}
          </p>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Publicáveis"
            value={String(publishable.length)}
            subtitle={`de ${facts.length} · n=${facts.length}`}
          />
          <KpiCard
            title="Fila de risco"
            value={String(queue.length)}
            subtitle="para conferir"
            urgent={queue.length > 0}
          />
          <KpiCard
            title="Vencidos"
            value={String(expired)}
            subtitle="revalidar já"
          />
          <KpiCard
            title="Dado duro"
            value={String(hardInQueue)}
            subtitle="na fila"
          />
        </section>

        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-warn" aria-hidden />
            <span className={labelClass}>Para conferir, em ordem de risco · n={queue.length}</span>
          </span>

          {queue.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-3.5 py-3 text-[12.5px] text-mut">
              Nada pendente nesta frente.
            </p>
          ) : (
            queue.map((fact) => (
              <div
                key={fact.id}
                className={clsx(panelClass, "flex flex-col gap-2 px-4 py-3.5")}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-ink">
                    {fact.claim}
                  </p>
                  <span
                    className={clsx(
                      "shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wide",
                      fact.status === "vencido"
                        ? "border-danger-line bg-danger-bg text-danger"
                        : TIER_STYLE[fact.tier],
                    )}
                  >
                    {fact.statusLabel}
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 font-mono text-[10px] text-faint">
                  <span>{fact.id}</span>
                  {fact.hasHardData ? <span className="text-warn">dado duro</span> : null}
                  <span>{fact.source}</span>
                  {fact.url ? (
                    <a
                      href={fact.url}
                      target="_blank"
                      rel="noreferrer"
                      className={clsx("underline underline-offset-2 hover:text-ink2", focusRing)}
                    >
                      conferir fonte
                    </a>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-ok" aria-hidden />
            <span className={labelClass}>Todos os fatos · n={facts.length}</span>
          </span>

          {facts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-3.5 py-3 text-[12.5px] text-mut">
              Nenhum fato catalogado para esta frente.
            </p>
          ) : (
            facts.map((fact) => (
              <div
                key={fact.id}
                className={clsx(panelClass, "flex flex-col gap-2 px-4 py-3.5")}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-ink">
                    {fact.claim}
                  </p>
                  <span
                    className={clsx(
                      "shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wide",
                      TIER_STYLE[fact.tier],
                    )}
                  >
                    {TIER_LABEL[fact.tier]}
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 font-mono text-[10px] text-faint">
                  <span>{fact.source}</span>
                  {fact.checkedAt ? <span>conferido {fact.checkedAt}</span> : null}
                  {fact.revalidateBy ? <span>revalidar até {fact.revalidateBy}</span> : null}
                  {fact.url ? (
                    <a
                      href={fact.url}
                      target="_blank"
                      rel="noreferrer"
                      className={clsx("underline underline-offset-2 hover:text-ink2", focusRing)}
                    >
                      fonte
                    </a>
                  ) : null}
                </div>

                {fact.notes ? (
                  <p className="text-[11.5px] leading-snug text-mut">{fact.notes}</p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </ShellPage>
    </EsteiraShell>
  );
}

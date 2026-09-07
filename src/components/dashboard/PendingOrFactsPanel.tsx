"use client";

import Link from "next/link";

import type { PendingPieceRow } from "@/lib/dashboardStats";
import type { FactQueueItem } from "@/lib/factQueue";
import { focusRing, labelClass, metaClass, panelClass } from "@/lib/ui";

type PendingOrFactsPanelProps = {
  crmConfigured: boolean;
  pending: PendingPieceRow[];
  facts: FactQueueItem[];
};

export function PendingOrFactsPanel({
  crmConfigured,
  pending,
  facts,
}: PendingOrFactsPanelProps) {
  return (
    <div className={`${panelClass} flex flex-col gap-2 px-4 py-3.5`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-warn" aria-hidden />
          <span className={labelClass}>Fila do CRM · fatos</span>
        </span>
        <Link href="/esteira/fatos" className={`${focusRing} text-[11px] text-acc-tx underline-offset-2 hover:underline`}>
          Base de fatos
        </Link>
      </div>

      {!crmConfigured ? (
        <p className="rounded-lg border border-dashed border-line px-3 py-2 text-[12px] text-mut">
          CRM não configurado nesta instalação — a fila de aprovação não aparece.
        </p>
      ) : pending.length === 0 ? (
        <p className="text-[12.5px] text-mut">Nada esperando aprovação no CRM.</p>
      ) : (
        <ul className="flex flex-col">
          {pending.slice(0, 3).map((item) => (
            <li
              key={item.id}
              className="flex items-baseline justify-between gap-2 border-b border-line2 py-2 last:border-b-0"
            >
              <span className="min-w-0 truncate text-[13px] text-ink">{item.title}</span>
              <span className={metaClass}>
                {item.priority === "high" ? "alta" : "normal"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-1 border-t border-line2 pt-2">
        <span className={labelClass}>Fatos a conferir</span>
        {facts.length === 0 ? (
          <p className="mt-2 text-[12.5px] text-mut">Nada pendente nesta frente.</p>
        ) : (
          <ul className="mt-1 flex flex-col">
            {facts.slice(0, 3).map((fact) => (
              <li
                key={fact.id}
                className="flex flex-col gap-0.5 border-b border-line2 py-2 last:border-b-0"
              >
                <span className="truncate text-[12.5px] text-ink">{fact.claim}</span>
                <span className={metaClass}>
                  {fact.statusLabel}
                  {fact.hasHardData ? " · dado duro" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

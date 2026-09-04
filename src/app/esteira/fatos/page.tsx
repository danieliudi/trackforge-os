"use client";

import clsx from "clsx";
import { useMemo } from "react";

import { EsteiraShell, ShellPage, useFront } from "@/components/app/EsteiraShell";
import { factVerificationQueue } from "@/lib/factQueue";
import { TIER_LABEL, getNormativeFacts, isPublishable } from "@/knowledge/provenance";
import type { SourceTier } from "@/knowledge/provenance";
import { focusRing, labelClass, panelClass } from "@/lib/ui";

/**
 * A base de fatos, do jeito que o gerador a enxerga — e a fila do que falta
 * conferir, na mesma ordem de risco do `knowledge:audit`.
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

  return (
    <EsteiraShell>
      <ShellPage>
        <div className="flex flex-col gap-0.5">
          <span className={labelClass}>Base de fatos</span>
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            O que a ferramenta pode afirmar
          </h1>
        </div>

        <div className={clsx(panelClass, "flex flex-col gap-1.5 px-4 py-3.5")}>
          <p className="text-[13px] leading-relaxed text-ink2">
            <strong className="font-semibold text-ink">
              {publishable.length} de {facts.length}
            </strong>{" "}
            fatos podem virar número, data ou citação de norma numa peça
            <span className="text-mut"> · n={facts.length}</span>.
          </p>
          <p className="text-[12px] leading-relaxed text-mut">
            Os outros entram como contexto, mas o gerador não escreve o dado a partir
            deles — e o auditor marca como “sem fonte” se ele aparecer mesmo assim.
            Conferir um fato contra a fonte original é o que o move para cá.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className={labelClass}>
            Para conferir, em ordem de risco · n={queue.length}
          </span>

          {queue.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-3.5 py-3 text-[12.5px] text-mut">
              Nada pendente nesta frente.
            </p>
          ) : (
            queue.map((fact) => (
              <div
                key={fact.id}
                className={clsx(panelClass, "flex flex-col gap-2 px-3.5 py-3")}
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

        <div className="mt-2 flex flex-col gap-2">
          <span className={labelClass}>Todos os fatos</span>

          {facts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-3.5 py-3 text-[12.5px] text-mut">
              Nenhum fato catalogado para esta frente.
            </p>
          ) : (
            facts.map((fact) => (
              <div
                key={fact.id}
                className={clsx(panelClass, "flex flex-col gap-2 px-3.5 py-3")}
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

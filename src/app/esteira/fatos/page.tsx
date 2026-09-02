"use client";

import clsx from "clsx";
import { useMemo } from "react";

import { EsteiraShell, useFront } from "@/components/app/EsteiraShell";
import { TIER_LABEL, getNormativeFacts, isPublishable } from "@/knowledge/provenance";
import type { SourceTier } from "@/knowledge/provenance";
import { focusRing, labelClass, panelClass } from "@/lib/ui";

/**
 * A base de fatos, do jeito que o gerador a enxerga.
 *
 * Existe porque a regra mais importante da ferramenta é invisível: só fato de
 * fonte primária pode virar número, data ou citação de norma numa peça. Quando
 * o gerador se recusa a escrever um dado, é aqui que está a explicação — e é
 * daqui que sai a fila do que precisa ser conferido.
 *
 * Só leitura. Editar fato é decisão editorial que acontece no arquivo curado,
 * com revisão, não num formulário.
 */

const TIER_STYLE: Record<SourceTier, string> = {
  primaria: "border-emerald-300 bg-emerald-50 text-emerald-800",
  secundaria: "border-zinc-300 bg-zinc-50 text-zinc-600",
  interna: "border-zinc-300 bg-zinc-50 text-zinc-600",
  "nao-verificado": "border-amber-300 bg-amber-50 text-amber-800",
};

export default function FatosPage() {
  const [front] = useFront();
  const facts = useMemo(() => getNormativeFacts(front), [front]);

  const publishable = facts.filter((fact) => isPublishable(fact));

  return (
    <EsteiraShell>
      <div className="flex flex-col gap-0.5">
        <span className={labelClass}>Base de fatos</span>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          O que a ferramenta pode afirmar
        </h1>
      </div>

      <div className={clsx(panelClass, "flex flex-col gap-1.5 px-4 py-3.5")}>
        <p className="text-[13px] leading-relaxed text-zinc-700">
          <strong className="font-semibold text-zinc-900">
            {publishable.length} de {facts.length}
          </strong>{" "}
          fatos podem virar número, data ou citação de norma numa peça.
        </p>
        <p className="text-[12px] leading-relaxed text-zinc-500">
          Os outros entram como contexto, mas o gerador não escreve o dado a partir
          deles — e o auditor marca como “sem fonte” se ele aparecer mesmo assim.
          Conferir um fato contra a fonte original é o que o move para cá.
        </p>
      </div>

      {facts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 px-3.5 py-3 text-[12.5px] text-zinc-500">
          Nenhum fato catalogado para esta frente.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {facts.map((fact) => (
            <div
              key={fact.id}
              className={clsx(panelClass, "flex flex-col gap-2 px-3.5 py-3")}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-zinc-800">
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

              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 font-mono text-[10px] text-zinc-400">
                <span>{fact.source}</span>
                {fact.checkedAt ? <span>conferido {fact.checkedAt}</span> : null}
                {fact.revalidateBy ? <span>revalidar até {fact.revalidateBy}</span> : null}
                {fact.url ? (
                  <a
                    href={fact.url}
                    target="_blank"
                    rel="noreferrer"
                    className={clsx("underline underline-offset-2 hover:text-zinc-700", focusRing)}
                  >
                    fonte
                  </a>
                ) : null}
              </div>

              {fact.notes ? (
                <p className="text-[11.5px] leading-snug text-zinc-500">{fact.notes}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </EsteiraShell>
  );
}

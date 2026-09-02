"use client";

import clsx from "clsx";

/**
 * A trilha de passos do topo.
 *
 * Vive fora da página porque agora há dois fluxos com passos — a peça completa
 * e a avulsa — e eles têm etapas diferentes. Duplicar o desenho faria as duas
 * trilhas divergirem no primeiro ajuste de espaçamento, que é exatamente o tipo
 * de diferença que ninguém nota e todo mundo estranha.
 */

export type Step = { n: number; label: string };

export function Steps({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {steps.map(({ n, label }, index) => (
        <li key={n} className="flex items-center gap-2">
          {index > 0 ? <span className="h-px w-4 bg-line" aria-hidden /> : null}
          <span
            className={clsx(
              "flex items-center gap-1.5 text-[11.5px]",
              n === current ? "font-semibold text-ink" : "text-faint",
            )}
            aria-current={n === current ? "step" : undefined}
          >
            <span
              className={clsx(
                "grid h-[19px] w-[19px] place-items-center rounded-full border font-mono text-[10px]",
                n < current
                  ? "border-ok-line bg-ok-bg text-ok"
                  : n === current
                    ? "border-acc bg-acc text-acc-ink"
                    : "border-line text-faint",
              )}
            >
              {n < current ? "✓" : n}
            </span>
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

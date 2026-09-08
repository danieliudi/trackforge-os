"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

import { labelClass, labelShapeClass, panelClass } from "@/lib/ui";

type KpiCardProps = {
  title: string;
  value: string;
  subtitle: string;
  /** Destaque de atenção (fila com itens) — usa acc preenchido, letra ink. */
  urgent?: boolean;
  icon?: ReactNode;
};

export function KpiCard({ title, value, subtitle, urgent = false, icon }: KpiCardProps) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-1 px-4 py-3.5",
        /**
         * NÃO escreva `clsx(panelClass, urgent && "bg-acc")`.
         *
         * As duas utilidades de fundo acabam na mesma lista de classes, e quem
         * vence é a ordem do CSS GERADO, não a ordem da string: o Tailwind emite
         * `bg-acc` antes de `bg-surface`, então `bg-surface` ganhava sempre. O
         * cartão urgente nunca foi laranja em nenhum tema.
         *
         * No claro o defeito era invisível — quase-preto sobre branco continua
         * legível. No escuro virava `#1c1c1b` sobre `#201f1d`: 1,04:1, o número
         * mais importante da tela apagado. Mesma família do `.stage{display:flex}`
         * vencendo o `hidden`: passa por typecheck, por lint, e só aparece
         * quando alguém mede a tela pintada.
         *
         * Por isso o fundo é escolhido UMA vez, aqui. O caminho normal continua
         * no `panelClass` compartilhado; a variante escreve a casca inteira.
         */
        urgent ? "rounded-lg border border-acc bg-acc" : panelClass,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Mesma armadilha do fundo: `clsx(labelClass, "text-acc-ink/70")`
            deixa `text-mut` e `text-acc-ink/70` na mesma lista, e `text-mut`
            ganha. A cor é escolhida uma vez. */}
        <span className={clsx(urgent ? `${labelShapeClass} text-acc-ink/70` : labelClass)}>
          {title}
        </span>
        {icon}
      </div>
      <span
        className={clsx(
          "text-[28px] font-bold leading-none tracking-tight tabular-nums",
          urgent ? "text-acc-ink" : "text-ink",
        )}
      >
        {value}
      </span>
      <span className={clsx("text-xs", urgent ? "text-acc-ink/75" : "text-mut")}>{subtitle}</span>
    </div>
  );
}

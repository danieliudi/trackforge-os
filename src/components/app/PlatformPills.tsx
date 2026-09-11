"use client";

import clsx from "clsx";

import { platformOptions, type Platform } from "@/constants/format";
import { focusRing } from "@/lib/ui";

type PlatformPillsProps = {
  value: Platform;
  onChange: (platform: Platform) => void;
  /** Apresentação é sempre 16:9 — a escolha de plataforma não muda o canvas. */
  disabled?: boolean;
};

// Marcado é INVERTIDO, não preenchido de laranja. Cor escolhida uma vez com
// ternário: somar `bg-` a um token que já carrega fundo deixa duas utilidades
// da mesma propriedade na lista, e vence a ordem do CSS gerado (seção 1).
const cela = (isActive: boolean, disabled: boolean) =>
  clsx(
    "px-3.5 py-2 text-[12.5px] transition",
    focusRing,
    disabled
      ? "cursor-not-allowed bg-cell text-faint"
      : isActive
        ? "bg-ink font-medium text-paper"
        : "bg-cell text-ink2 hover:text-ink",
  );

export function PlatformPills({ value, onChange, disabled = false }: PlatformPillsProps) {
  return (
    <div className="flex w-fit flex-wrap gap-px border border-rule bg-rule">
      {platformOptions.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          disabled={disabled}
          onClick={() => onChange(id)}
          aria-pressed={value === id}
          className={cela(value === id, disabled)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

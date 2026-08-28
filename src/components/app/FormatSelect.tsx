"use client";

import clsx from "clsx";

import { formatOptions, type Format } from "@/constants/format";
import { focusRing } from "@/lib/ui";

type FormatSelectProps = {
  value: Format;
  onChange: (format: Format) => void;
};

/** Segmentado igual às abas Conteúdo/Estilo/Contexto — Formato é modo, não filtro. */
export function FormatSelect({ value, onChange }: FormatSelectProps) {
  return (
    <div className="flex gap-0.5 rounded-lg bg-zinc-100 p-1">
      {formatOptions.map(({ id, label }) => {
        const isActive = id === value;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={isActive}
            className={clsx(
              "rounded-md px-3 py-1.5 text-xs font-medium transition",
              focusRing,
              isActive ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

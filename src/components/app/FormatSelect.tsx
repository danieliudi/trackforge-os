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
    <div className="flex border-b border-rule">
      {formatOptions.map(({ id, label }) => {
        const isActive = id === value;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={isActive}
            className={clsx(
              "border-b-2 px-3 pb-2 pt-1.5 text-[12.5px] transition",
              focusRing,
              isActive
                ? "border-acc font-semibold text-ink"
                : "border-transparent text-mut hover:text-ink",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

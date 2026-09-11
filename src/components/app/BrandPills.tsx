"use client";

import clsx from "clsx";

import { brandOptions, type BrandId } from "@/constants/brands";
import { focusRing } from "@/lib/ui";

type BrandPillsProps = {
  value: BrandId | null;
  onChange: (id: BrandId | null) => void;
};

// Mesma célula da PlatformPills: marcado é invertido.
const cela = (isActive: boolean) =>
  clsx(
    "px-3.5 py-2 text-[12.5px] transition",
    focusRing,
    isActive ? "bg-ink font-medium text-paper" : "bg-cell text-ink2 hover:text-ink",
  );

/** Escolher a marca também troca o tema, então o controle vale já na entrada. */
export function BrandPills({ value, onChange }: BrandPillsProps) {
  return (
    <div className="flex w-fit flex-wrap gap-px border border-rule bg-rule">
      <button
        type="button"
        onClick={() => onChange(null)}
        aria-pressed={value === null}
        className={cela(value === null)}
      >
        Nenhuma
      </button>
      {brandOptions.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-pressed={value === id}
          className={cela(value === id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

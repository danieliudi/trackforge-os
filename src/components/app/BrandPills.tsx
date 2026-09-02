"use client";

import clsx from "clsx";

import { brandOptions, type BrandId } from "@/constants/brands";
import { focusRing } from "@/lib/ui";

type BrandPillsProps = {
  value: BrandId | null;
  onChange: (id: BrandId | null) => void;
};

const pill = (isActive: boolean) =>
  clsx(
    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
    focusRing,
    isActive
      ? "border-acc bg-acc text-acc-ink"
      : "border-line bg-surface text-ink2 hover:border-line3",
  );

/** Escolher a marca também troca o tema, então o controle vale já na entrada. */
export function BrandPills({ value, onChange }: BrandPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange(null)}
        aria-pressed={value === null}
        className={pill(value === null)}
      >
        Nenhuma
      </button>
      {brandOptions.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-pressed={value === id}
          className={pill(value === id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

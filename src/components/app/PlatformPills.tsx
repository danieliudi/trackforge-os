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

const pill = (isActive: boolean, disabled: boolean) =>
  clsx(
    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
    focusRing,
    disabled
      ? "cursor-not-allowed border-zinc-200 bg-white text-zinc-400"
      : isActive
        ? "border-zinc-900 bg-zinc-900 text-white"
        : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500",
  );

export function PlatformPills({ value, onChange, disabled = false }: PlatformPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {platformOptions.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          disabled={disabled}
          onClick={() => onChange(id)}
          aria-pressed={value === id}
          className={pill(value === id, disabled)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

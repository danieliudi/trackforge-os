"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

import { labelClass, panelClass } from "@/lib/ui";

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
        panelClass,
        "flex flex-col gap-1 px-4 py-3.5",
        urgent && "border-acc bg-acc",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={clsx(labelClass, urgent && "text-acc-ink/70")}>{title}</span>
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

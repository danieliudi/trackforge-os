"use client";

import { formatCost } from "@/lib/costLog";
import { panelClass } from "@/lib/ui";

type ChartTooltipProps = {
  active?: boolean;
  label?: string;
  /** Valor principal já formatado. */
  primary?: string;
  secondary?: string | null;
};

/** Tooltip escuro do gráfico — usa ink/canvas, nunca hex. */
export function ChartTooltip({ active, label, primary, secondary }: ChartTooltipProps) {
  if (!active || !primary) return null;

  return (
    <div className={clsxTooltip}>
      {label ? <div className="text-[10px] uppercase tracking-wide text-faint">{label}</div> : null}
      <div className="font-mono text-[12px] tabular-nums text-ink">{primary}</div>
      {secondary ? <div className="text-[11px] text-mut">{secondary}</div> : null}
    </div>
  );
}

const clsxTooltip = `${panelClass} border-line px-2.5 py-1.5 shadow-md`;

export function costTooltipPayload(usd: number, count?: number) {
  const cost = formatCost(usd);
  return {
    primary: cost.primary,
    secondary:
      count !== undefined
        ? `${count} ${count === 1 ? "geração" : "gerações"}${cost.secondary ? ` · ${cost.secondary}` : ""}`
        : cost.secondary,
  };
}

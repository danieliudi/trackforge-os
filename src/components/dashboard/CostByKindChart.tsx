"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltip, costTooltipPayload } from "@/components/dashboard/ChartTooltip";
import { formatCost } from "@/lib/costLog";
import type { KindBarPoint } from "@/lib/dashboardStats";
import { labelClass, panelClass } from "@/lib/ui";

type CostByKindChartProps = {
  data: KindBarPoint[];
};

export function CostByKindChart({ data }: CostByKindChartProps) {
  return (
    <div className={`${panelClass} flex flex-col gap-3 px-4 py-3.5`}>
      <div className="flex flex-col gap-0.5">
        <span className={labelClass}>Gasto por tipo</span>
        <p className="text-[12.5px] text-mut">O que a API cobrou neste mês, por tipo de geração</p>
      </div>

      {data.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-3 py-8 text-center text-[12.5px] text-mut">
          Sem gerações neste mês.
        </p>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-line2)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--color-faint)", fontSize: 11 }}
                axisLine={{ stroke: "var(--color-line)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--color-faint)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => formatCost(value).primary.replace(/\s/g, "")}
                width={64}
              />
              <Tooltip
                cursor={{ fill: "var(--color-surface2)" }}
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload as KindBarPoint | undefined;
                  if (!row) return null;
                  const tip = costTooltipPayload(row.usd, row.count);
                  return (
                    <ChartTooltip
                      active={active}
                      label={row.label}
                      primary={tip.primary}
                      secondary={tip.secondary}
                    />
                  );
                }}
              />
              <Bar
                dataKey="usd"
                fill="var(--color-acc)"
                radius={[6, 6, 0, 0]}
                activeBar={{ fill: "var(--color-acc-hi)" }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

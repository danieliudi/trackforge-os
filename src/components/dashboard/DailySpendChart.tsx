"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltip, costTooltipPayload } from "@/components/dashboard/ChartTooltip";
import { formatCost } from "@/lib/costLog";
import type { DailySpendPoint } from "@/lib/dashboardStats";
import { labelClass, panelClass } from "@/lib/ui";

type DailySpendChartProps = {
  data: DailySpendPoint[];
};

export function DailySpendChart({ data }: DailySpendChartProps) {
  const hasSpend = data.some((point) => point.usd > 0);

  return (
    <div className={`${panelClass} flex flex-col gap-3 px-4 py-3.5`}>
      <div className="flex flex-col gap-0.5">
        <span className={labelClass}>Gerações no mês</span>
        <p className="text-[12.5px] text-mut">Gasto diário acumulado neste navegador</p>
      </div>

      {!hasSpend ? (
        <p className="rounded-lg border border-dashed border-line px-3 py-8 text-center text-[12.5px] text-mut">
          Sem gerações neste mês.
        </p>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-acc)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="var(--color-acc)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-line2)" horizontal vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--color-faint)", fontSize: 11 }}
                axisLine={{ stroke: "var(--color-line)" }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "var(--color-faint)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => formatCost(value).primary.replace(/\s/g, "")}
                width={64}
              />
              <Tooltip
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload as DailySpendPoint | undefined;
                  if (!row || row.count === 0) return null;
                  const tip = costTooltipPayload(row.usd, row.count);
                  return (
                    <ChartTooltip
                      active={active}
                      label={`dia ${row.label}`}
                      primary={tip.primary}
                      secondary={tip.secondary}
                    />
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="usd"
                stroke="var(--color-acc)"
                strokeWidth={2.5}
                fill="url(#spendFill)"
                activeDot={{ r: 4, fill: "var(--color-acc)", stroke: "var(--color-surface)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

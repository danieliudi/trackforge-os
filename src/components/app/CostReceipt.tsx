"use client";

import { AlertTriangle } from "lucide-react";

import { WEB_SEARCH_PRICE, type GenerationCost } from "@/constants/pricing";
import { formatCost, formatUsd } from "@/lib/costLog";
import { labelClass } from "@/lib/ui";

type CostReceiptProps = {
  cost: GenerationCost;
  /** Contexto curto do que foi gerado: "Carrossel LinkedIn · 8 slides". */
  summary: string;
};

const tokens = (value: number) => value.toLocaleString("pt-BR");

/**
 * Recibo da última geração.
 *
 * Quebra por etapa em vez de mostrar só o total, porque a etapa cara raramente é
 * a que o usuário imagina: a redação do carrossel custa centavos de token, e as
 * buscas de notícia são cobradas por unidade e passam fácil o resto somado.
 */
export function CostReceipt({ cost, summary }: CostReceiptProps) {
  const { primary, secondary } = formatCost(cost.usd);
  const searches = cost.steps.reduce((total, step) => total + step.webSearches, 0);
  const searchUsd = searches * WEB_SEARCH_PRICE;
  const searchShare = cost.usd > 0 ? Math.round((searchUsd / cost.usd) * 100) : 0;

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-3.5 py-3">
        <div className="flex items-baseline gap-2.5">
          <span className={labelClass}>Custo</span>
          <span className="text-lg font-semibold tabular-nums tracking-tight text-emerald-700">
            {primary}
          </span>
          {secondary ? (
            <span className="font-mono text-[11px] tabular-nums text-zinc-500">
              {secondary}
            </span>
          ) : null}
        </div>
        <span className="text-[11px] text-zinc-500">{summary}</span>
      </div>

      <dl className="border-t border-zinc-100 bg-zinc-50 px-3.5 py-1.5">
        {cost.steps.map((step) => (
          <div
            key={step.label}
            className="flex items-baseline justify-between gap-3 border-b border-zinc-100 py-1.5 last:border-b-0"
          >
            <dt
              className={
                step.webSearches > 0
                  ? "text-[11.5px] text-amber-700"
                  : "text-[11.5px] text-zinc-600"
              }
            >
              {step.label}
            </dt>
            <div className="flex shrink-0 items-baseline gap-3">
              <span className="font-mono text-[10.5px] tabular-nums text-zinc-400">
                {step.webSearches > 0
                  ? `${formatUsd(WEB_SEARCH_PRICE)} cada`
                  : `${tokens(step.usage.inputTokens)} ent · ${tokens(step.usage.outputTokens)} saí`}
              </span>
              <span
                className={
                  step.webSearches > 0
                    ? "w-[74px] text-right font-mono text-[10.5px] tabular-nums text-amber-700"
                    : "w-[74px] text-right font-mono text-[10.5px] tabular-nums text-zinc-600"
                }
              >
                {formatUsd(step.usd)}
              </span>
            </div>
          </div>
        ))}
      </dl>

      {searchShare >= 40 ? (
        <div className="flex items-start gap-2 border-t border-amber-100 bg-amber-50 px-3.5 py-2.5 text-[11.5px] leading-relaxed text-amber-900">
          <AlertTriangle size={13} className="mt-px shrink-0" />
          <span>
            As buscas de notícia responderam por {searchShare}% deste custo. Sem
            elas o mesmo documento sairia por{" "}
            <strong className="font-semibold">
              {formatCost(cost.usd - searchUsd).primary}
            </strong>
            .
          </span>
        </div>
      ) : null}
    </div>
  );
}

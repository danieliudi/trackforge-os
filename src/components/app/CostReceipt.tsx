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
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-3.5 py-3">
        <div className="flex items-baseline gap-2.5">
          <span className={labelClass}>Custo</span>
          <span className="text-lg font-semibold tabular-nums tracking-tight text-ok">
            {primary}
          </span>
          {secondary ? (
            <span className="font-mono text-[11px] tabular-nums text-mut">
              {secondary}
            </span>
          ) : null}
        </div>
        <span className="text-[11px] text-mut">{summary}</span>
      </div>

      <dl className="border-t border-line2 bg-canvas px-3.5 py-1.5">
        {cost.steps.map((step) => {
          // Etapa sem custo é o sinal curado do CRM. "US$ 0,0000" tecnicamente
          // certo esconde justamente o que interessa: essa parte não custou nada.
          const free = step.usd === 0;
          const tone = free
            ? "text-ok"
            : step.webSearches > 0
              ? "text-warn"
              : "text-mut";

          return (
            <div
              key={step.label}
              className="flex items-baseline justify-between gap-3 border-b border-line2 py-1.5 last:border-b-0"
            >
              <dt className={`text-[11.5px] ${tone}`}>{step.label}</dt>
              <div className="flex shrink-0 items-baseline gap-3">
                <span className="font-mono text-[10.5px] tabular-nums text-faint">
                  {step.webSearches > 0
                    ? `${formatUsd(WEB_SEARCH_PRICE)} cada`
                    : free
                      ? "consulta ao CRM"
                      : `${tokens(step.usage.inputTokens)} ent · ${tokens(step.usage.outputTokens)} saí`}
                </span>
                <span
                  className={`w-[74px] text-right font-mono text-[10.5px] tabular-nums ${tone}`}
                >
                  {free ? "grátis" : formatUsd(step.usd)}
                </span>
              </div>
            </div>
          );
        })}
      </dl>

      {searchShare >= 40 ? (
        <div className="flex items-start gap-2 border-t border-warn-line bg-warn-bg px-3.5 py-2.5 text-[11.5px] leading-relaxed text-warn">
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

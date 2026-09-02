"use client";

import clsx from "clsx";
import { Loader2, RotateCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { IconButton } from "@/components/ui/Button";
import type { BrandId } from "@/constants/brands";
import type { MarketSignal } from "@/lib/marketSignals";
import { focusRing, labelClass } from "@/lib/ui";

type SignalPickerProps = {
  brandId: BrandId | null;
  /** Ids marcados. Vazio e `enabled` ligado = usar todos os recentes. */
  selected: string[] | null;
  onChange: (ids: string[]) => void;
};

const URGENCY_STYLE: Record<string, string> = {
  alto: "border-warn-line bg-warn-bg text-warn",
  medio: "border-line bg-canvas text-mut",
  info: "border-line2 bg-canvas text-faint",
};

const formatDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "";

/**
 * Sinais de mercado curados no CRM, escolhidos antes de gerar.
 *
 * Some inteiro quando não há credencial ou não há sinal para a marca — uma
 * seção vazia dizendo "nada aqui" ocupa espaço e não ajuda ninguém.
 */
export function SignalPicker({ brandId, selected, onChange }: SignalPickerProps) {
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(true);

  const load = useCallback(async () => {
    if (!brandId) {
      setSignals([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/signals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brandId }),
      });
      const data = await response.json();
      setConfigured(data.configured !== false);
      const list = (data.signals ?? []) as MarketSignal[];
      setSignals(list);
      // Sem escolha anterior, tudo entra: o time já curou, marcar de novo à mão
      // seria repetir o trabalho.
      if (selected === null) onChange(list.map((signal) => signal.id));
    } catch {
      setSignals([]);
    } finally {
      setLoading(false);
    }
    // `selected` de fora causaria recarga a cada clique numa caixa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  // Agendado em vez de chamado direto: `load` começa com setLoading(true), e
  // setState síncrono dentro do efeito encadeia render. Mesmo padrão do
  // SuggestionsSection logo acima.
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (!configured || (!loading && signals.length === 0)) return null;

  const active = selected ?? [];

  const toggle = (id: string) =>
    onChange(active.includes(id) ? active.filter((current) => current !== id) : [...active, id]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className={labelClass}>
          Sinais de mercado{" "}
          <span className="font-mono text-[10px] normal-case tracking-normal text-ok">
            grátis
          </span>
        </span>
        <IconButton
          icon={loading ? Loader2 : RotateCw}
          label="Recarregar sinais"
          size="sm"
          loading={loading}
          onClick={() => void load()}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        {signals.map((signal) => {
          const on = active.includes(signal.id);
          return (
            <label
              key={signal.id}
              className={clsx(
                "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition",
                on
                  ? "border-acc bg-canvas"
                  : "border-line bg-surface hover:border-line",
              )}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggle(signal.id)}
                className={clsx("mt-0.5 h-3.5 w-3.5 rounded border-line text-ink", focusRing)}
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-xs leading-snug text-ink">{signal.title}</span>
                <span className="flex flex-wrap items-baseline gap-1.5 text-[10px] text-faint">
                  <span className="font-mono">{signal.source}</span>
                  <span aria-hidden>·</span>
                  <span>{formatDate(signal.detectedAt)}</span>
                </span>
              </span>
              <span
                className={clsx(
                  "shrink-0 rounded border px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wide",
                  URGENCY_STYLE[signal.urgency] ?? URGENCY_STYLE.info,
                )}
              >
                {signal.urgency}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import clsx from "clsx";
import { Check } from "lucide-react";

import {
  COMPOSITION_OPTIONS,
  type CompositionId,
} from "@/constants/compositions";
import { focusRing, labelClass } from "@/lib/ui";

type CompositionSelectProps = {
  value: CompositionId;
  onChange: (id: CompositionId) => void;
};

/**
 * Escolha de moldura tipográfica — eixo aparte do tema de cor.
 *
 * Tema troca tinta; composição troca âncora, escala e chrome. Sem os dois
 * eixos, "variar o carrossel" vira só outro verde.
 */
export function CompositionSelect({ value, onChange }: CompositionSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className={labelClass}>Composição</span>
      <div className="flex flex-col gap-2">
        {COMPOSITION_OPTIONS.map(({ id, label, blurb }) => {
          const isActive = id === value;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-pressed={isActive}
              className={clsx(
                "flex flex-col gap-1 rounded-lg border px-3 py-2.5 text-left transition",
                focusRing,
                isActive ? "border-acc bg-canvas" : "border-line hover:border-line3",
              )}
            >
              <span className="flex items-center gap-1.5">
                {isActive ? <Check size={12} className="shrink-0 text-ink" /> : null}
                <span
                  className={clsx(
                    "text-[12px] font-medium",
                    isActive ? "text-ink" : "text-ink2",
                  )}
                >
                  {label}
                </span>
              </span>
              <span className="text-[11px] leading-relaxed text-mut">{blurb}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] leading-relaxed text-mut">
        Destaque uma palavra na headline com *asteriscos* — ela sai na cor de acento.
      </p>
    </div>
  );
}

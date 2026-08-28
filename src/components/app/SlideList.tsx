"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef } from "react";

import { SlideFields } from "@/components/carousel/SlideFields";
import { canMoveDown, canMoveUp, removeBlockedReason } from "@/lib/slides";
import { focusRing, labelClass } from "@/lib/ui";
import type { Slide } from "@/types/carousel";

type SlideListProps = {
  slides: Slide[];
  activeIndex: number;
  onActivate: (index: number) => void;
  onChange: (index: number, patch: Partial<Slide>) => void;
  onDuplicate: (index: number) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onAdd: () => void;
  onRegenerate: (index: number, instruction?: string) => void;
  regeneratingIndex: number | null;
  /** Carrossel trava em 12; Apresentação (documento, não scroll) aceita mais. */
  maxSlides: number;
};

export function SlideList({
  slides,
  activeIndex,
  onActivate,
  onChange,
  onDuplicate,
  onRemove,
  onMove,
  onAdd,
  onRegenerate,
  regeneratingIndex,
  maxSlides,
}: SlideListProps) {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isFull = slides.length >= maxSlides;

  // Selecionar um slide pelo preview não trazia o card correspondente à vista.
  // `block: "nearest"` não mexe na rolagem quando o card já está visível, então
  // digitar num campo (que também dispara onActivate) não provoca salto.
  useEffect(() => {
    cardRefs.current[activeIndex]?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [activeIndex]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className={labelClass}>Slides</span>
        <span className="text-[11px] tabular-nums text-zinc-500">
          {slides.length} / {maxSlides}
        </span>
      </div>

      {slides.map((slide, index) => (
        <SlideFields
          key={index}
          slide={slide}
          isActive={index === activeIndex}
          cardRef={(node) => {
            cardRefs.current[index] = node;
          }}
          onChange={(patch) => onChange(index, patch)}
          onActivate={() => onActivate(index)}
          onDuplicate={() => onDuplicate(index)}
          onRemove={() => onRemove(index)}
          onMoveUp={() => onMove(index, -1)}
          onMoveDown={() => onMove(index, 1)}
          onRegenerate={(instruction) => onRegenerate(index, instruction)}
          isRegenerating={regeneratingIndex === index}
          canRemove={removeBlockedReason(index, slides.length) === undefined}
          removeBlockedReason={removeBlockedReason(index, slides.length)}
          canMoveUp={canMoveUp(index, slides.length)}
          canMoveDown={canMoveDown(index, slides.length)}
        />
      ))}

      <button
        type="button"
        onClick={onAdd}
        disabled={isFull}
        className={`flex items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 py-3 text-xs font-medium text-zinc-600 transition hover:border-zinc-900 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-zinc-300 disabled:hover:text-zinc-600 ${focusRing}`}
      >
        <Plus size={14} />
        {isFull ? `Máximo de ${maxSlides} slides` : "Adicionar slide"}
      </button>
    </div>
  );
}

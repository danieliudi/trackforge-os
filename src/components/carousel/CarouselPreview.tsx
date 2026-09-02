"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight, LayoutGrid, Square } from "lucide-react";
import { useState } from "react";

import { IconButton } from "@/components/ui/Button";
import type { Format, Platform } from "@/constants/format";
import { resolveCanvasSize, type SlideThemeId } from "@/constants/themes";
import { useElementSize } from "@/hooks/useElementSize";
import { focusRing } from "@/lib/ui";
import type { Slide } from "@/types/carousel";

import { CarouselSlide, type LogoConfig } from "./CarouselSlide";

/** Respiro entre o slide e a borda da área de preview, em px de tela. */
const SINGLE_INSET = 32;
const GRID_GAP = 12;
const GRID_MIN_CELL = 190;
const GRID_MAX_COLUMNS = 5;

type CarouselPreviewProps = {
  slides: Slide[];
  themeId: SlideThemeId;
  logo?: LogoConfig | null;
  format: Format;
  platform: Platform;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
};

/**
 * Escala do canvas virtual (varia por formato/plataforma) para caber inteiro
 * no espaço medido.
 *
 * As escalas eram cravadas em 0.42 (único) e 0.17 (grade): num monitor largo
 * sobrava área morta e abaixo de ~900px de altura o slide era cortado pelo
 * container. Agora quem manda é a medida real do elemento.
 */
function fitScale(stageWidth: number, stageHeight: number, slideWidth: number, slideHeight: number) {
  if (stageWidth === 0 || stageHeight === 0) return 0;
  const scale = Math.min(
    (stageWidth - SINGLE_INSET) / slideWidth,
    (stageHeight - SINGLE_INSET) / slideHeight,
  );
  return Math.max(0.05, Math.min(scale, 1));
}

function gridScale(stageWidth: number, slideWidth: number) {
  if (stageWidth === 0) return 0;
  const columns = Math.max(
    2,
    Math.min(GRID_MAX_COLUMNS, Math.floor(stageWidth / GRID_MIN_CELL)),
  );
  const cell = (stageWidth - GRID_GAP * (columns - 1)) / columns;
  return Math.max(0.05, cell / slideWidth);
}

export function CarouselPreview({
  slides,
  themeId,
  logo,
  format,
  platform,
  activeIndex,
  onActiveIndexChange,
}: CarouselPreviewProps) {
  const [isGrid, setIsGrid] = useState(false);
  const [stageRef, stage] = useElementSize<HTMLDivElement>();

  const activeSlide = slides[activeIndex] ?? slides[0];
  const { width: slideWidth, height: slideHeight } = resolveCanvasSize(format, platform);
  const scale = isGrid
    ? gridScale(stage.width, slideWidth)
    : fitScale(stage.width, stage.height, slideWidth, slideHeight);
  // Renderizar o canvas antes da primeira medida faria o slide piscar em 1:1.
  const measured = scale > 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-mut">
            Preview
          </span>
          <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-mut ring-1 ring-line">
            {Math.round(scale * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-md border border-line bg-surface p-0.5">
          <button
            type="button"
            onClick={() => setIsGrid(false)}
            aria-pressed={!isGrid}
            title="Slide único"
            className={clsx(
              "flex h-7 w-7 items-center justify-center rounded transition",
              focusRing,
              isGrid ? "text-mut hover:text-ink" : "bg-acc text-acc-ink",
            )}
          >
            <Square size={14} />
          </button>
          <button
            type="button"
            onClick={() => setIsGrid(true)}
            aria-pressed={isGrid}
            title="Grade com todos os slides"
            className={clsx(
              "flex h-7 w-7 items-center justify-center rounded transition",
              focusRing,
              isGrid ? "bg-acc text-acc-ink" : "text-mut hover:text-ink",
            )}
          >
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
        className={clsx(
          "min-h-0 flex-1",
          isGrid ? "overflow-y-auto" : "flex items-center justify-center overflow-hidden",
        )}
      >
        {!measured ? null : isGrid ? (
          <div className="flex flex-wrap content-start" style={{ gap: GRID_GAP }}>
            {slides.map((slide, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onActiveIndexChange(index);
                  setIsGrid(false);
                }}
                title={`Abrir slide ${index + 1}`}
                className={clsx(
                  "rounded ring-offset-2 ring-offset-zinc-100 transition",
                  focusRing,
                  index === activeIndex
                    ? "ring-2 ring-acc"
                    : "hover:ring-2 hover:ring-line3",
                )}
              >
                <CarouselSlide
                  slide={slide}
                  totalSlides={slides.length}
                  themeId={themeId}
                  logo={logo}
                  format={format}
                  platform={platform}
                  scale={scale}
                />
              </button>
            ))}
          </div>
        ) : (
          <CarouselSlide
            slide={activeSlide}
            totalSlides={slides.length}
            themeId={themeId}
            logo={logo}
            format={format}
            platform={platform}
            scale={scale}
          />
        )}
      </div>

      {isGrid ? null : (
        <div className="flex shrink-0 items-center justify-center gap-3">
          <IconButton
            icon={ChevronLeft}
            label="Slide anterior"
            variant="secondary"
            onClick={() => onActiveIndexChange(activeIndex - 1)}
            disabled={activeIndex === 0}
          />
          <span className="text-sm tabular-nums text-mut">
            {activeIndex + 1} / {slides.length}
          </span>
          <IconButton
            icon={ChevronRight}
            label="Próximo slide"
            variant="secondary"
            onClick={() => onActiveIndexChange(activeIndex + 1)}
            disabled={activeIndex === slides.length - 1}
          />
        </div>
      )}
    </div>
  );
}

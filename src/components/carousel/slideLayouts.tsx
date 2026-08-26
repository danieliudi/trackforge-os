"use client";

import { QRCodeSVG } from "qrcode.react";
import type { CSSProperties } from "react";

import type { SlideTheme } from "@/constants/themes";
import type { Slide, SlideType } from "@/types/carousel";

type SlideLayoutProps = {
  slide: Slide;
  theme: SlideTheme;
  /**
   * Multiplicador de tipografia. Layouts com imagem consomem altura do bloco
   * de texto, então o corpo encolhe junto para não estourar o clamp.
   */
  density?: number;
};

/** Pares [comprimento máximo, font-size]. Ordem crescente; o último é o piso. */
type SizeScale = ReadonlyArray<readonly [number, number]>;

const fitSize = (text: string, scale: SizeScale) => {
  const length = text.trim().length;
  const step = scale.find(([maxLength]) => length <= maxLength);
  return (step ?? scale[scale.length - 1])[1];
};

const display = (
  theme: SlideTheme,
  fontSize: number,
  density: number,
): CSSProperties => ({
  fontFamily: theme.displayFont,
  fontWeight: theme.displayWeight,
  letterSpacing: theme.displayTracking,
  fontSize: Math.round(fontSize * density),
});

function CoverLayout({ slide, theme, density = 1 }: SlideLayoutProps) {
  const scale: SizeScale = [
    [28, 108],
    [50, 92],
    [78, 76],
    [116, 62],
    [Number.POSITIVE_INFINITY, 52],
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden">
      <span
        aria-hidden
        className="mb-[40px] h-[10px] w-[132px] shrink-0"
        style={{ background: theme.accent }}
      />
      <h1
        className="line-clamp-4 break-words"
        style={{
          ...display(theme, fitSize(slide.headline, scale), density),
          lineHeight: 1.04,
        }}
      >
        {slide.headline}
      </h1>
      <p
        className="mt-[36px] line-clamp-2 max-w-[820px] break-words leading-[1.45]"
        style={{ color: theme.muted, fontSize: Math.round(34 * density) }}
      >
        {slide.bodyText}
      </p>
    </div>
  );
}

function ContentLayout({ slide, theme, density = 1 }: SlideLayoutProps) {
  const scale: SizeScale = [
    [40, 78],
    [72, 64],
    [104, 54],
    [Number.POSITIVE_INFINITY, 46],
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden">
      <h2
        className="line-clamp-4 break-words"
        style={{
          ...display(theme, fitSize(slide.headline, scale), density),
          lineHeight: 1.1,
        }}
      >
        {slide.headline}
      </h2>
      <span
        aria-hidden
        className="mt-[40px] h-px w-[180px] shrink-0"
        style={{ background: theme.border }}
      />
      <p
        className="mt-[40px] line-clamp-3 max-w-[860px] break-words leading-[1.5]"
        style={{ color: theme.muted, fontSize: Math.round(34 * density) }}
      >
        {slide.bodyText}
      </p>
    </div>
  );
}

function QuoteLayout({ slide, theme, density = 1 }: SlideLayoutProps) {
  const scale: SizeScale = [
    [60, 76],
    [104, 62],
    [Number.POSITIVE_INFINITY, 52],
  ];

  return (
    <div className="relative flex min-h-0 flex-1 flex-col justify-center overflow-hidden">
      <span
        aria-hidden
        className="pointer-events-none absolute left-[-14px] top-[-72px] select-none leading-none"
        style={{
          fontFamily: theme.displayFont,
          fontSize: Math.round(280 * density),
          color: theme.accent,
          opacity: 0.16,
        }}
      >
        &ldquo;
      </span>
      <blockquote
        className="relative line-clamp-5 break-words"
        style={{
          ...display(theme, fitSize(slide.headline, scale), density),
          lineHeight: 1.2,
        }}
      >
        {slide.headline}
      </blockquote>
      <p
        className="relative mt-[44px] line-clamp-2 break-words font-semibold uppercase leading-[1.4] tracking-[0.14em]"
        style={{ color: theme.accent, fontSize: Math.round(28 * density) }}
      >
        &mdash; {slide.bodyText}
      </p>
    </div>
  );
}

function DataMetricLayout({ slide, theme, density = 1 }: SlideLayoutProps) {
  const scale: SizeScale = [
    [8, 220],
    [16, 168],
    [28, 116],
    [Number.POSITIVE_INFINITY, 82],
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden">
      <p
        className="line-clamp-2 break-words tabular-nums"
        style={{
          ...display(theme, fitSize(slide.headline, scale), density),
          fontFamily: theme.metricFont,
          lineHeight: 1,
          color: theme.accent,
        }}
      >
        {slide.headline}
      </p>
      <span
        aria-hidden
        className="mt-[48px] h-px w-full shrink-0"
        style={{ background: theme.border }}
      />
      <p
        className="mt-[40px] line-clamp-3 max-w-[860px] break-words leading-[1.5]"
        style={{ color: theme.muted, fontSize: Math.round(34 * density) }}
      >
        {slide.bodyText}
      </p>
    </div>
  );
}

function CtaLayout({ slide, theme, density = 1 }: SlideLayoutProps) {
  const scale: SizeScale = [
    [36, 86],
    [68, 70],
    [Number.POSITIVE_INFINITY, 56],
  ];
  const qrSize = Math.round(196 * density);

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden">
      <h2
        className="line-clamp-3 break-words"
        style={{
          ...display(theme, fitSize(slide.headline, scale), density),
          lineHeight: 1.08,
        }}
      >
        {slide.headline}
      </h2>

      <div className="mt-[56px] flex items-end justify-between gap-[48px]">
        <span
          className="min-w-0 truncate font-semibold"
          style={{
            background: theme.accent,
            color: theme.accentContrast,
            borderRadius: theme.badgeRadius,
            padding: `${Math.round(28 * density)}px ${Math.round(44 * density)}px`,
            fontSize: Math.round(32 * density),
          }}
        >
          {slide.bodyText}
        </span>

        {slide.qrCodeUrl ? (
          <div
            className="shrink-0 rounded-[20px] border"
            style={{
              background: "#FFFFFF",
              borderColor: "rgba(0, 0, 0, 0.10)",
              padding: Math.round(20 * density),
            }}
          >
            {/* Preto sobre branco: qualquer tinta de marca reduz a leitura do QR. */}
            <QRCodeSVG
              value={slide.qrCodeUrl}
              size={qrSize}
              bgColor="#FFFFFF"
              fgColor="#111111"
              level="M"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const slideLayouts: Record<
  SlideType,
  (props: SlideLayoutProps) => React.JSX.Element
> = {
  cover: CoverLayout,
  content: ContentLayout,
  quote: QuoteLayout,
  data_metric: DataMetricLayout,
  cta: CtaLayout,
};

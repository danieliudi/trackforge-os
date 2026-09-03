"use client";

import { QRCodeSVG } from "qrcode.react";
import type { CSSProperties, ReactNode } from "react";

import {
  compositions,
  DEFAULT_COMPOSITION,
  type CompositionId,
} from "@/constants/compositions";
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
  /** Composição tipográfica (eixo aparte do tema de cor). */
  compositionId?: CompositionId;
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
  compositionId: CompositionId = DEFAULT_COMPOSITION,
): CSSProperties => {
  const composition = compositions[compositionId];
  return {
    fontFamily: theme.displayFont,
    fontWeight: theme.displayWeight,
    letterSpacing: composition.trackingBoost !== "0"
      ? `calc(${theme.displayTracking} + ${composition.trackingBoost})`
      : theme.displayTracking,
    fontSize: Math.round(fontSize * density * composition.typeScale),
  };
};

/**
 * Destaca trechos entre *asteriscos* na cor de acento do tema.
 * Editorial Brands Decoded-style sem forçar markup em todo headline.
 */
function AccentHeadline({
  text,
  theme,
  className,
  style,
}: {
  text: string;
  theme: SlideTheme;
  className?: string;
  style?: CSSProperties;
}) {
  const parts: ReactNode[] = [];
  const re = /\*([^*]+)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    parts.push(
      <span key={key} style={{ color: theme.accent }}>
        {match[1]}
      </span>,
    );
    key += 1;
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  if (parts.length === 0) parts.push(text);

  return (
    <span className={className} style={style}>
      {parts}
    </span>
  );
}

function CoverLayout({
  slide,
  theme,
  density = 1,
  compositionId = DEFAULT_COMPOSITION,
}: SlideLayoutProps) {
  const composition = compositions[compositionId];
  const scale: SizeScale = [
    [28, 108],
    [50, 92],
    [78, 76],
    [116, 62],
    [Number.POSITIVE_INFINITY, 52],
  ];
  const justify =
    composition.textAnchor === "start"
      ? "justify-start"
      : composition.textAnchor === "center"
        ? "justify-center"
        : "justify-end";

  return (
    <div className={`flex min-h-0 flex-1 flex-col overflow-hidden ${justify}`}>
      {composition.coverBar === "thin" ? (
        <span
          aria-hidden
          className="mb-[40px] h-[10px] w-[132px] shrink-0"
          style={{ background: theme.accent }}
        />
      ) : null}
      {composition.coverBar === "band" ? (
        <span
          aria-hidden
          className="mb-[36px] h-[18px] w-[220px] shrink-0"
          style={{ background: theme.accent }}
        />
      ) : null}
      <h1
        className="line-clamp-4 break-words"
        style={{
          ...display(theme, fitSize(slide.headline, scale), density, compositionId),
          lineHeight: compositionId === "impacto" ? 0.98 : 1.04,
        }}
      >
        <AccentHeadline text={slide.headline} theme={theme} />
      </h1>
      <p
        className="mt-[36px] line-clamp-2 max-w-[820px] break-words leading-[1.45]"
        style={{
          color: theme.muted,
          fontSize: Math.round(34 * density * (compositionId === "impacto" ? 0.92 : 1)),
        }}
      >
        {slide.bodyText ?? ""}
      </p>
    </div>
  );
}

function ContentLayout({
  slide,
  theme,
  density = 1,
  compositionId = DEFAULT_COMPOSITION,
}: SlideLayoutProps) {
  const composition = compositions[compositionId];
  const scale: SizeScale = [
    [40, 78],
    [72, 64],
    [104, 54],
    [Number.POSITIVE_INFINITY, 46],
  ];
  const justify =
    composition.textAnchor === "end" && compositionId === "editorial"
      ? "justify-end"
      : composition.textAnchor === "start"
        ? "justify-start"
        : "justify-center";

  return (
    <div className={`flex min-h-0 flex-1 flex-col overflow-hidden ${justify}`}>
      <h2
        className="line-clamp-4 break-words"
        style={{
          ...display(theme, fitSize(slide.headline, scale), density, compositionId),
          lineHeight: 1.1,
        }}
      >
        <AccentHeadline text={slide.headline} theme={theme} />
      </h2>
      {compositionId !== "impacto" ? (
        <span
          aria-hidden
          className="mt-[40px] h-px w-[180px] shrink-0"
          style={{ background: theme.border }}
        />
      ) : (
        <span
          aria-hidden
          className="mt-[28px] h-[6px] w-[120px] shrink-0"
          style={{ background: theme.accent }}
        />
      )}
      <p
        className="mt-[40px] line-clamp-3 max-w-[860px] break-words leading-[1.5]"
        style={{ color: theme.muted, fontSize: Math.round(34 * density) }}
      >
        {slide.bodyText ?? ""}
      </p>
    </div>
  );
}

function QuoteLayout({
  slide,
  theme,
  density = 1,
  compositionId = DEFAULT_COMPOSITION,
}: SlideLayoutProps) {
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
          fontSize: Math.round(280 * density * compositions[compositionId].typeScale),
          color: theme.accent,
          opacity: compositionId === "impacto" ? 0.22 : 0.16,
        }}
      >
        &ldquo;
      </span>
      <blockquote
        className="relative line-clamp-5 break-words"
        style={{
          ...display(theme, fitSize(slide.headline, scale), density, compositionId),
          lineHeight: 1.2,
        }}
      >
        <AccentHeadline text={slide.headline} theme={theme} />
      </blockquote>
      <p
        className="relative mt-[44px] line-clamp-2 break-words font-semibold uppercase leading-[1.4] tracking-[0.14em]"
        style={{ color: theme.accent, fontSize: Math.round(28 * density) }}
      >
        &mdash; {slide.bodyText ?? ""}
      </p>
    </div>
  );
}

function DataMetricLayout({
  slide,
  theme,
  density = 1,
  compositionId = DEFAULT_COMPOSITION,
}: SlideLayoutProps) {
  const scale: SizeScale = [
    [8, 220],
    [16, 168],
    [28, 116],
    [Number.POSITIVE_INFINITY, 82],
  ];

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col overflow-hidden ${
        compositionId === "impacto" ? "justify-end" : "justify-center"
      }`}
    >
      <p
        className="line-clamp-2 break-words tabular-nums"
        style={{
          ...display(theme, fitSize(slide.headline, scale), density, compositionId),
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
        {slide.bodyText ?? ""}
      </p>
    </div>
  );
}

function CtaLayout({
  slide,
  theme,
  density = 1,
  compositionId = DEFAULT_COMPOSITION,
}: SlideLayoutProps) {
  const composition = compositions[compositionId];
  const scale: SizeScale = [
    [36, 86],
    [68, 70],
    [Number.POSITIVE_INFINITY, 56],
  ];
  const qrSize = Math.round(196 * density);

  const qr = slide.qrCodeUrl ? (
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
  ) : null;

  if (composition.ctaStyle === "band-qr") {
    return (
      <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden">
        <h2
          className="line-clamp-3 break-words"
          style={{
            ...display(theme, fitSize(slide.headline, scale), density, compositionId),
            lineHeight: 1.05,
          }}
        >
          <AccentHeadline text={slide.headline} theme={theme} />
        </h2>
        <div
          className="mt-[48px] flex items-center justify-between gap-[40px]"
          style={{
            background: theme.accent,
            color: theme.accentContrast,
            borderRadius: theme.badgeRadius,
            padding: `${Math.round(36 * density)}px ${Math.round(40 * density)}px`,
          }}
        >
          <span
            className="min-w-0 flex-1 font-semibold leading-snug"
            style={{ fontSize: Math.round(34 * density) }}
          >
            {slide.bodyText ?? ""}
          </span>
          {qr}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden">
      <h2
        className="line-clamp-3 break-words"
        style={{
          ...display(theme, fitSize(slide.headline, scale), density, compositionId),
          lineHeight: 1.08,
        }}
      >
        <AccentHeadline text={slide.headline} theme={theme} />
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
          {slide.bodyText ?? ""}
        </span>
        {qr}
      </div>
    </div>
  );
}

/**
 * Lista de pontos — agenda, riscos, prioridades. Exclusivo de Apresentação,
 * então calibrado para o canvas 16:9 (1920 de largura), não para os 1080 do
 * carrossel: densidade de deck é mais baixa que a de um poster social.
 */
function BulletsLayout({
  slide,
  theme,
  density = 1,
  compositionId = DEFAULT_COMPOSITION,
}: SlideLayoutProps) {
  const scale: SizeScale = [
    [30, 64],
    [60, 54],
    [100, 46],
    [Number.POSITIVE_INFINITY, 40],
  ];
  const items = slide.bullets ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden">
      <h2
        className="line-clamp-2 break-words"
        style={{
          ...display(theme, fitSize(slide.headline, scale), density, compositionId),
          lineHeight: 1.15,
        }}
      >
        <AccentHeadline text={slide.headline} theme={theme} />
      </h2>
      <span
        aria-hidden
        className="mt-[32px] h-px w-[180px] shrink-0"
        style={{ background: theme.border }}
      />
      <div className="mt-[32px] flex flex-col gap-[24px] overflow-hidden">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-[20px]">
            <span
              aria-hidden
              className="mt-[10px] h-[12px] w-[12px] shrink-0"
              style={{ background: theme.accent }}
            />
            <p
              className="break-words leading-[1.4]"
              style={{ fontSize: Math.round(32 * density) }}
            >
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Divisor de bloco temático — tela cheia, quase sem texto. Exclusivo de
 * Apresentação; mesma superfície escura de impacto que a capa (ver
 * resolveTheme em constants/themes.ts).
 */
function SectionLayout({
  slide,
  theme,
  density = 1,
  compositionId = DEFAULT_COMPOSITION,
}: SlideLayoutProps) {
  const scale: SizeScale = [
    [20, 88],
    [40, 72],
    [70, 58],
    [Number.POSITIVE_INFINITY, 48],
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden">
      <span
        aria-hidden
        className="mb-[36px] h-[10px] w-[132px] shrink-0"
        style={{ background: theme.accent }}
      />
      <h1
        className="line-clamp-3 break-words"
        style={{
          ...display(theme, fitSize(slide.headline, scale), density, compositionId),
          lineHeight: 1.08,
        }}
      >
        <AccentHeadline text={slide.headline} theme={theme} />
      </h1>
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
  bullets: BulletsLayout,
  section: SectionLayout,
};

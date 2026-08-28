import type { ReactNode } from "react";

import {
  SLIDE_HEIGHT,
  SLIDE_PADDING,
  SLIDE_WIDTH,
  type SlideTheme,
} from "@/constants/themes";
import type { SlideImage } from "@/types/carousel";

export type LogoPlacement = "header" | "footer";

type SlideFrameProps = {
  theme: SlideTheme;
  slideNumber: number;
  totalSlides: number;
  highlightTag?: string;
  /** Ausente esconde o texto do rodapé — a barra de acento e o logo continuam. */
  footerNote?: string;
  image?: SlideImage;
  logoSrc?: string;
  logoAlt?: string;
  /** Capa destaca o logo no topo; internas levam no rodapé. */
  logoPlacement?: LogoPlacement;
  /** Fator de escala do canvas 1080x1350. 1 = tamanho de export. */
  scale?: number;
  children: ReactNode;
};

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Caixa (max-w + max-h) em vez de altura fixa. Com proporções de 1.78:1 a
 * 4.31:1, travar só a altura deixa a largura abaixo do mínimo dos manuais
 * (Sanwey 140px, Resibag 120px). object-contain preserva o aspecto.
 */
const LOGO_BOX = {
  header: "max-h-[88px] max-w-[240px]",
  footer: "max-h-[72px] max-w-[200px]",
} as const;

/**
 * Imagem remota pede crossOrigin para o canvas do export não ser contaminado.
 * Em data: URL o atributo atrapalha, então só entra em http(s).
 */
const isRemote = (url: string) => /^https?:\/\//i.test(url);

/**
 * Canvas 4:5 em px fixos (1080x1350) escalado via `transform`, de modo que o
 * layout renderizado seja idêntico ao exportado, independente do zoom da tela.
 */
export function SlideFrame({
  theme,
  slideNumber,
  totalSlides,
  highlightTag,
  footerNote,
  image,
  logoSrc,
  logoAlt = "",
  logoPlacement = "footer",
  scale = 1,
  children,
}: SlideFrameProps) {
  const headerLogo = logoSrc && logoPlacement === "header" ? logoSrc : undefined;
  const footerLogo = logoSrc && logoPlacement === "footer" ? logoSrc : undefined;
  const crossOrigin = image && isRemote(image.url) ? "anonymous" : undefined;

  return (
    <div
      className="shrink-0"
      style={{ width: SLIDE_WIDTH * scale, height: SLIDE_HEIGHT * scale }}
    >
      <div
        data-slide-theme={theme.id}
        className="relative flex flex-col overflow-hidden"
        style={{
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          background: theme.background,
          color: theme.foreground,
          fontFamily: theme.bodyFont,
        }}
      >
        {image?.layout === "background" ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt=""
              aria-hidden
              crossOrigin={crossOrigin}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
            {/* Overlay obrigatório: sem ele o texto some sobre a foto. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/40"
            />
          </>
        ) : theme.decor ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={theme.decor}
          />
        ) : null}

        <header
          className="relative flex shrink-0 items-start justify-between gap-[32px]"
          style={{ padding: `${SLIDE_PADDING}px ${SLIDE_PADDING}px 0` }}
        >
          <div className="flex min-w-0 flex-col items-start gap-[24px]">
            {headerLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={headerLogo}
                alt={logoAlt}
                className={`h-auto w-auto shrink-0 object-contain ${LOGO_BOX.header}`}
              />
            ) : null}
            {highlightTag ? (
              <span
                className="inline-block max-w-[620px] truncate border text-[24px] font-semibold uppercase leading-none tracking-[0.14em]"
                style={{
                  borderColor: theme.accent,
                  borderRadius: theme.badgeRadius,
                  color: theme.accent,
                  padding: "16px 28px",
                }}
              >
                {highlightTag}
              </span>
            ) : null}
          </div>
          <span
            className="shrink-0 text-[26px] font-medium tabular-nums tracking-[0.18em]"
            style={{ color: theme.muted }}
          >
            {pad(slideNumber)} / {pad(totalSlides)}
          </span>
        </header>

        <main
          className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
          style={{ padding: `64px ${SLIDE_PADDING}px` }}
        >
          {image?.layout === "split" ? (
            <div
              className="mb-[48px] w-full shrink-0 overflow-hidden"
              style={{
                aspectRatio: "16 / 9",
                borderRadius: 20,
                border: `1px solid ${theme.border}`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt=""
                crossOrigin={crossOrigin}
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>

          {image?.layout === "card" ? (
            <div
              className="mt-[40px] w-[560px] shrink-0 self-end overflow-hidden"
              style={{
                aspectRatio: "16 / 9",
                borderRadius: 24,
                border: `1px solid ${theme.border}`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt=""
                crossOrigin={crossOrigin}
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}
        </main>

        {footerNote || footerLogo ? (
          <footer
            className="relative shrink-0"
            style={{ padding: `0 ${SLIDE_PADDING}px ${SLIDE_PADDING}px` }}
          >
            <div
              className={`flex items-center gap-[32px] pt-[24px] ${footerNote ? "justify-between" : "justify-end"}`}
              style={{ borderTop: `1px solid ${theme.border}` }}
            >
              {footerNote ? (
                <div className="flex min-w-0 flex-1 items-center gap-[28px]">
                  <span
                    aria-hidden
                    className="h-[6px] w-[56px] shrink-0"
                    style={{ background: theme.accent }}
                  />
                  <p
                    className="min-w-0 flex-1 truncate text-[24px] uppercase tracking-[0.16em]"
                    style={{ color: theme.muted }}
                  >
                    {footerNote}
                  </p>
                </div>
              ) : null}
              {footerLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={footerLogo}
                  alt={logoAlt}
                  className={`h-auto w-auto shrink-0 object-contain ${LOGO_BOX.footer}`}
                />
              ) : null}
            </div>
          </footer>
        ) : null}
      </div>
    </div>
  );
}

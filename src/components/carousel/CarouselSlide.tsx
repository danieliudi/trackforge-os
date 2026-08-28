"use client";

import { shouldShowLogo, type Brand } from "@/constants/brands";
import { resolveTheme, type SlideThemeId } from "@/constants/themes";
import type { ImageLayout, Slide } from "@/types/carousel";

import { SlideFrame } from "./SlideFrame";
import { slideLayouts } from "./slideLayouts";

export type LogoConfig = {
  src: string;
  /** Versão invertida para fundo escuro. Ausente em logo customizado. */
  srcOnDark?: string;
  /** Nome da marca — vai no alt da imagem. */
  alt?: string;
  policy: Brand["logoPolicy"];
};

/**
 * Quanto o bloco de imagem come do espaço de texto. 'split' ocupa metade da
 * área de conteúdo, então a tipografia encolhe junto para não ser cortada.
 */
const DENSITY: Record<ImageLayout, number> = {
  background: 1,
  card: 0.85,
  split: 0.62,
};

type CarouselSlideProps = {
  slide: Slide;
  totalSlides: number;
  themeId: SlideThemeId;
  logo?: LogoConfig | null;
  /** Fator de escala do canvas 1080x1350. 1 = tamanho de export. */
  scale?: number;
};

export function CarouselSlide({
  slide,
  totalSlides,
  themeId,
  logo,
  scale = 1,
}: CarouselSlideProps) {
  // Só o layout 'background' escurece o slide inteiro; split e card não.
  const hasBackgroundImage = slide.image?.layout === "background";
  const theme = resolveTheme(themeId, slide.type, hasBackgroundImage);
  const Layout = slideLayouts[slide.type];

  const showLogo =
    logo != null && shouldShowLogo(logo.policy, slide.slideNumber, totalSlides);
  const logoSrc = showLogo
    ? theme.surface === "dark"
      ? (logo.srcOnDark ?? logo.src)
      : logo.src
    : undefined;

  // Assinatura institucional só faz sentido pontuada — repetida em todo
  // slide de um carrossel denso vira ruído. Mesma regra de capa+última que
  // já rege o logo.
  const showFooterNote = slide.slideNumber === 1 || slide.slideNumber === totalSlides;

  return (
    <SlideFrame
      theme={theme}
      slideNumber={slide.slideNumber}
      totalSlides={totalSlides}
      highlightTag={slide.highlightTag}
      footerNote={showFooterNote ? slide.footerNote : undefined}
      image={slide.image}
      logoSrc={logoSrc}
      logoAlt={logo?.alt}
      logoPlacement={slide.type === "cover" ? "header" : "footer"}
      scale={scale}
    >
      <Layout
        slide={slide}
        theme={theme}
        density={slide.image ? DENSITY[slide.image.layout] : 1}
      />
    </SlideFrame>
  );
}

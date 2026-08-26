import { CarouselSlide } from "@/components/carousel";
import type { LogoConfig } from "@/components/carousel";
import { slideThemeOptions } from "@/constants/themes";
import { carouselSchema, type Carousel } from "@/types/carousel";

const PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const logo: LogoConfig = {
  src: PIXEL,
  srcOnDark: PIXEL,
  policy: "all",
};

const sample: Carousel = carouselSchema.parse({
  title: "Reduza custo logístico",
  targetAudience: "Diretores de operações industriais",
  slides: [
    {
      slideNumber: 1,
      type: "cover",
      headline: "Sua operação perde 12 horas por semana em retrabalho",
      bodyText: "Guia para diretores",
      highlightTag: "Operações",
      footerNote: "Grupo Sanwey — 2026",
    },
    {
      slideNumber: 2,
      type: "content",
      headline: "O gargalo não é a equipe, é o processo de aprovação",
      bodyText: "Diagnóstico em 3 etapas",
      footerNote: "Grupo Sanwey — 2026",
      image: { url: PIXEL, layout: "split" },
    },
    {
      slideNumber: 3,
      type: "data_metric",
      image: { url: PIXEL, layout: "card" },
      headline: "38%",
      bodyText: "Menos retrabalho em 90 dias",
      highlightTag: "Resultado",
      footerNote: "Grupo Sanwey — 2026",
    },
    {
      slideNumber: 4,
      type: "quote",
      image: { url: PIXEL, layout: "background" },
      headline: "Quem mede o processo errado otimiza o desperdício",
      bodyText: "Diretor de operações",
      footerNote: "Grupo Sanwey — 2026",
    },
    {
      slideNumber: 5,
      type: "cta",
      headline: "Vamos mapear seu gargalo",
      bodyText: "Agende um diagnóstico",
      highlightTag: "Próximo passo",
      footerNote: "Grupo Sanwey — 2026",
      qrCodeUrl: "https://sanwey.com.br/contato",
    },
  ],
});

export default function SlidesPreviewPage() {
  return (
    <main className="flex flex-col gap-16 bg-zinc-100 p-12">
      {slideThemeOptions.map(({ id, label }) => (
        <section key={id} className="flex flex-col gap-6">
          <h2 className="text-xl font-semibold text-zinc-900">{label}</h2>
          <div className="flex gap-6 overflow-x-auto pb-4">
            {sample.slides.map((slide) => (
              <CarouselSlide
                key={slide.slideNumber}
                slide={slide}
                totalSlides={sample.slides.length}
                themeId={id}
                logo={logo}
                scale={0.32}
              />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

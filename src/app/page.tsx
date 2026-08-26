"use client";

import clsx from "clsx";
import { AlertCircle, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { AppHeader } from "@/components/app/AppHeader";
import { Composer } from "@/components/app/Composer";
import { SlideList } from "@/components/app/SlideList";
import { StylePanel } from "@/components/app/StylePanel";
import { CarouselPreview } from "@/components/carousel/CarouselPreview";
import { CarouselSlide, type LogoConfig } from "@/components/carousel/CarouselSlide";
import { IconButton } from "@/components/ui/Button";
import { brands, type BrandId } from "@/constants/brands";
import { useHistory } from "@/hooks/useHistory";
import { useSettings } from "@/hooks/useSettings";
import { exportToPDF, exportToZip } from "@/lib/export";
import { moveSlide, removeBlockedReason, renumber } from "@/lib/slides";
import { loadSession, saveSession } from "@/lib/storage";
import { focusRing } from "@/lib/ui";
import { MAX_SLIDES, type Carousel, type Slide } from "@/types/carousel";

/** Campos de texto agrupam num passo só de desfazer enquanto se digita. */
const TEXT_FIELDS = new Set([
  "headline",
  "bodyText",
  "highlightTag",
  "footerNote",
  "qrCodeUrl",
]);

/** Escrever no localStorage a cada tecla travaria a digitação em payload grande. */
const PERSIST_DELAY = 400;

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "carrossel";

function readAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("não foi possível ler o arquivo"));
    reader.readAsDataURL(file);
  });
}

/**
 * Embute o SVG como data URL antes do export. O html-to-image precisa inlinar
 * toda imagem do clone; se ele mesmo tiver que buscar o arquivo, o resultado
 * depende de timing de rede e o logo sai em branco. Com data URL não há busca.
 */
async function fetchAsDataUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`logo não encontrado: ${url} (HTTP ${response.status})`);
  }
  return readAsDataUrl(await response.blob());
}

/** Atalho global não pode roubar Ctrl+Z nem as setas de dentro de um campo. */
function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  );
}

function TabButton({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={clsx(
        "rounded-md px-3 py-1.5 text-xs font-medium transition",
        focusRing,
        isActive
          ? "bg-zinc-900 text-white"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
      )}
    >
      {children}
    </button>
  );
}

export default function Home() {
  const [input, setInput] = useState("");
  const {
    present: carousel,
    commit,
    reset,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory<Carousel | null>(null);

  const [settings, dispatchSettings] = useSettings();
  const { themeId, brandId, customLogo, restored } = settings;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "zip" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"content" | "style">("content");
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");

  const [persistFailed, setPersistFailed] = useState(false);

  // Guarda a marca junto: assim um resultado de marca anterior nunca é usado,
  // sem precisar limpar o estado dentro do efeito.
  const [brandLogos, setBrandLogos] = useState<{
    brandId: BrandId;
    src: string;
    srcOnDark: string;
  } | null>(null);

  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);

  const slides = carousel?.slides ?? [];
  // A lista pode encolher por remoção ou desfazer; o índice não pode ficar fora.
  const safeIndex = Math.min(activeIndex, Math.max(0, slides.length - 1));

  // Os dois dispatches são agrupados num render só, então quando
  // `restored` vira true o carrossel já veio junto e o autosave abaixo
  // nunca chega a gravar o estado vazio por cima da sessão salva.
  useEffect(() => {
    const session = loadSession();
    if (session?.carousel) reset(session.carousel);
    dispatchSettings({ type: "restore", settings: session ?? {} });
  }, [reset, dispatchSettings]);

  useEffect(() => {
    if (!restored) return;

    const timer = setTimeout(() => {
      setPersistFailed(
        !saveSession({ carousel, themeId, brandId, customLogo }),
      );
    }, PERSIST_DELAY);

    return () => clearTimeout(timer);
  }, [restored, carousel, themeId, brandId, customLogo]);

  useEffect(() => {
    if (!brandId) return;

    let cancelled = false;
    const brand = brands[brandId];

    Promise.all([fetchAsDataUrl(brand.logoSrc), fetchAsDataUrl(brand.logoSrcOnDark)])
      .then(([src, srcOnDark]) => {
        if (!cancelled) setBrandLogos({ brandId, src, srcOnDark });
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "falha ao carregar o logo");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [brandId]);

  // Logo customizado vence a marca; sem versão invertida, usa o mesmo arquivo.
  const logo: LogoConfig | null = customLogo
    ? { src: customLogo, alt: "Logo", policy: "all" }
    : brandId && brandLogos?.brandId === brandId
      ? {
          src: brandLogos.src,
          srcOnDark: brandLogos.srcOnDark,
          alt: brands[brandId].label,
          policy: brands[brandId].logoPolicy,
        }
      : null;

  const selectBrand = (brandId: BrandId | null) =>
    dispatchSettings({ type: "brand", brandId });

  async function generate() {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.issues?.join(" - ") ?? data.error ?? "falha ao gerar o carrossel",
        );
      }

      // Documento novo zera o histórico: desfazer para dentro do carrossel
      // anterior misturaria dois briefs diferentes.
      reset(data as Carousel);
      setActiveIndex(0);
      setMobileView("preview");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "falha ao gerar o carrossel");
    } finally {
      setIsGenerating(false);
    }
  }

  function updateSlide(index: number, patch: Partial<Slide>) {
    const field = Object.keys(patch)[0];
    const coalesceKey = TEXT_FIELDS.has(field) ? `slide:${index}:${field}` : undefined;

    commit(
      (current) =>
        current
          ? {
              ...current,
              slides: current.slides.map((slide, slideIndex) =>
                slideIndex === index ? { ...slide, ...patch } : slide,
              ),
            }
          : current,
      coalesceKey,
    );
  }

  /** Toda mutação estrutural passa por aqui, então a paginação nunca dessincroniza. */
  function mutateSlides(mutate: (slides: Slide[]) => Slide[]) {
    commit((current) =>
      current ? { ...current, slides: renumber(mutate(current.slides)) } : current,
    );
  }

  function addSlide() {
    if (!carousel || carousel.slides.length >= MAX_SLIDES) return;

    mutateSlides((current) => {
      const blank: Slide = {
        slideNumber: 0,
        type: "content",
        headline: "Nova headline",
        bodyText: "Texto de apoio",
        footerNote: current[0]?.footerNote ?? "",
      };
      // Entra antes do CTA, que o schema exige como último slide.
      return [...current.slice(0, -1), blank, current[current.length - 1]];
    });
    setActiveIndex(carousel.slides.length - 1);
  }

  function duplicateSlide(index: number) {
    if (!carousel || carousel.slides.length >= MAX_SLIDES) return;

    mutateSlides((current) => [
      ...current.slice(0, index + 1),
      { ...current[index] },
      ...current.slice(index + 1),
    ]);
    setActiveIndex(index + 1);
  }

  function removeSlide(index: number) {
    if (!carousel || removeBlockedReason(index, carousel.slides.length)) return;

    mutateSlides((current) => current.filter((_, i) => i !== index));
    setActiveIndex((current) => (current >= index && current > 0 ? current - 1 : current));
  }

  function moveSlideAt(index: number, direction: -1 | 1) {
    mutateSlides((current) => moveSlide(current, index, direction));
    // A seleção acompanha o slide movido, senão o preview salta para o vizinho.
    setActiveIndex(index + direction);
  }

  const runExport = useCallback(
    async (kind: "pdf" | "zip") => {
      if (!carousel) return;

      const nodes = exportRefs.current
        .slice(0, carousel.slides.length)
        .filter((node): node is HTMLDivElement => node !== null);
      if (nodes.length === 0) return;

      setExporting(kind);
      setError(null);

      try {
        const name = slugify(carousel.title);
        if (kind === "pdf") {
          await exportToPDF(nodes, name);
        } else {
          await exportToZip(nodes, name);
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "falha ao exportar");
      } finally {
        setExporting(null);
      }
    },
    [carousel],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const typing = isTypingTarget(event.target);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        // Dentro de um campo o Ctrl+Z nativo do texto continua valendo.
        if (typing) return;
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }

      if (typing || !carousel) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveIndex((current) => Math.max(0, current - 1));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setActiveIndex((current) =>
          Math.min(carousel.slides.length - 1, current + 1),
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [carousel, undo, redo]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-zinc-100 font-sans">
      <AppHeader
        title={carousel?.title}
        hasCarousel={carousel !== null}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        exporting={exporting}
        onExport={runExport}
        persistFailed={persistFailed}
      />

      {/* O erro ficava colado embaixo do input da sidebar, então falha de
          export — disparada no header — podia estar fora da viewport. */}
      {error ? (
        <div
          role="alert"
          className="flex shrink-0 items-start gap-2 border-b border-red-200 bg-red-50 px-4 py-2.5 sm:px-6"
        >
          <AlertCircle size={15} className="mt-px shrink-0 text-red-600" />
          <p className="flex-1 text-xs leading-relaxed text-red-800">{error}</p>
          <IconButton
            icon={X}
            label="Dispensar aviso"
            size="sm"
            onClick={() => setError(null)}
            className="-mt-0.5 text-red-500 hover:bg-red-100 hover:text-red-700"
          />
        </div>
      ) : null}

      {!carousel ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Composer
            variant="hero"
            value={input}
            onChange={setInput}
            onSubmit={generate}
            isGenerating={isGenerating}
            brandId={brandId}
            onBrandChange={selectBrand}
          />
        </div>
      ) : (
        <>
          {/* Abaixo de lg as duas colunas empilhavam e o preview ficava depois
              de uma sidebar inteira. Aqui só uma das duas ocupa a tela. */}
          <div className="flex shrink-0 items-center gap-1 border-b border-zinc-200 bg-white px-4 py-2 lg:hidden">
            <TabButton
              isActive={mobileView === "editor"}
              onClick={() => setMobileView("editor")}
            >
              Editar
            </TabButton>
            <TabButton
              isActive={mobileView === "preview"}
              onClick={() => setMobileView("preview")}
            >
              Preview
            </TabButton>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
            <aside
              className={clsx(
                "min-h-0 flex-col border-r border-zinc-200 bg-white lg:flex",
                mobileView === "editor" ? "flex" : "hidden",
              )}
            >
              <div className="flex shrink-0 items-center gap-1 border-b border-zinc-200 px-3 py-2">
                <TabButton
                  isActive={tab === "content"}
                  onClick={() => setTab("content")}
                >
                  Conteúdo
                </TabButton>
                <TabButton isActive={tab === "style"} onClick={() => setTab("style")}>
                  Estilo
                </TabButton>
              </div>

              {tab === "content" ? (
                <>
                  {/* Fixo acima da rolagem: com 12 slides o brief sumia da vista. */}
                  <div className="shrink-0 border-b border-zinc-200 p-3">
                    <Composer
                      variant="compact"
                      value={input}
                      onChange={setInput}
                      onSubmit={generate}
                      isGenerating={isGenerating}
                    />
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto p-3">
                    <SlideList
                      slides={slides}
                      activeIndex={safeIndex}
                      onActivate={setActiveIndex}
                      onChange={updateSlide}
                      onDuplicate={duplicateSlide}
                      onRemove={removeSlide}
                      onMove={moveSlideAt}
                      onAdd={addSlide}
                    />
                  </div>
                </>
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  <StylePanel
                    themeId={themeId}
                    onThemeChange={(id) => dispatchSettings({ type: "theme", themeId: id })}
                    brandId={brandId}
                    onBrandChange={selectBrand}
                    customLogo={customLogo}
                    onCustomLogoChange={(dataUrl) =>
                      dispatchSettings({ type: "logo", customLogo: dataUrl })
                    }
                  />
                </div>
              )}
            </aside>

            <section
              className={clsx(
                "min-h-0 overflow-hidden p-4 sm:p-6 lg:block",
                mobileView === "preview" ? "block" : "hidden",
              )}
            >
              <CarouselPreview
                slides={slides}
                themeId={themeId}
                logo={logo}
                activeIndex={safeIndex}
                onActiveIndexChange={setActiveIndex}
              />
            </section>
          </div>
        </>
      )}

      {/* Palco oculto em escala 1:1 — é daqui que o export tira os 1080x1350. */}
      {carousel ? (
        <div aria-hidden className="pointer-events-none fixed left-[-10000px] top-0">
          {carousel.slides.map((slide, index) => (
            <div
              key={index}
              ref={(node) => {
                exportRefs.current[index] = node;
              }}
            >
              <CarouselSlide
                slide={slide}
                totalSlides={carousel.slides.length}
                themeId={themeId}
                logo={logo}
                scale={1}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

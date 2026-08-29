"use client";

import clsx from "clsx";
import { AlertCircle, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { AppHeader } from "@/components/app/AppHeader";
import { Composer } from "@/components/app/Composer";
import { ContextPanel } from "@/components/app/ContextPanel";
import { CostReceipt } from "@/components/app/CostReceipt";
import { SlideList } from "@/components/app/SlideList";
import { StylePanel } from "@/components/app/StylePanel";
import { CarouselPreview } from "@/components/carousel/CarouselPreview";
import { CarouselSlide, type LogoConfig } from "@/components/carousel/CarouselSlide";
import { IconButton } from "@/components/ui/Button";
import { brands, type BrandId } from "@/constants/brands";
import {
  formatOptions,
  platformOptions,
  type Format,
  type Platform,
} from "@/constants/format";
import type { GenerationCost } from "@/constants/pricing";
import { resolveCanvasSize } from "@/constants/themes";
import { useHistory } from "@/hooks/useHistory";
import { useSettings } from "@/hooks/useSettings";
import {
  entryFromCost,
  getCostLogServerSnapshot,
  getCostLogSnapshot,
  pushCostEntry,
  subscribeCostLog,
  type CostEntry,
} from "@/lib/costLog";
import { exportToPDF, exportToPPTX, exportToZip, getPDFFile } from "@/lib/export";
import { moveSlide, removeBlockedReason, renumber } from "@/lib/slides";
import {
  loadBrandContext,
  loadState,
  saveBrandContext,
  saveState,
  type BrandContext,
  type Draft,
} from "@/lib/storage";
import { focusRing } from "@/lib/ui";
import { MAX_SLIDES, MAX_SLIDES_APRESENTACAO, type Carousel, type Slide } from "@/types/carousel";

const maxSlidesFor = (format: Format) =>
  format === "apresentacao" ? MAX_SLIDES_APRESENTACAO : MAX_SLIDES;

/** Linha de contexto do recibo: "Carrossel LinkedIn · 8 slides". */
function costSummary(format: Format, platform: Platform, slideCount: number) {
  const formatLabel = formatOptions.find(({ id }) => id === format)?.label ?? format;
  // Apresentação é sempre 16:9 e não tem plataforma — citar uma seria ruído.
  const platformLabel =
    format === "apresentacao"
      ? ""
      : ` ${platformOptions.find(({ id }) => id === platform)?.label ?? platform}`;

  return `${formatLabel}${platformLabel} · ${slideCount} slides`;
}

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
  const { themeId, brandId, customLogo, format, platform, restored } = settings;
  const maxSlides = maxSlidesFor(format);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [includeNews, setIncludeNews] = useState(true);
  const [exporting, setExporting] = useState<"pdf" | "zip" | "pptx" | null>(null);
  const [sharing, setSharing] = useState(false);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"content" | "style" | "context">("content");
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");

  const [persistFailed, setPersistFailed] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>(() => loadState().drafts);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(() => loadState().activeId);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [brandContext, setBrandContext] = useState<BrandContext>(() => loadBrandContext());

  // Store externo em vez de useState: o log vive no localStorage e o chip some
  // quando está vazio, então ler no inicializador causaria mismatch de
  // hidratação (ver comentário em lib/costLog.ts).
  const costEntries = useSyncExternalStore(
    subscribeCostLog,
    getCostLogSnapshot,
    getCostLogServerSnapshot,
  );
  // Recibo da última geração de documento. Regerar um slide não substitui: o
  // recibo responde "quanto custou este post", e o slide avulso entra na soma
  // do rascunho, não numa tela nova a cada clique.
  const [lastCost, setLastCost] = useState<GenerationCost | null>(null);

  /** Registra a cobrança e devolve o custo, pra quem chama somar no rascunho. */
  const logCost = useCallback(
    (cost: GenerationCost, kind: CostEntry["kind"], title: string, failed = false) => {
      pushCostEntry(entryFromCost(cost, kind, title, failed));
      return cost.usd;
    },
    [],
  );

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

  // drafts/activeDraftId partem de localStorage via inicializador preguiçoso
  // (abaixo). Aqui só falta aplicar o rascunho ativo ao carrossel e às
  // configurações — nenhum dos dois é um setState de useState puro, então
  // não conta como "setState síncrono dentro de efeito".
  useEffect(() => {
    const state = loadState();
    const active = state.drafts.find((draft) => draft.id === state.activeId);
    if (active) reset(active.carousel);
    dispatchSettings({ type: "restore", settings: active ?? {} });
  }, [reset, dispatchSettings]);

  // Digitar atualiza o rascunho ativo com debounce — escrever a cada tecla
  // travaria a digitação num array de rascunhos inteiro.
  useEffect(() => {
    if (!restored || !activeDraftId || !carousel) return;

    const timer = setTimeout(() => {
      setDrafts((current) =>
        current.map((draft) =>
          draft.id === activeDraftId
            ? { ...draft, carousel, themeId, brandId, customLogo, format, platform, updatedAt: Date.now() }
            : draft,
        ),
      );
    }, PERSIST_DELAY);

    return () => clearTimeout(timer);
  }, [restored, activeDraftId, carousel, themeId, brandId, customLogo, format, platform]);

  // Persiste sempre que a lista muda — o efeito acima já debounceu a escrita
  // durante digitação, então aqui não precisa de um segundo delay.
  useEffect(() => {
    if (!restored) return;
    const timer = setTimeout(() => {
      setPersistFailed(!saveState({ drafts, activeId: activeDraftId }));
    }, 0);
    return () => clearTimeout(timer);
  }, [restored, drafts, activeDraftId]);

  // Digitar no contexto de marca também debounça — mesmo motivo do brief.
  useEffect(() => {
    if (!restored) return;
    const timer = setTimeout(() => saveBrandContext(brandContext), PERSIST_DELAY);
    return () => clearTimeout(timer);
  }, [restored, brandContext]);

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
        body: JSON.stringify({
          input,
          context: brandId ? brandContext[brandId] : undefined,
          includeNews,
          brandId,
          format,
          platform,
        }),
      });
      const data = await response.json();
      const kind = format === "apresentacao" ? "apresentacao" : "carrossel";

      if (!response.ok) {
        // Resposta fora das regras ainda queimou tokens. Registrar antes de
        // lançar evita que a geração mais frustrante seja também a invisível
        // no extrato.
        if (data.cost) logCost(data.cost as GenerationCost, kind, input.slice(0, 60), true);
        throw new Error(
          data.issues?.join(" - ") ?? data.error ?? "falha ao gerar o carrossel",
        );
      }

      const newCarousel = data.carousel as Carousel;
      const cost = data.cost as GenerationCost;
      setLastCost(cost);
      const costUsd = logCost(cost, kind, newCarousel.title);

      // Documento novo zera o histórico: desfazer para dentro do carrossel
      // anterior misturaria dois briefs diferentes.
      reset(newCarousel);
      setActiveIndex(0);
      setMobileView("preview");

      const id = crypto.randomUUID();
      setDrafts((current) => [
        ...current,
        {
          id,
          title: newCarousel.title,
          updatedAt: Date.now(),
          carousel: newCarousel,
          themeId,
          brandId,
          customLogo,
          format,
          platform,
          costUsd,
        },
      ]);
      setActiveDraftId(id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "falha ao gerar o carrossel");
    } finally {
      setIsGenerating(false);
    }
  }

  /** Só desativa o rascunho atual — ele já está salvo pelo autosave. */
  function resetCarousel() {
    reset(null);
    setInput("");
    setActiveIndex(0);
    setError(null);
    setActiveDraftId(null);
    setLastCost(null);
  }

  function selectDraft(id: string) {
    const draft = drafts.find((current) => current.id === id);
    if (!draft) return;

    setActiveDraftId(id);
    reset(draft.carousel);
    dispatchSettings({ type: "restore", settings: draft });
    setActiveIndex(0);
    setError(null);
    setMobileView("preview");
    // O recibo é da geração, não do documento: abrir um rascunho antigo não
    // cobrou nada agora, e manter o recibo anterior sugeriria que sim.
    setLastCost(null);
  }

  function deleteDraft(id: string) {
    setDrafts((current) => current.filter((draft) => draft.id !== id));
    if (id === activeDraftId) resetCarousel();
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

  async function regenerateSlide(index: number, instruction?: string) {
    if (!carousel) return;

    setRegeneratingIndex(index);
    setError(null);

    try {
      const response = await fetch("/api/generate/slide", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ carousel, slideIndex: index, instruction, brandId }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.cost) {
          logCost(data.cost as GenerationCost, "slide", `Slide ${index + 1}`, true);
        }
        throw new Error(
          data.issues?.join(" - ") ?? data.error ?? "falha ao regenerar o slide",
        );
      }

      const cost = data.cost as GenerationCost;
      logCost(cost, "slide", `Slide ${index + 1} · ${carousel.title}`);

      // Soma no rascunho: o custo de um post inclui o retrabalho depois da
      // primeira geração, senão o número do rascunho só desce com o tempo.
      setDrafts((current) =>
        current.map((draft) =>
          draft.id === activeDraftId
            ? { ...draft, costUsd: (draft.costUsd ?? 0) + cost.usd }
            : draft,
        ),
      );

      updateSlide(index, data.slide as Slide);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "falha ao regenerar o slide");
    } finally {
      setRegeneratingIndex(null);
    }
  }

  /** Toda mutação estrutural passa por aqui, então a paginação nunca dessincroniza. */
  function mutateSlides(mutate: (slides: Slide[]) => Slide[]) {
    commit((current) =>
      current ? { ...current, slides: renumber(mutate(current.slides)) } : current,
    );
  }

  function addSlide() {
    if (!carousel || carousel.slides.length >= maxSlides) return;

    mutateSlides((current) => {
      const footerNote = current[0]?.footerNote ?? "";
      const blank: Slide =
        format === "apresentacao"
          ? {
              slideNumber: 0,
              type: "bullets",
              headline: "Novo tópico",
              bullets: ["Novo ponto", "Novo ponto"],
              footerNote,
            }
          : {
              slideNumber: 0,
              type: "content",
              headline: "Nova headline",
              bodyText: "Texto de apoio",
              footerNote,
            };
      // Entra antes do CTA, que o schema exige como último slide.
      return [...current.slice(0, -1), blank, current[current.length - 1]];
    });
    setActiveIndex(carousel.slides.length - 1);
  }

  function duplicateSlide(index: number) {
    if (!carousel || carousel.slides.length >= maxSlides) return;

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
    async (kind: "pdf" | "zip" | "pptx") => {
      if (!carousel) return;

      const nodes = exportRefs.current
        .slice(0, carousel.slides.length)
        .filter((node): node is HTMLDivElement => node !== null);
      if (nodes.length === 0) return;

      setExporting(kind);
      setError(null);

      try {
        const name = slugify(carousel.title);
        const { width, height } = resolveCanvasSize(format, platform);
        if (kind === "pdf") {
          await exportToPDF(nodes, width, height, name);
        } else if (kind === "zip") {
          await exportToZip(nodes, width, height, name);
        } else {
          await exportToPPTX(nodes, width, height, name);
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "falha ao exportar");
      } finally {
        setExporting(null);
      }
    },
    [carousel, format, platform],
  );

  const shareCarousel = useCallback(async () => {
    if (!carousel) return;

    const nodes = exportRefs.current
      .slice(0, carousel.slides.length)
      .filter((node): node is HTMLDivElement => node !== null);
    if (nodes.length === 0) return;

    setSharing(true);
    setError(null);

    try {
      const { width, height } = resolveCanvasSize(format, platform);
      const file = await getPDFFile(nodes, width, height, slugify(carousel.title));
      if (!navigator.canShare?.({ files: [file] })) {
        throw new Error("compartilhamento de arquivo não suportado neste navegador");
      }
      await navigator.share({ files: [file], title: carousel.title });
    } catch (cause) {
      // Usuário cancelando o menu nativo de compartilhamento não é um erro.
      if (cause instanceof Error && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "falha ao compartilhar");
    } finally {
      setSharing(false);
    }
  }, [carousel, format, platform]);

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
        format={format}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onReset={resetCarousel}
        exporting={exporting}
        onExport={runExport}
        persistFailed={persistFailed}
        drafts={drafts}
        activeDraftId={activeDraftId}
        onSelectDraft={selectDraft}
        onDeleteDraft={deleteDraft}
        canShare={canShare}
        sharing={sharing}
        onShare={shareCarousel}
        costEntries={costEntries}
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
            brandContext={brandId ? brandContext[brandId] : undefined}
            includeNews={includeNews}
            onIncludeNewsChange={setIncludeNews}
            format={format}
            onFormatChange={(next) => dispatchSettings({ type: "format", format: next })}
            platform={platform}
            onPlatformChange={(next) => dispatchSettings({ type: "platform", platform: next })}
            onSuggestionsCost={(cost) => logCost(cost, "sugestoes", "Sugestões de tema")}
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
                <TabButton isActive={tab === "context"} onClick={() => setTab("context")}>
                  Contexto
                </TabButton>
              </div>

              {tab === "content" ? (
                <>
                  {/* Fixo acima da rolagem: com 12 slides o brief sumia da vista. */}
                  <div className="flex shrink-0 flex-col gap-3 border-b border-zinc-200 p-3">
                    <Composer
                      variant="compact"
                      value={input}
                      onChange={setInput}
                      onSubmit={generate}
                      isGenerating={isGenerating}
                      includeNews={includeNews}
                      onIncludeNewsChange={setIncludeNews}
                    />
                    {lastCost ? (
                      <CostReceipt
                        cost={lastCost}
                        summary={costSummary(format, platform, slides.length)}
                      />
                    ) : null}
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
                      onRegenerate={regenerateSlide}
                      regeneratingIndex={regeneratingIndex}
                      maxSlides={maxSlides}
                    />
                  </div>
                </>
              ) : tab === "style" ? (
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
                    format={format}
                    onFormatChange={(next) => dispatchSettings({ type: "format", format: next })}
                    platform={platform}
                    onPlatformChange={(next) =>
                      dispatchSettings({ type: "platform", platform: next })
                    }
                  />
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  <ContextPanel
                    brandId={brandId}
                    value={brandId ? brandContext[brandId] : ""}
                    onChange={(value) =>
                      brandId &&
                      setBrandContext((current) => ({ ...current, [brandId]: value }))
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
                format={format}
                platform={platform}
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
                format={format}
                platform={platform}
                scale={1}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import clsx from "clsx";
import {
  ChevronDown,
  ChevronUp,
  CopyPlus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useId, useState, type Ref } from "react";

import { Button, IconButton } from "@/components/ui/Button";
import { ImageSearchPanel } from "@/components/carousel/ImageSearchPanel";
import { fieldClass, focusRing, labelClass } from "@/lib/ui";
import type { ImageLayout, Slide, SlideType } from "@/types/carousel";

const BODY_MAX = 30;

/**
 * A partir daqui a headline para de encolher e o line-clamp do layout corta.
 *
 * Cada número é o último degrau finito da escala tipográfica do layout
 * correspondente em slideLayouts.tsx — passar disso trava a fonte no piso.
 * Só o bodyText tinha contador antes, então headline longa era cortada em
 * silêncio e o usuário só descobria no PDF exportado.
 */
const HEADLINE_SOFT_LIMIT: Record<SlideType, number> = {
  cover: 116,
  content: 104,
  quote: 104,
  data_metric: 28,
  cta: 68,
};

const IMAGE_LAYOUTS: { id: ImageLayout; label: string }[] = [
  { id: "background", label: "Fundo total" },
  { id: "card", label: "Card" },
  { id: "split", label: "Split" },
];

type SlideFieldsProps = {
  slide: Slide;
  isActive: boolean;
  onChange: (patch: Partial<Slide>) => void;
  onActivate: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRegenerate: (instruction?: string) => void;
  isRegenerating: boolean;
  /** Falso quando remover quebraria o schema (capa, CTA ou mínimo de slides). */
  canRemove: boolean;
  removeBlockedReason?: string;
  /** Capa é sempre o primeiro e CTA sempre o último: nenhum dos dois se move. */
  canMoveUp: boolean;
  canMoveDown: boolean;
  cardRef?: Ref<HTMLDivElement>;
};

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("não foi possível ler o arquivo"));
    reader.readAsDataURL(file);
  });
}

export function SlideFields({
  slide,
  isActive,
  onChange,
  onActivate,
  onDuplicate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onRegenerate,
  isRegenerating,
  canRemove,
  removeBlockedReason,
  canMoveUp,
  canMoveDown,
  cardRef,
}: SlideFieldsProps) {
  const bodyRemaining = BODY_MAX - slide.bodyText.length;
  const headlineLimit = HEADLINE_SOFT_LIMIT[slide.type];
  const headlineOver = slide.headline.length - headlineLimit;
  const uploadId = useId();
  const isUploaded = slide.image?.url.startsWith("data:") ?? false;
  const [searchOpen, setSearchOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [instruction, setInstruction] = useState("");

  function triggerRegenerate() {
    onRegenerate(instruction.trim() || undefined);
    setRegenOpen(false);
    setInstruction("");
  }

  function setImageUrl(url: string) {
    onChange({
      image: url ? { url, layout: slide.image?.layout ?? "background" } : undefined,
    });
  }

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    setImageUrl(await readAsDataUrl(file));
  }

  return (
    <div
      ref={cardRef}
      data-active={isActive || undefined}
      // Antes só onFocus ativava o slide, então clicar no corpo do card (fora
      // de um input) não sincronizava o preview.
      onClick={onActivate}
      onFocus={onActivate}
      className={clsx(
        "flex scroll-mt-3 flex-col gap-3 rounded-lg border p-3 transition",
        isActive
          ? "border-zinc-900 bg-zinc-50 shadow-sm"
          : "border-zinc-200 bg-white hover:border-zinc-300",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={clsx(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-semibold tabular-nums",
              isActive ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600",
            )}
          >
            {slide.slideNumber}
          </span>
          <span className="truncate rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600">
            {slide.type}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <IconButton
            icon={ChevronUp}
            label={canMoveUp ? "Mover para cima" : "Este slide tem posição fixa"}
            size="sm"
            disabled={!canMoveUp}
            onClick={onMoveUp}
          />
          <IconButton
            icon={ChevronDown}
            label={canMoveDown ? "Mover para baixo" : "Este slide tem posição fixa"}
            size="sm"
            disabled={!canMoveDown}
            onClick={onMoveDown}
          />
          <IconButton
            icon={Sparkles}
            label="Regenerar com IA"
            size="sm"
            variant={regenOpen ? "primary" : "ghost"}
            loading={isRegenerating}
            onClick={() => setRegenOpen((open) => !open)}
          />
          <IconButton icon={CopyPlus} label="Duplicar slide" size="sm" onClick={onDuplicate} />
          <IconButton
            icon={Trash2}
            label={canRemove ? "Remover slide" : (removeBlockedReason ?? "Remover slide")}
            size="sm"
            variant="danger"
            disabled={!canRemove}
            onClick={onRemove}
          />
        </div>
      </div>

      {regenOpen ? (
        <div className="flex gap-1.5">
          <input
            autoFocus
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") triggerRegenerate();
            }}
            placeholder='Instrução opcional (ex: "foque no ROI")…'
            className={fieldClass}
          />
          <Button icon={Sparkles} onClick={triggerRegenerate}>
            Gerar
          </Button>
        </div>
      ) : null}

      <label className="flex flex-col gap-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={labelClass}>Headline</span>
          {headlineOver > 0 ? (
            <span
              className="text-[10px] font-medium text-amber-600"
              title={`Acima de ${headlineLimit} caracteres a fonte para de encolher e o texto pode ser cortado no slide.`}
            >
              {headlineOver} além do limite
            </span>
          ) : null}
        </span>
        <textarea
          rows={2}
          value={slide.headline}
          onChange={(event) => onChange({ headline: event.target.value })}
          className={clsx(
            fieldClass,
            "resize-y",
            headlineOver > 0 && "border-amber-400 focus:border-amber-500",
          )}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={labelClass}>Body text</span>
          <span
            className={clsx(
              "text-[10px] tabular-nums",
              bodyRemaining <= 5 ? "font-medium text-amber-600" : "text-zinc-400",
            )}
          >
            {bodyRemaining}
          </span>
        </span>
        <input
          value={slide.bodyText}
          maxLength={BODY_MAX}
          onChange={(event) => onChange({ bodyText: event.target.value })}
          className={fieldClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Badge</span>
          <input
            value={slide.highlightTag ?? ""}
            onChange={(event) =>
              onChange({ highlightTag: event.target.value || undefined })
            }
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Rodapé</span>
          <input
            value={slide.footerNote}
            onChange={(event) => onChange({ footerNote: event.target.value })}
            className={fieldClass}
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <span className={labelClass}>Imagem</span>
        <div className="flex gap-2">
          <input
            value={isUploaded ? "" : (slide.image?.url ?? "")}
            placeholder={isUploaded ? "arquivo local carregado" : "https://..."}
            onChange={(event) => setImageUrl(event.target.value)}
            className={fieldClass}
          />
          <label
            htmlFor={uploadId}
            title="Enviar arquivo local"
            className={clsx(
              "flex shrink-0 cursor-pointer items-center rounded-md border border-zinc-200 bg-white px-2.5 text-zinc-600 transition hover:border-zinc-900",
              focusRing,
            )}
          >
            <Upload size={14} />
          </label>
          <input
            id={uploadId}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleUpload(event.target.files?.[0])}
          />
          <IconButton
            icon={Search}
            label="Buscar imagens"
            variant={searchOpen ? "primary" : "secondary"}
            onClick={() => setSearchOpen((open) => !open)}
          />
          {slide.image ? (
            <IconButton
              icon={X}
              label="Remover imagem"
              variant="secondary"
              onClick={() => onChange({ image: undefined })}
              className="hover:border-red-500 hover:text-red-600"
            />
          ) : null}
        </div>

        {searchOpen ? (
          <ImageSearchPanel
            onSelect={(url) => {
              setImageUrl(url);
              setSearchOpen(false);
            }}
          />
        ) : null}

        {slide.image ? (
          <div className="flex gap-1.5">
            {IMAGE_LAYOUTS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() =>
                  slide.image && onChange({ image: { ...slide.image, layout: id } })
                }
                aria-pressed={slide.image?.layout === id}
                className={clsx(
                  "flex-1 rounded-md border px-2 py-1.5 text-[11px] font-medium transition",
                  focusRing,
                  slide.image?.layout === id
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-400",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {slide.type === "cta" ? (
        <label className="flex flex-col gap-1">
          <span className={labelClass}>URL do QR Code</span>
          <input
            value={slide.qrCodeUrl ?? ""}
            placeholder="https://sanwey.com.br/contato"
            onChange={(event) => onChange({ qrCodeUrl: event.target.value || undefined })}
            className={fieldClass}
          />
        </label>
      ) : null}
    </div>
  );
}

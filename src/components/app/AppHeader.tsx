"use client";

import { CloudOff, FileDown, FilePlus2, Images, Redo2, Share2, Undo2 } from "lucide-react";

import { Button, IconButton } from "@/components/ui/Button";
import { CostMenu } from "@/components/app/CostMenu";
import { DraftsMenu } from "@/components/app/DraftsMenu";
import type { Format } from "@/constants/format";
import type { CostEntry } from "@/lib/costLog";
import type { Draft } from "@/lib/storage";

type AppHeaderProps = {
  title?: string;
  hasCarousel: boolean;
  format: Format;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  exporting: "pdf" | "zip" | "pptx" | null;
  onExport: (kind: "pdf" | "zip" | "pptx") => void;
  /** localStorage recusou o payload — o autosave silenciosamente não existe. */
  persistFailed: boolean;
  drafts: Draft[];
  activeDraftId: string | null;
  onSelectDraft: (id: string) => void;
  onDeleteDraft: (id: string) => void;
  /** Web Share API — ausente em boa parte do desktop, então o botão some. */
  canShare: boolean;
  sharing: boolean;
  onShare: () => void;
  /** Histórico de custo da API — o chip some enquanto estiver vazio. */
  costEntries: CostEntry[];
};

export function AppHeader({
  title,
  hasCarousel,
  format,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  exporting,
  onExport,
  persistFailed,
  drafts,
  activeDraftId,
  onSelectDraft,
  onDeleteDraft,
  canShare,
  sharing,
  onShare,
  costEntries,
}: AppHeaderProps) {
  const isExporting = exporting !== null;

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 py-2.5 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="shrink-0 text-sm font-semibold tracking-tight text-zinc-900">
          Carousel Builder
        </span>
        {title ? (
          <>
            <span aria-hidden className="shrink-0 text-zinc-300">
              /
            </span>
            <span className="truncate text-sm text-zinc-600" title={title}>
              {title}
            </span>
          </>
        ) : null}
        {persistFailed ? (
          <span
            className="flex shrink-0 items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
            title="O navegador recusou salvar a sessão, provavelmente por excesso de imagens em data URL. Recarregar a página vai perder as edições."
          >
            <CloudOff size={12} />
            <span className="hidden sm:inline">Não salvo</span>
          </span>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <CostMenu entries={costEntries} />

        {hasCarousel ? (
          <>
            <span aria-hidden className="mx-1 h-5 w-px bg-zinc-200" />

            <Button icon={FilePlus2} onClick={onReset}>
              <span className="hidden sm:inline">Novo carrossel</span>
            </Button>

            <span aria-hidden className="mx-1 h-5 w-px bg-zinc-200" />

            <div className="flex items-center">
              <IconButton
                icon={Undo2}
                label="Desfazer (Ctrl+Z)"
                onClick={onUndo}
                disabled={!canUndo}
              />
              <IconButton
                icon={Redo2}
                label="Refazer (Ctrl+Shift+Z)"
                onClick={onRedo}
                disabled={!canRedo}
              />
            </div>

            <span aria-hidden className="mx-1 h-5 w-px bg-zinc-200" />
          </>
        ) : null}

        <DraftsMenu
          drafts={drafts}
          activeId={activeDraftId}
          onSelect={onSelectDraft}
          onDelete={onDeleteDraft}
        />

        {hasCarousel ? (
          <>
            <span aria-hidden className="mx-1 h-5 w-px bg-zinc-200" />

            {canShare ? (
              <Button icon={Share2} loading={sharing} disabled={sharing} onClick={onShare}>
                <span className="hidden sm:inline">Compartilhar</span>
              </Button>
            ) : null}
            {format === "apresentacao" ? (
              <Button
                icon={FileDown}
                loading={exporting === "pptx"}
                disabled={isExporting}
                onClick={() => onExport("pptx")}
              >
                <span className="hidden sm:inline">Exportar .pptx</span>
              </Button>
            ) : (
              <>
                <Button
                  icon={FileDown}
                  loading={exporting === "pdf"}
                  disabled={isExporting}
                  onClick={() => onExport("pdf")}
                >
                  <span className="hidden sm:inline">PDF</span>
                </Button>
                <Button
                  icon={Images}
                  loading={exporting === "zip"}
                  disabled={isExporting}
                  onClick={() => onExport("zip")}
                >
                  <span className="hidden sm:inline">PNG</span>
                </Button>
              </>
            )}
          </>
        ) : null}
      </div>
    </header>
  );
}

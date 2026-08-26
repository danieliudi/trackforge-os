"use client";

import { CloudOff, FileDown, Images, Redo2, Undo2 } from "lucide-react";

import { Button, IconButton } from "@/components/ui/Button";

type AppHeaderProps = {
  title?: string;
  hasCarousel: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  exporting: "pdf" | "zip" | null;
  onExport: (kind: "pdf" | "zip") => void;
  /** localStorage recusou o payload — o autosave silenciosamente não existe. */
  persistFailed: boolean;
};

export function AppHeader({
  title,
  hasCarousel,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  exporting,
  onExport,
  persistFailed,
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

      {hasCarousel ? (
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
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
        </div>
      ) : null}
    </header>
  );
}

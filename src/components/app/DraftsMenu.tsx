"use client";

import clsx from "clsx";
import { History, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { IconButton } from "@/components/ui/Button";
import { formatCost } from "@/lib/costLog";
import type { Draft } from "@/lib/storage";
import { focusRing, panelClass } from "@/lib/ui";

type DraftsMenuProps = {
  drafts: Draft[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
};

function relativeTime(updatedAt: number) {
  const minutes = Math.round((Date.now() - updatedAt) / 60_000);
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.round(hours / 24)}d`;
}

export function DraftsMenu({ drafts, activeId, onSelect, onDelete }: DraftsMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const sorted = [...drafts].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div ref={rootRef} className="relative">
      <IconButton
        icon={History}
        label="Carrosséis salvos"
        variant={open ? "primary" : "secondary"}
        onClick={() => setOpen((current) => !current)}
      />

      {open ? (
        <div
          className={clsx(
            panelClass,
            "absolute right-0 top-full z-10 mt-1.5 w-72 overflow-hidden p-1 shadow-lg",
          )}
        >
          {sorted.length === 0 ? (
            <p className="px-2.5 py-3 text-center text-xs text-zinc-500">
              Nenhum carrossel salvo ainda
            </p>
          ) : (
            sorted.map((draft) => {
              const isActive = draft.id === activeId;
              return (
                <div
                  key={draft.id}
                  className={clsx(
                    "flex items-center gap-2 rounded-md px-2.5 py-2 transition",
                    isActive ? "bg-zinc-100" : "hover:bg-zinc-50",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(draft.id);
                      setOpen(false);
                    }}
                    className={clsx(
                      "flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left",
                      focusRing,
                    )}
                  >
                    <span className="w-full truncate text-xs font-medium text-zinc-900">
                      {draft.title}
                    </span>
                    <span className="flex w-full items-baseline gap-1.5 text-[10.5px] text-zinc-400">
                      <span>{isActive ? "editando agora" : relativeTime(draft.updatedAt)}</span>
                      {draft.costUsd !== undefined ? (
                        <>
                          <span aria-hidden>·</span>
                          <span
                            className="font-mono tabular-nums text-emerald-700"
                            title="Custo de API deste rascunho, incluindo regerações de slide"
                          >
                            {formatCost(draft.costUsd).primary}
                          </span>
                        </>
                      ) : null}
                    </span>
                  </button>
                  <IconButton
                    icon={Trash2}
                    label={`Excluir "${draft.title}"`}
                    size="sm"
                    variant="danger"
                    onClick={() => onDelete(draft.id)}
                  />
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

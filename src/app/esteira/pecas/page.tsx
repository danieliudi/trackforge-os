"use client";

import clsx from "clsx";
import { PenLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { EsteiraShell, ShellPage, useFront } from "@/components/app/EsteiraShell";
import { Button } from "@/components/ui/Button";
import { platformOptions } from "@/constants/format";
import { formatCost } from "@/lib/costLog";
import { loadState, saveState, type Draft } from "@/lib/storage";
import { labelClass, panelClass } from "@/lib/ui";

/**
 * As peças salvas, e a porta para o editor.
 *
 * Não se chama "publicadas" porque a ferramenta não sabe o que foi publicado —
 * a conferência do que foi ao ar é manual por decisão (o nó A8 depende de
 * acesso de leitura às contas, que não existe). Prometer "publicadas" e mostrar
 * rascunho seria mentir no rótulo.
 */
export default function PecasPage() {
  const router = useRouter();
  const [front] = useFront();
  const [drafts, setDrafts] = useState<Draft[] | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDrafts(loadState().drafts), 0);
    return () => clearTimeout(timer);
  }, []);

  const open = (draft: Draft) => {
    const state = loadState();
    saveState({ drafts: state.drafts, activeId: draft.id });
    router.push("/editor");
  };

  const mine = (drafts ?? []).filter((draft) => draft.brandId === front);

  return (
    <EsteiraShell>
      <ShellPage>
      <div className="flex flex-col gap-0.5">
        <span className={labelClass}>Peças</span>
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          O que já foi montado
        </h1>
      </div>

      {drafts === null ? null : mine.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-3.5 py-3 text-[12.5px] text-mut">
          Nenhuma peça salva nesta frente ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {mine.map((draft) => (
            <div
              key={draft.id}
              className={clsx(panelClass, "flex flex-wrap items-center gap-3 px-3.5 py-3")}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[13px] font-medium text-ink">
                  {draft.title}
                </span>
                <span className="font-mono text-[10px] text-faint">
                  {platformOptions.find((p) => p.id === draft.platform)?.label ?? draft.platform}
                  {" · "}
                  {draft.carousel.slides.length} slides
                  {" · "}
                  {new Date(draft.updatedAt).toLocaleDateString("pt-BR")}
                  {draft.costUsd !== undefined ? ` · ${formatCost(draft.costUsd).primary}` : ""}
                </span>
              </span>
              <Button icon={PenLine} size="sm" onClick={() => open(draft)}>
                Abrir
              </Button>
            </div>
          ))}
        </div>
      )}
      </ShellPage>
    </EsteiraShell>
  );
}

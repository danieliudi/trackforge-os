"use client";

import clsx from "clsx";
import { Check, PenLine, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { EsteiraShell, ShellPage, useFront } from "@/components/app/EsteiraShell";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Button, IconButton } from "@/components/ui/Button";
import { platformOptions } from "@/constants/format";
import { formatCost } from "@/lib/costLog";
import {
  getProductionsServerSnapshot,
  getProductionsSnapshot,
  removeProduction,
  subscribeProductions,
} from "@/lib/produced";
import { loadState, saveState, type Draft } from "@/lib/storage";
import { labelClass, metaClass, panelClass } from "@/lib/ui";
import { OUTPUT_META } from "@/types/outputs";

/**
 * O que já foi produzido, e a porta de volta para ele.
 *
 * Duas listas de propósito: produção (bancada) e rascunho (editor de slides).
 * Densidade Situação — KPIs + listas em max-w-[1440px].
 */
export default function PecasPage() {
  const router = useRouter();
  const [front] = useFront();
  const [drafts, setDrafts] = useState<Draft[] | null>(null);

  const productions = useSyncExternalStore(
    subscribeProductions,
    getProductionsSnapshot,
    getProductionsServerSnapshot,
  );

  useEffect(() => {
    const timer = setTimeout(() => setDrafts(loadState().drafts), 0);
    return () => clearTimeout(timer);
  }, []);

  const openDraft = (draft: Draft) => {
    const state = loadState();
    saveState({ drafts: state.drafts, activeId: draft.id });
    router.push("/editor");
  };

  const mine = useMemo(
    () => (drafts ?? []).filter((draft) => draft.brandId === front),
    [drafts, front],
  );
  const runs = useMemo(
    () => productions.filter((run) => run.brandId === front),
    [productions, front],
  );
  const unsent = runs.filter((run) => !run.sent).length;
  const sent = runs.filter((run) => run.sent).length;
  const brandLabel = front === "resibag" ? "Resibag" : "Sanwey";

  return (
    <EsteiraShell>
      <ShellPage>
        <div className="flex flex-col gap-0.5">
          <span className={labelClass}>Peças</span>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            O que já foi produzido
          </h1>
          <p className="text-[13px] text-mut">
            Tudo que sai da bancada é salvo aqui sozinho, neste navegador · {brandLabel}
          </p>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Da bancada"
            value={String(runs.length)}
            subtitle="produções nesta frente"
          />
          <KpiCard
            title="Não enviados"
            value={String(unsent)}
            subtitle="pagos, ainda na bancada"
            urgent={unsent > 0}
          />
          <KpiCard
            title="Na fila do CRM"
            value={String(sent)}
            subtitle="já enviados"
          />
          <KpiCard
            title="No editor"
            value={drafts === null ? "—" : String(mine.length)}
            subtitle="carrosséis abertos"
          />
        </section>

        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-acc" aria-hidden />
            <span className={labelClass}>Da bancada · n={runs.length}</span>
          </span>

          {runs.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-3.5 py-3 text-[12.5px] text-mut">
              Nada produzido nesta frente ainda.
            </p>
          ) : (
            runs.map((run) => (
              <div
                key={run.id}
                className={clsx(panelClass, "flex flex-wrap items-center gap-3 px-4 py-3.5")}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-baseline gap-2">
                    <span className="truncate text-[13px] font-medium text-ink">{run.title}</span>
                    {run.sent ? (
                      <span className="flex items-center gap-1 rounded border border-ok-line bg-ok-bg px-1.5 py-0.5 text-[10px] text-ok">
                        <Check size={10} />
                        na fila do CRM
                      </span>
                    ) : null}
                  </span>
                  <span className={metaClass}>
                    {run.article ? "artigo" : "sem artigo"}
                    {run.pieces.length > 0
                      ? ` · ${run.pieces.map((p) => OUTPUT_META[p.kind].label).join(", ")}`
                      : " · nenhuma peça ainda"}
                    {run.images.length > 0 ? ` · ${run.images.length} imagem(ns)` : ""}
                    {run.contentId ? ` · ${run.contentId.toUpperCase()}` : ""}
                    {` · ${new Date(run.at).toLocaleDateString("pt-BR")}`}
                  </span>
                </span>
                <Button size="sm" onClick={() => router.push(`/esteira?abrir=${run.id}`)}>
                  Abrir na bancada
                </Button>
                <IconButton
                  icon={Trash2}
                  label={`Apagar "${run.title}"`}
                  size="sm"
                  variant="danger"
                  onClick={() => removeProduction(run.id)}
                />
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-ok" aria-hidden />
            <span className={labelClass}>
              Carrosséis no editor · n={drafts === null ? "…" : mine.length}
            </span>
          </span>

          {drafts === null ? null : mine.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-3.5 py-3 text-[12.5px] text-mut">
              Nenhum carrossel aberto no editor nesta frente.
            </p>
          ) : (
            mine.map((draft) => (
              <div
                key={draft.id}
                className={clsx(panelClass, "flex flex-wrap items-center gap-3 px-4 py-3.5")}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-[13px] font-medium text-ink">{draft.title}</span>
                  <span className={metaClass}>
                    {platformOptions.find((p) => p.id === draft.platform)?.label ?? draft.platform}
                    {" · "}
                    {draft.carousel.slides.length} slides
                    {" · "}
                    {new Date(draft.updatedAt).toLocaleDateString("pt-BR")}
                    {draft.costUsd !== undefined ? ` · ${formatCost(draft.costUsd).primary}` : ""}
                  </span>
                </span>
                <Button icon={PenLine} size="sm" onClick={() => openDraft(draft)}>
                  Abrir no editor
                </Button>
              </div>
            ))
          )}
        </div>
      </ShellPage>
    </EsteiraShell>
  );
}

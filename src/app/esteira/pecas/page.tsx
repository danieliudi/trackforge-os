"use client";

import { Check, PenLine, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { brandLabel } from "@/constants/brands";
import { EsteiraShell, ShellPage, useFront } from "@/components/app/EsteiraShell";
import { BlockHead, CellGrid, PageHead, Sheet } from "@/components/app/Interior";
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
  const frente = brandLabel(front);

  return (
    <EsteiraShell>
      <ShellPage>
        <PageHead secao={`Peças · ${frente}`} titulo="O que já foi produzido">
          Tudo que sai da bancada é salvo aqui sozinho, neste navegador.
        </PageHead>

        <CellGrid
          celulas={[
            { n: "01", valor: String(runs.length), rotulo: "da bancada" },
            {
              n: "02",
              valor: String(unsent),
              rotulo: "não enviados",
              // Invertida quando há o que enviar — é o que pede ação aqui.
              destaque: unsent > 0,
            },
            { n: "03", valor: String(sent), rotulo: "na fila do CRM" },
            {
              n: "04",
              valor: drafts === null ? "—" : String(mine.length),
              rotulo: "no editor",
            },
          ]}
        />

        <div className="flex flex-col gap-2">
          <BlockHead ponto={unsent > 0} nota="pagos, ainda na bancada">
            Da bancada · n={runs.length}
          </BlockHead>

          {runs.length === 0 ? (
            <p className="border-2 border-dashed border-rule px-4 py-6 text-center text-[15px] text-mut">
              Nada produzido nesta frente ainda.
            </p>
          ) : (
            <Sheet>
              {runs.map((run, i) => (
                <div
                  key={run.id}
                  className="grid grid-cols-[40px_1fr_auto] items-baseline gap-3 border-b border-dotted border-rule px-6 py-3.5 last:border-b-0"
                >
                  <span className="font-mono text-[11px] text-mut">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-baseline gap-2">
                      <span className="truncate text-[15.5px] font-medium text-ink">{run.title}</span>
                      {run.sent ? (
                        <span className="flex items-center gap-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-ok">
                          <Check size={11} />
                          na fila do CRM
                        </span>
                      ) : null}
                    </span>
                    {/* A frase é sans; só o `content_id` é mono, porque é o
                        identificador que a máquina escreveu (seção 4). */}
                    <span className="mt-1 block text-[11.5px] text-mut">
                      {run.article ? "artigo" : "sem artigo"}
                      {run.pieces.length > 0
                        ? ` · ${run.pieces.map((p) => OUTPUT_META[p.kind].label).join(", ")}`
                        : " · nenhuma peça ainda"}
                      {run.images.length > 0 ? ` · ${run.images.length} imagem(ns)` : ""}
                      {run.contentId ? (
                        <>
                          {" · "}
                          <span className="font-mono uppercase">{run.contentId}</span>
                        </>
                      ) : null}
                      {` · ${new Date(run.at).toLocaleDateString("pt-BR")}`}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
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
                  </span>
                </div>
              ))}
            </Sheet>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <BlockHead nota="rascunhos abertos, não peças enviadas">
            Carrosséis no editor · n={drafts === null ? "…" : mine.length}
          </BlockHead>

          {drafts === null ? null : mine.length === 0 ? (
            <p className="border-2 border-dashed border-rule px-4 py-6 text-center text-[15px] text-mut">
              Nenhum carrossel aberto no editor nesta frente.
            </p>
          ) : (
            <Sheet>
              {mine.map((draft, i) => (
                <div
                  key={draft.id}
                  className="grid grid-cols-[40px_1fr_auto] items-baseline gap-3 border-b border-dotted border-rule px-6 py-3.5 last:border-b-0"
                >
                  <span className="font-mono text-[11px] text-mut">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15.5px] font-medium text-ink">
                      {draft.title}
                    </span>
                    <span className="mt-1 block text-[11.5px] text-mut">
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
              ))}
            </Sheet>
          )}
        </div>
      </ShellPage>
    </EsteiraShell>
  );
}

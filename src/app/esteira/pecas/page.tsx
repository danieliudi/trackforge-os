"use client";

import clsx from "clsx";
import { Check, PenLine, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { EsteiraShell, ShellPage, useFront } from "@/components/app/EsteiraShell";
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
 * ANTES ESTA TELA MENTIA NO RÓTULO. Ela dizia "o que já foi montado" e listava
 * só rascunhos do editor de slides — porque a persistência do app nasceu para
 * o editor, quando peça era sinônimo de carrossel. Post de texto, legenda,
 * Reels, Stories e o artigo não apareciam aqui por um motivo pior que um bug de
 * listagem: não estavam salvos em lugar nenhum. O Daniel gerou peças, viu o
 * gasto no extrato e não encontrou o conteúdo.
 *
 * São duas listas de propósito, e não uma. Produção é o que saiu da bancada,
 * com artigo e peças juntos; rascunho é um carrossel aberto no editor, que tem
 * tema, logo e slides editados à mão. Misturar os dois numa lista só obrigaria
 * a inventar um denominador comum que não existe.
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

  const mine = (drafts ?? []).filter((draft) => draft.brandId === front);
  const runs = productions.filter((run) => run.brandId === front);

  return (
    <EsteiraShell>
      <ShellPage>
        <div className="flex flex-col gap-0.5">
          <span className={labelClass}>Peças</span>
          <h1 className="text-xl font-semibold tracking-tight text-ink">O que já foi produzido</h1>
          <p className="text-[13px] text-mut">
            Tudo que sai da bancada é salvo aqui sozinho, no seu navegador.
          </p>
        </div>

        <div className="mt-2 flex flex-col gap-2">
          <span className={labelClass}>Da bancada</span>

          {runs.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-3.5 py-3 text-[12.5px] text-mut">
              Nada produzido nesta frente ainda.
            </p>
          ) : (
            runs.map((run) => (
              <div
                key={run.id}
                className={clsx(panelClass, "flex flex-wrap items-center gap-3 px-3.5 py-3")}
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

        <div className="mt-3 flex flex-col gap-2">
          <span className={labelClass}>Carrosséis no editor</span>

          {drafts === null ? null : mine.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-3.5 py-3 text-[12.5px] text-mut">
              Nenhum carrossel aberto no editor nesta frente.
            </p>
          ) : (
            mine.map((draft) => (
              <div
                key={draft.id}
                className={clsx(panelClass, "flex flex-wrap items-center gap-3 px-3.5 py-3")}
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

"use client";

import clsx from "clsx";
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  FileText,
  Inbox,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ArticleReader } from "@/components/app/ArticleReader";
import { EsteiraShell, useFront } from "@/components/app/EsteiraShell";
import { CostReceipt } from "@/components/app/CostReceipt";
import { OutputPieces, type Piece } from "@/components/app/OutputPieces";
import { Steps } from "@/components/app/Steps";
import { VerificationPanel } from "@/components/app/VerificationPanel";
import { Button } from "@/components/ui/Button";
import { brandOptions } from "@/constants/brands";
import type { GenerationCost } from "@/constants/pricing";
import type { ForbiddenHit } from "@/knowledge/check";
import {
  entryFromCost,
  formatCost,
  getCostLogServerSnapshot,
  getCostLogSnapshot,
  pushCostEntry,
  subscribeCostLog,
} from "@/lib/costLog";
import type { MarketSignal } from "@/lib/marketSignals";
import { fieldClass, focusRing, labelClass, panelClass } from "@/lib/ui";
import type { Verification } from "@/lib/verify";
import { articleBlocks, articleToMarkdown, type Article } from "@/types/article";
import { OUTPUT_META, type OutputKind } from "@/types/outputs";
import { useSyncExternalStore } from "react";

/**
 * A esteira, do sinal à peça enviada.
 *
 * UMA TELA POR VEZ, e não um formulário longo: quem usa isto entra duas vezes
 * por semana, e a versão em página única — que existiu e foi descartada — pedia
 * que ele lesse tudo pra achar o que era a decisão do momento.
 *
 * A APROVAÇÃO NÃO ACONTECE AQUI, e o passo 4 diz isso com todas as letras. O
 * mockup mostrava os botões aprovar/ajustar/reprovar nesta tela; a decisão
 * posterior foi usar a fila que o CRM já tem, com histórico real, em vez de
 * criar uma segunda caixa de entrada pra mesma decisão. Aqui se confere e se
 * envia.
 */

type View = "painel" | 1 | 2 | 3 | 4;

const STEPS = [
  { n: 1, label: "Sinal" },
  { n: 2, label: "\u00c2ngulo" },
  { n: 3, label: "Formatos" },
  { n: 4, label: "Pe\u00e7as" },
];

type PendingPiece = {
  id: string;
  title: string;
  summary: string | null;
  priority: string;
};

function Tile({
  value,
  label,
  tone = "ink",
}: {
  value: string;
  label: string;
  tone?: "ink" | "money";
}) {
  return (
    <div className={clsx(panelClass, "flex flex-col gap-0.5 px-4 py-3.5")}>
      <span
        className={clsx(
          "text-2xl font-bold leading-none tracking-tight tabular-nums",
          tone === "money" ? "text-emerald-700" : "text-zinc-900",
        )}
      >
        {value}
      </span>
      <span className="text-xs leading-snug text-zinc-500">{label}</span>
    </div>
  );
}

export default function EsteiraPage() {
  const [brandId] = useFront();
  const [view, setView] = useState<View>("painel");

  // ── painel ──────────────────────────────────────────────
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [signalsReady, setSignalsReady] = useState(false);
  const [pending, setPending] = useState<PendingPiece[]>([]);
  const [crmReady, setCrmReady] = useState(false);

  const costEntries = useSyncExternalStore(
    subscribeCostLog,
    getCostLogSnapshot,
    getCostLogServerSnapshot,
  );
  const monthUsd = costEntries
    .filter((entry) => new Date(entry.at).getMonth() === new Date().getMonth())
    .reduce((total, entry) => total + entry.usd, 0);

  // ── fluxo ───────────────────────────────────────────────
  const [signalId, setSignalId] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [angle, setAngle] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [cost, setCost] = useState<GenerationCost | null>(null);
  const [warnings, setWarnings] = useState<ForbiddenHit[]>([]);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [pieces, setPieces] = useState<Piece[] | null>(null);
  const [kinds, setKinds] = useState<OutputKind[]>([]);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    void fetch("/api/signals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ brandId }),
    })
      .then((response) => response.json())
      .then((data) => {
        setSignalsReady(data.configured !== false);
        setSignals(data.signals ?? []);
      })
      .catch(() => setSignals([]));

    void fetch(`/api/publish?brandId=${brandId}`)
      .then((response) => response.json())
      .then((data) => {
        setCrmReady(data.configured === true);
        setPending(data.pending ?? []);
      })
      .catch(() => setCrmReady(false));
  }, [brandId]);

  // Agendado, como o resto do app: setState síncrono dentro do efeito encadeia
  // render antes da pintura.
  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const chosen = signals.find((signal) => signal.id === signalId) ?? null;
  const source = chosen?.title ?? topic.trim();

  const reset = () => {
    setSignalId(null);
    setTopic("");
    setAngle("");
    setArticle(null);
    setCost(null);
    setWarnings([]);
    setVerification(null);
    setPieces(null);
    setKinds([]);
    setSent(false);
    setError(null);
  };

  const write = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/generate/artigo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          input: angle.trim() || source,
          brandId,
          verify: true,
          signalIds: signalId ? [signalId] : undefined,
        }),
      });
      const data = await response.json();
      if (data.cost) {
        setCost(data.cost);
        pushCostEntry(
          entryFromCost(data.cost, "artigo", data.article?.title ?? source, !response.ok),
        );
      }
      if (!response.ok) throw new Error(data.error ?? "não foi possível escrever o artigo");

      setArticle(data.article);
      setWarnings(data.warnings ?? []);
      setVerification(data.verification ?? null);
      // O redator já disse o que o conteúdo sustenta; começa marcado no que ele
      // sugeriu, e a tela existe pra você discordar.
      setKinds((data.article.suggestedOutputs ?? []).map((s: { kind: OutputKind }) => s.kind));

      setView(3);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "erro desconhecido");
    } finally {
      setBusy(false);
    }
  }, [angle, source, brandId, signalId, setKinds]);

  const derive = useCallback(async () => {
    if (!article || kinds.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/derive", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ article, brandId, kinds }),
      });
      const data = await response.json();
      if (data.cost) {
        pushCostEntry(entryFromCost(data.cost, "derivacao", article.title, !response.ok));
      }
      if (!response.ok) throw new Error(data.error ?? "não foi possível gerar as peças");
      setPieces(data.pieces ?? []);
      setView(4);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "erro desconhecido");
    } finally {
      setBusy(false);
    }
  }, [article, brandId, kinds]);

  const send = useCallback(async () => {
    if (!article || !pieces) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          article,
          brandId,
          sourceLabel: chosen?.source ?? null,
          pieces: pieces.map((piece) => ({
            kind: piece.kind,
            data: piece.data,
            flagged: piece.verification?.flagged ?? 0,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "não foi possível enviar");
      setSent(true);
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "erro desconhecido");
    } finally {
      setBusy(false);
    }
  }, [article, pieces, brandId, chosen, load]);

  const markdown = article ? articleToMarkdown(article) : "";
  const blockLabels = article
    ? Object.fromEntries(articleBlocks(article).map((block) => [block.number, block.label]))
    : undefined;
  const flagged = pieces?.reduce((total, p) => total + (p.verification?.flagged ?? 0), 0) ?? 0;

  return (
    <EsteiraShell aside={view !== "painel" ? <Steps steps={STEPS} current={view} /> : null}>
          {error ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[12.5px] text-red-800">
              <AlertCircle size={14} className="mt-px shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {/* ══ PAINEL ══ */}
          {view === "painel" ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-0.5">
                <span className={labelClass}>Painel · {brandOptions.find((b) => b.id === brandId)?.label}</span>
                <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
                  O que precisa de você
                </h1>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-3">
                {crmReady ? (
                  <Tile value={String(pending.length)} label="esperando sua aprovação no CRM" />
                ) : null}
                <Tile value={String(signals.length)} label="sinais do setor disponíveis" />
                <Tile value={formatCost(monthUsd).primary} label="gasto no mês" tone="money" />
              </div>

              {pending.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <span className={labelClass}>Na fila do CRM</span>
                  {pending.map((item) => (
                    <div key={item.id} className={clsx(panelClass, "flex flex-col gap-1 px-3.5 py-3")}>
                      <span className="text-[13px] font-medium text-zinc-900">{item.title}</span>
                      {item.summary ? (
                        <span className="text-[11.5px] leading-snug text-zinc-500">{item.summary}</span>
                      ) : null}
                    </div>
                  ))}
                  <p className="text-[11.5px] text-zinc-400">
                    Aprovar ou reprovar acontece no CRM, onde fica o histórico.
                  </p>
                </div>
              ) : crmReady ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-3.5 py-3 text-[12.5px] text-zinc-500">
                  <Inbox size={14} className="shrink-0 text-zinc-400" />
                  Nada esperando você nesta frente.
                </div>
              ) : null}

              {/* Uma porta, duas saídas. A peça avulsa existe porque nem todo
                  post precisa de artigo — e é ela que antes vivia numa segunda
                  tela de entrada, competindo com esta. */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    reset();
                    setView(1);
                  }}
                >
                  Criar peça completa
                </Button>
                <Link
                  href="/esteira/avulso"
                  className={clsx(
                    "inline-flex h-11 items-center rounded-lg border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-800 transition hover:border-zinc-900",
                    focusRing,
                  )}
                >
                  Peça avulsa
                </Link>
              </div>
              <p className="text-[11.5px] text-zinc-400">
                Peça completa nasce de um artigo e tudo deriva dele. Avulsa sai
                direto de um tema, de um texto colado ou de um arquivo seu.
              </p>
            </div>
          ) : null}

          {/* ══ PASSO 1 — SINAL ══ */}
          {view === 1 ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
                  De onde parte a peça?
                </h1>
                <p className="text-[13px] text-zinc-500">
                  Escolha um sinal do setor, ou escreva um tema seu.
                </p>
              </div>

              {signalsReady && signals.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {signals.map((signal) => (
                    <button
                      key={signal.id}
                      type="button"
                      aria-pressed={signal.id === signalId}
                      onClick={() => {
                        setSignalId(signal.id);
                        setTopic("");
                      }}
                      className={clsx(
                        "rounded-lg border px-3.5 py-3 text-left transition",
                        focusRing,
                        signal.id === signalId
                          ? "border-zinc-900 bg-white"
                          : "border-zinc-200 bg-white hover:border-zinc-400",
                      )}
                    >
                      <span className="flex flex-col gap-1">
                        <span className="text-[13px] font-medium leading-snug text-zinc-900">
                          {signal.title}
                        </span>
                        <span className="font-mono text-[10px] text-zinc-400">
                          {signal.source} · {signal.urgency}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor="tema">
                  {signals.length > 0 ? "Ou um tema seu" : "Tema"}
                </label>
                <input
                  id="tema"
                  value={topic}
                  onChange={(event) => {
                    setTopic(event.target.value);
                    if (event.target.value) setSignalId(null);
                  }}
                  placeholder="O que muda com a revisão da ANTT 5.998"
                  className={fieldClass}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={() => setView("painel")}>Voltar</Button>
                <div className="flex-1" />
                <Button
                  variant="primary"
                  disabled={source.length < 3}
                  onClick={() => setView(2)}
                >
                  Continuar
                </Button>
              </div>
            </div>
          ) : null}

          {/* ══ PASSO 2 — ÂNGULO ══ */}
          {view === 2 ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
                  Qual é o ângulo?
                </h1>
                <p className="text-[13px] text-zinc-500">
                  Uma frase. É ela que orienta o artigo — e tudo deriva dele.
                </p>
              </div>

              <div className={clsx(panelClass, "px-3.5 py-3")}>
                <span className="font-mono text-[10px] uppercase tracking-wide text-zinc-400">
                  Partindo de
                </span>
                <p className="mt-1 text-[13px] leading-snug text-zinc-700">{source}</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor="angulo">
                  Ângulo
                </label>
                <textarea
                  id="angulo"
                  rows={3}
                  value={angle}
                  onChange={(event) => setAngle(event.target.value)}
                  placeholder="O que o gestor de SSMA precisa ter feito antes do prazo."
                  className={clsx(fieldClass, "resize-none")}
                />
                <p className="text-[11px] text-zinc-400">
                  Em branco, o artigo parte do próprio sinal.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={() => setView(1)}>Voltar</Button>
                <div className="flex-1" />
                <Button variant="primary" loading={busy} onClick={() => void write()}>
                  {busy ? "Escrevendo…" : "Escrever as peças"}
                </Button>
              </div>
            </div>
          ) : null}

          {/* ══ PASSO 3 — ESCRITA ══ */}
          {view === 3 && article ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
                  Que peças sair daqui?
                </h1>
                <p className="text-[13px] text-zinc-500">
                  Marcados são os que o artigo sustenta. Desmarque o que não quiser,
                  marque o que faltou.
                </p>
              </div>

              {cost ? <CostReceipt cost={cost} summary="Artigo" /> : null}
              {verification ? (
                <VerificationPanel verification={verification} labels={blockLabels} />
              ) : null}
              {warnings.length > 0 ? (
                <div className="flex flex-col gap-0.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-[12px] text-amber-900">
                  <span className="font-semibold">Termo proibido pela marca</span>
                  {warnings.map((hit, index) => (
                    <span key={index}>
                      “{hit.matched}” em {blockLabels?.[hit.blockNumber] ?? "—"} — {hit.reason}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-col gap-2">
                {(Object.keys(OUTPUT_META) as OutputKind[]).map((kind) => {
                  const meta = OUTPUT_META[kind];
                  const on = kinds.includes(kind);
                  const suggested = article.suggestedOutputs.find((s) => s.kind === kind);

                  return (
                    <label
                      key={kind}
                      className={clsx(
                        "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3.5 py-3 transition",
                        on ? "border-zinc-900 bg-white" : "border-zinc-200 bg-white hover:border-zinc-400",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() =>
                          setKinds((current) =>
                            current.includes(kind)
                              ? current.filter((k) => k !== kind)
                              : [...current, kind],
                          )
                        }
                        className={clsx("mt-0.5 h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900", focusRing)}
                      />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex flex-wrap items-baseline gap-2">
                          <span className="text-[13px] font-medium text-zinc-900">{meta.label}</span>
                          <span className="font-mono text-[10px] uppercase tracking-wide text-zinc-400">
                            {meta.platform}
                          </span>
                          {suggested ? (
                            <span className="rounded border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wide text-emerald-800">
                              sugerido
                            </span>
                          ) : null}
                        </span>
                        {/* A razão da sugestão fala deste conteúdo; a nota do
                            formato fala do formato. Quando há sugestão, ela ganha. */}
                        <span className="text-[11.5px] leading-snug text-zinc-500">
                          {suggested ? suggested.reason : meta.note}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={() => setView(2)}>Voltar</Button>
                <div className="flex-1" />
                <Button
                  variant="primary"
                  loading={busy}
                  disabled={kinds.length === 0}
                  onClick={() => void derive()}
                >
                  {busy
                    ? "Gerando…"
                    : `Gerar ${kinds.length} ${kinds.length === 1 ? "peça" : "peças"}`}
                </Button>
              </div>
            </div>
          ) : null}

          {view === 4 && article ? (
            <div className="flex flex-col gap-4">
              {sent ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-[13px] text-emerald-800">
                    <Check size={15} className="mt-px shrink-0" />
                    <span>
                      Na sua fila de aprovação no CRM. O artigo, as fontes e o parecer
                      foram junto — a agência não vê nada disso.
                    </span>
                  </div>
                  <div>
                    <Button
                      onClick={() => {
                        reset();
                        setView("painel");
                      }}
                    >
                      Voltar ao painel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-0.5">
                    <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
                      Confira antes de enviar
                    </h1>
                    <p className="text-[13px] text-zinc-500">
                      {flagged === 0
                        ? "Tudo que as peças afirmam está rastreado até o artigo."
                        : `${flagged} ${flagged === 1 ? "afirmação" : "afirmações"} sem fonte nas peças — dá pra enviar assim, mas você vai decidir sobre isso na aprovação.`}
                    </p>
                  </div>

                  {pieces ? <OutputPieces pieces={pieces} brandId={brandId} /> : null}

                  <div className={clsx(panelClass, "flex flex-col gap-4 p-5")}>
                    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 pb-3">
                      <Button
                        icon={copied ? Check : Copy}
                        size="sm"
                        onClick={() => {
                          void navigator.clipboard.writeText(markdown);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1800);
                        }}
                      >
                        {copied ? "Copiado" : "Copiar markdown"}
                      </Button>
                      <Button
                        icon={Download}
                        size="sm"
                        onClick={() => {
                          const blob = new Blob([markdown], {
                            type: "text/markdown;charset=utf-8",
                          });
                          const url = URL.createObjectURL(blob);
                          const anchor = document.createElement("a");
                          anchor.href = url;
                          anchor.download = `${article.title
                            .slice(0, 60)
                            .replace(/[^\p{L}\p{N}]+/gu, "-")
                            .toLowerCase()}.md`;
                          anchor.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        Baixar .md
                      </Button>
                    </div>
                    <ArticleReader article={article} />
                  </div>

                  <div className="flex items-center gap-2">
                        <Button onClick={() => setView(3)}>Voltar</Button>
                    <div className="flex-1" />
                    {crmReady ? (
                      <Button
                        icon={Send}
                        variant="primary"
                        loading={busy}
                        onClick={() => void send()}
                      >
                        {busy ? "Enviando…" : "Enviar para aprovação"}
                      </Button>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[11.5px] text-zinc-400">
                        <FileText size={13} />
                        CRM não configurado — baixe o .md
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : null}
    </EsteiraShell>
  );
}

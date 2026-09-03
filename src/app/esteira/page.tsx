"use client";

import clsx from "clsx";
import { AlertCircle, Check, Copy, Download, Inbox, Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ArticleImages } from "@/components/app/ArticleImages";
import { ArticleReader } from "@/components/app/ArticleReader";
import { CostReceipt } from "@/components/app/CostReceipt";
import { EsteiraShell, useFront } from "@/components/app/EsteiraShell";
import { OutputPieces, type Piece } from "@/components/app/OutputPieces";
import {
  emptyOrigin,
  MAX_CHARS,
  originIsMaterial,
  originLabel,
  originReady,
  OriginPicker,
  type Origin,
} from "@/components/app/OriginPicker";
import { VerificationPanel } from "@/components/app/VerificationPanel";
import { Button } from "@/components/ui/Button";
import type { GenerationCost } from "@/constants/pricing";
import type { ForbiddenHit } from "@/knowledge/check";
import { entryFromCost, pushCostEntry } from "@/lib/costLog";
import { getProduction, saveProduction, type Production } from "@/lib/produced";
import type { MarketSignal } from "@/lib/marketSignals";
import { fieldClass, focusRing, labelClass, metaClass, panelClass } from "@/lib/ui";
import type { Verification } from "@/lib/verify";
import { articleBlocks, articleToMarkdown, type Article, type ChosenImage } from "@/types/article";
import { OUTPUT_META, type OutputKind, type PieceFailure } from "@/types/outputs";

/**
 * A bancada: origem à esquerda, artigo no centro, saídas à direita.
 *
 * SUBSTITUI OS QUATRO PASSOS, e o motivo é o trabalho real: o que se faz aqui é
 * ler o artigo e decidir o que sai dele. Em passos, essas duas coisas nunca
 * estavam na mesma tela — para conferir uma afirmação antes de marcar um
 * formato era preciso voltar, e voltar perdia o lugar. Aqui o texto e a decisão
 * ficam lado a lado, e a peça pronta aparece ao lado do texto que a originou.
 *
 * AS QUATRO ORIGENS ENTRAM PELA MESMA PORTA. Arquivo era um tipo de peça na
 * versão anterior ("avulsa"), o que tornava impossível subir um relatório e
 * tirar dele o artigo completo — foi a primeira coisa que o Daniel procurou e
 * não achou. Origem é origem; o que muda entre elas é a regra factual, não a
 * tela.
 *
 * A APROVAÇÃO NÃO ACONTECE AQUI. A fila é a do CRM, que já tem histórico real.
 * Esta tela confere e envia.
 */

type PendingPiece = { id: string; title: string; summary: string | null; priority: string };

const column = "thin-scroll flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-4";

/**
 * A mensagem de erro da rota, com os campos reprovados quando houver.
 *
 * Sem os `issues` a tela diz "a IA devolveu o artigo fora das regras" e não diz
 * QUAL regra — e é justamente isso que decide entre clicar de novo e mexer no
 * prompt. As rotas já mandavam a lista; era a tela que a jogava fora.
 */
function messageOf(data: { error?: string; issues?: string[] }, fallback: string): string {
  const base = data.error ?? fallback;
  return data.issues && data.issues.length > 0 ? `${base} — ${data.issues.join("; ")}` : base;
}

export default function BancadaPage() {
  const [brandId] = useFront();

  const [origin, setOrigin] = useState<Origin>(emptyOrigin);
  const [angle, setAngle] = useState("");
  const [withArticle, setWithArticle] = useState(true);

  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [signalsReady, setSignalsReady] = useState(false);
  const [pending, setPending] = useState<PendingPiece[]>([]);
  const [crmReady, setCrmReady] = useState(false);

  const [busy, setBusy] = useState<"artigo" | "pecas" | "envio" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [cost, setCost] = useState<GenerationCost | null>(null);
  const [warnings, setWarnings] = useState<ForbiddenHit[]>([]);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [kinds, setKinds] = useState<OutputKind[]>([]);
  const [pieces, setPieces] = useState<Piece[] | null>(null);
  /** Peças que não saíram. Ficam no slot delas em vez de derrubar o lote. */
  const [failures, setFailures] = useState<PieceFailure[]>([]);
  const [retrying, setRetrying] = useState<OutputKind | null>(null);
  const [images, setImages] = useState<Record<string, ChosenImage>>({});
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  /** Id da produção em curso — a linha que vai sendo regravada a cada etapa. */
  const [runId, setRunId] = useState<string | null>(null);
  /** Reescrever descarta um artigo pago e paga outro: pede confirmação. */
  const [confirmarReescrita, setConfirmarReescrita] = useState(false);

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

  // Agendado: setState síncrono dentro do efeito encadeia render antes da pintura.
  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  // Reabrir uma produção salva. Lê da URL em vez de `useSearchParams` para não
  // exigir uma fronteira de Suspense só por causa disto.
  useEffect(() => {
    const timer = setTimeout(() => {
      const id = new URLSearchParams(window.location.search).get("abrir");
      if (!id) return;
      const run = getProduction(id);
      if (!run) return;

      setRunId(run.id);
      setArticle(run.article);
      setImages(Object.fromEntries(run.images.map((image) => [image.slot, image])));
      setKinds(run.pieces.map((piece) => piece.kind));
      setPieces(
        run.pieces.map((piece) => ({
          kind: piece.kind,
          data: piece.data,
          from: piece.from,
          warnings: [],
          // O parecer completo não é guardado — só quantas afirmações ficaram
          // sem fonte, que é o que muda a decisão de enviar. Reconstruir o
          // parecer inteiro exigiria pagar a auditoria de novo.
          verification: piece.flagged
            ? { flagged: piece.flagged, claims: [] }
            : null,
        })),
      );
      setSent(run.sent);
      // A origem volta inteira quando foi guardada. Produção antiga, gravada
      // antes de o campo existir, cai no rótulo — que é o que havia.
      setOrigin(
        (run.origin as Origin | undefined) ?? {
          mode: "tema",
          input: run.source,
          signalId: null,
          fileName: null,
        },
      );
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const source = originLabel(origin, signals);
  const material = originIsMaterial(origin.mode);
  const ready = originReady(origin);

  const reset = () => {
    // A produção anterior fica salva; o que se zera é a bancada.
    setRunId(null);
    setConfirmarReescrita(false);
    setWithArticle(true);
    setOrigin(emptyOrigin);
    setAngle("");
    setArticle(null);
    setCost(null);
    setWarnings([]);
    setVerification(null);
    setKinds([]);
    setPieces(null);
    setFailures([]);
    setImages({});
    setSent(false);
    setError(null);
  };

  /** O que a rota recebe como entrada, seja qual for a origem escolhida. */
  const inputFor = useCallback(
    () => (material ? origin.input : angle.trim() || source),
    [material, origin.input, angle, source],
  );

  /**
   * Grava o que já existe da produção. Chamado depois de cada etapa paga.
   *
   * `crypto.randomUUID()` mora aqui dentro e não no corpo do render: id novo a
   * cada render viola `react-hooks/purity` e criaria uma linha por repintura.
   */
  const keep = useCallback(
    (patch: Partial<Production>) => {
      const id = runId ?? crypto.randomUUID();
      if (!runId) setRunId(id);

      const previous = getProduction(id);
      saveProduction({
        id,
        at: Date.now(),
        brandId,
        source,
        origin,
        title: previous?.title ?? source,
        article: previous?.article ?? null,
        images: previous?.images ?? [],
        pieces: previous?.pieces ?? [],
        sent: previous?.sent ?? false,
        ...patch,
      });
      return id;
    },
    [runId, brandId, source, origin],
  );

  const write = useCallback(async () => {
    setBusy("artigo");
    setError(null);
    try {
      const response = await fetch("/api/generate/artigo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          input: inputFor(),
          // Com material, o ângulo vira contexto: o texto continua sendo a fonte.
          context: material && angle.trim() ? angle.trim() : undefined,
          brandId,
          verify: true,
          signalIds: origin.signalId ? [origin.signalId] : undefined,
        }),
      });
      const data = await response.json();
      if (data.cost) {
        setCost(data.cost);
        pushCostEntry(
          entryFromCost(data.cost, "artigo", data.article?.title ?? source, !response.ok),
        );
      }
      if (!response.ok) throw new Error(messageOf(data, "não foi possível escrever o artigo"));

      setArticle(data.article);
      setWarnings(data.warnings ?? []);
      setVerification(data.verification ?? null);
      setKinds((data.article.suggestedOutputs ?? []).map((s: { kind: OutputKind }) => s.kind));
      keep({ article: data.article, title: data.article.title });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "erro desconhecido");
    } finally {
      setBusy(null);
    }
  }, [inputFor, material, angle, brandId, origin.signalId, source, setKinds, keep]);

  /**
   * Pede os formatos à rota. Serve ao lote inteiro e a uma peça só.
   *
   * A rota devolve `pieces` e `failures` lado a lado: uma peça reprovada não
   * derruba as outras, então o resultado quase nunca é "tudo ou nada" e quem
   * chama precisa dos dois. Erro de verdade (rede, chave) continua sendo
   * exceção, e sobe.
   */
  const runPieces = useCallback(
    async (alvo: OutputKind[]) => {
      const response = article
        ? await fetch("/api/derive", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ article, brandId, kinds: alvo }),
          })
        : await fetch("/api/generate/avulso", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              mode: material ? "texto" : "tema",
              input: inputFor(),
              kinds: alvo,
              brandId,
              signalIds: origin.signalId ? [origin.signalId] : undefined,
            }),
          });

      const data = await response.json();
      const saiu: Piece[] = data.pieces ?? [];

      if (data.cost) {
        // `failed` só quando NADA saiu: com peça na mão, o gasto virou conteúdo.
        pushCostEntry(
          entryFromCost(
            data.cost,
            article ? "derivacao" : "avulso",
            article?.title ?? source,
            saiu.length === 0,
          ),
        );
      }
      if (!response.ok) throw new Error(messageOf(data, "não foi possível gerar as peças"));

      return { saiu, falhas: (data.failures ?? []) as PieceFailure[] };
    },
    [article, brandId, material, inputFor, origin.signalId, source],
  );

  /** Guarda no localStorage só o que sobreviveu — falha não é rascunho. */
  const keepPieces = useCallback(
    (lista: Piece[]) => {
      keep({
        pieces: lista.map((piece) => ({
          kind: piece.kind,
          data: piece.data,
          from: piece.from,
          flagged: piece.verification?.flagged ?? 0,
        })),
      });
    },
    [keep],
  );

  const generate = useCallback(async () => {
    if (kinds.length === 0) return;
    setBusy("pecas");
    setError(null);
    try {
      // Com artigo, as peças derivam dele. Sem artigo, saem direto da origem — e
      // a regra factual acompanha: material colado é fonte, tema não é.
      const { saiu, falhas } = await runPieces(kinds);
      setPieces(saiu);
      setFailures(falhas);
      keepPieces(saiu);

      // Nenhuma saiu: um aviso só, e não seis cartões vermelhos repetindo o
      // mesmo problema. Com peça na mão o slot vale; sem nenhuma, ele é ruído.
      if (saiu.length === 0 && falhas.length > 0) {
        setError(
          `Nenhuma das ${falhas.length} ${falhas.length === 1 ? "peça saiu" : "peças saiu"} — a IA devolveu tudo fora das regras. O gasto está no recibo.`,
        );
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "erro desconhecido");
    } finally {
      setBusy(null);
    }
  }, [kinds, runPieces, keepPieces]);

  /**
   * Refaz UMA peça, não o lote.
   *
   * A rota já aceita um formato só, então a segunda tentativa custa uma peça em
   * vez de seis — e as cinco que já estão prontas não são pagas de novo.
   */
  const retry = useCallback(
    async (kind: OutputKind) => {
      setRetrying(kind);
      setError(null);
      try {
        const { saiu, falhas } = await runPieces([kind]);

        const lista = [...(pieces ?? []).filter((p) => p.kind !== kind), ...saiu];
        setPieces(lista);
        keepPieces(lista);
        setFailures((atuais) => [...atuais.filter((f) => f.kind !== kind), ...falhas]);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "erro desconhecido");
      } finally {
        setRetrying(null);
      }
    },
    [runPieces, pieces, keepPieces],
  );

  const send = useCallback(async () => {
    if (!article || !pieces) return;
    setBusy("envio");
    setError(null);
    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          article,
          brandId,
          sourceLabel: source,
          images: Object.values(images),
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
      keep({ sent: true, images: Object.values(images) });
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "erro desconhecido");
    } finally {
      setBusy(null);
    }
  }, [article, pieces, brandId, source, images, load, keep]);

  const markdown = article ? articleToMarkdown(article, Object.values(images)) : "";
  const blockLabels = article
    ? Object.fromEntries(articleBlocks(article).map((block) => [block.number, block.label]))
    : undefined;

  return (
    <EsteiraShell
      aside={
        crmReady && pending.length > 0 ? (
          <span className="flex items-center gap-1.5 rounded-md border border-warn-line bg-warn-bg px-2.5 py-1 text-[11.5px] text-warn">
            <Inbox size={12} />
            {pending.length} esperando sua aprovação
          </span>
        ) : null
      }
    >
      <div className="grid h-full grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)_430px]">
        {/* ══ ORIGEM ══ */}
        <div className={clsx(column, "border-r border-line")}>
          <OriginPicker
            origin={origin}
            onChange={(next) => {
              setOrigin(next);
              setError(null);
            }}
            signals={signals}
            signalsReady={signalsReady}
          />

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="angulo">
              Ângulo
            </label>
            <textarea
              id="angulo"
              rows={2}
              value={angle}
              onChange={(event) => setAngle(event.target.value)}
              placeholder="O que o gestor de SSMA precisa ter feito antes do prazo."
              className={clsx(fieldClass, "resize-none")}
            />
          </div>

          <label className="flex cursor-pointer items-start gap-2 text-[12px] leading-snug text-mut">
            <input
              type="checkbox"
              checked={withArticle}
              onChange={() => setWithArticle((on) => !on)}
              className={clsx("mt-0.5 h-3.5 w-3.5 rounded border-line bg-canvas", focusRing)}
            />
            <span>
              Escrever o artigo antes
              <span className="block text-faint">
                {withArticle
                  ? "As peças derivam dele, e tudo que afirmam fica rastreado."
                  : "Peça direta, sem artigo por trás — mais barato, sem lastro comum."}
              </span>
            </span>
          </label>

          {withArticle ? (
            article && confirmarReescrita ? (
              /* O primeiro clique não gasta: ele explica o que o segundo faz.
                 O botão dizia "Reescrever o artigo" com o mesmo peso do
                 primeiro clique, e o artigo que se perde já foi pago. */
              <div className="flex flex-col gap-2 rounded-lg border border-warn-line bg-warn-bg p-3">
                <span className="text-[12px] leading-snug text-warn">
                  Isto descarta o artigo atual e paga uma nova geração. As peças
                  já geradas continuam salvas.
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    className="flex-1"
                    loading={busy === "artigo"}
                    onClick={() => {
                      setConfirmarReescrita(false);
                      void write();
                    }}
                  >
                    Reescrever
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmarReescrita(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="primary"
                className="w-full"
                loading={busy === "artigo"}
                disabled={!ready || origin.input.length > MAX_CHARS}
                onClick={() => (article ? setConfirmarReescrita(true) : void write())}
              >
                {busy === "artigo"
                  ? "Escrevendo…"
                  : article
                    ? "Reescrever o artigo"
                    : "Escrever o artigo"}
              </Button>
            )
          ) : (
            <p className="rounded-lg border border-line2 bg-surface px-3 py-2.5 text-[11.5px] leading-snug text-mut">
              {ready
                ? "Escolha os formatos à direita e gere direto."
                : "Escolha uma origem acima."}
            </p>
          )}

          {article || pieces ? (
            <Button variant="ghost" className="w-full" onClick={reset}>
              Começar de novo
            </Button>
          ) : null}

          {pending.length > 0 ? (
            <>
              <div className="mt-1 h-px bg-line2" />
              <span className={labelClass}>Na fila do CRM</span>
              {pending.map((item) => (
                <div key={item.id} className={clsx(panelClass, "px-3 py-2.5")}>
                  <span className="text-[12.5px] leading-snug text-ink2">{item.title}</span>
                </div>
              ))}
              <p className="text-[11px] text-faint">
                Aprovar ou reprovar acontece no CRM, onde fica o histórico.
              </p>
            </>
          ) : null}
        </div>

        {/* ══ ARTIGO ══ */}
        <div className={clsx(column, "bg-surface px-6")}>
          {error ? (
            <div className="flex items-start gap-2 rounded-lg border border-danger-line bg-danger-bg px-3.5 py-3 text-[12.5px] text-danger">
              <AlertCircle size={14} className="mt-px shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {article ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className={labelClass}>Artigo</span>
                <span className="flex-1" />
                <Button
                  icon={copied ? Check : Copy}
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(markdown);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1800);
                  }}
                >
                  {copied ? "Copiado" : "Copiar"}
                </Button>
                <Button
                  icon={Download}
                  size="sm"
                  onClick={() => {
                    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
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

              {cost ? <CostReceipt cost={cost} summary="Artigo" /> : null}
              {verification ? (
                <VerificationPanel verification={verification} labels={blockLabels} />
              ) : null}
              {warnings.length > 0 ? (
                <div className="flex flex-col gap-0.5 rounded-lg border border-warn-line bg-warn-bg px-3.5 py-3 text-[12px] text-warn">
                  <span className="font-semibold">Termo proibido pela marca</span>
                  {warnings.map((hit, index) => (
                    <span key={index}>
                      “{hit.matched}” em {blockLabels?.[hit.blockNumber] ?? "—"} — {hit.reason}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="pb-6 pt-1">
                <ArticleReader article={article} />
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="max-w-sm text-[13px] leading-relaxed text-mut">
                {ready
                  ? withArticle
                    ? "O artigo aparece aqui. Ele é a fonte factual de tudo que sair depois."
                    : "Sem artigo, as peças saem direto da origem. Escolha os formatos à direita."
                  : "Escolha uma origem à esquerda: um sinal do setor, um tema, um texto colado ou um arquivo seu."}
              </p>
              {material && origin.input ? (
                <p className="max-w-lg rounded-lg border border-line2 bg-surface p-4 text-left font-mono text-[11.5px] leading-relaxed text-faint">
                  {origin.input.slice(0, 400)}
                  {origin.input.length > 400 ? "…" : ""}
                </p>
              ) : null}
            </div>
          )}
        </div>

        {/* ══ SAÍDAS ══ */}
        <div className={clsx(column, "border-l border-line")}>
          <div className="flex items-baseline gap-2">
            <span className={labelClass}>Peças</span>
            <span className={metaClass}>
              {failures.length > 0
                ? pieces && pieces.length > 0
                  ? `${pieces.length} de ${pieces.length + failures.length} saíram`
                  : `nenhuma das ${failures.length} saiu`
                : `${kinds.length} de ${Object.keys(OUTPUT_META).length} marcadas`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(OUTPUT_META) as OutputKind[]).map((kind) => {
              const meta = OUTPUT_META[kind];
              const on = kinds.includes(kind);
              const falhou = failures.some((f) => f.kind === kind);
              const suggested = article?.suggestedOutputs.find((s) => s.kind === kind);

              return (
                <label
                  key={kind}
                  title={falhou ? "essa peça não saiu" : suggested ? suggested.reason : meta.note}
                  className={clsx(
                    "flex cursor-pointer items-start gap-2 rounded-lg border px-2.5 py-2 transition",
                    falhou
                      ? "border-danger-line bg-danger-bg"
                      : on
                        ? "border-acc bg-surface"
                        : "border-line2 bg-surface hover:border-line3",
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
                    className={clsx("mt-0.5 h-3.5 w-3.5 rounded border-line bg-canvas", focusRing)}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span
                      className={clsx(
                        "text-[12px] font-medium leading-tight",
                        falhou ? "text-danger" : "text-ink",
                      )}
                    >
                      {meta.label}
                    </span>
                    <span className={metaClass}>{meta.platform}</span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {failures.length > 0 ? (
              <span className={metaClass}>cada tentativa entra no recibo</span>
            ) : article ? (
              <span className={metaClass}>marcados = sugeridos pelo artigo</span>
            ) : null}
            <span className="flex-1" />
            <Button
              // Sem laranja depois que parte do lote saiu: preenchido é a ação
              // principal, e aqui ela convidaria a pagar de novo pelas prontas.
              variant={pieces || failures.length > 0 ? "secondary" : "primary"}
              size="sm"
              loading={busy === "pecas"}
              disabled={kinds.length === 0 || (!article && !ready)}
              onClick={() => void generate()}
            >
              {busy === "pecas"
                ? "Gerando…"
                : pieces || failures.length > 0
                  ? `Gerar ${kinds.length === 1 ? "de novo" : `as ${kinds.length} de novo`}`
                  : `Gerar ${kinds.length} ${kinds.length === 1 ? "peça" : "peças"}`}
            </Button>
          </div>

          {pieces && pieces.length > 0 ? (
            <>
              <div className="h-px bg-line2" />
              <OutputPieces
                pieces={pieces}
                failures={failures}
                retrying={retrying}
                onRetry={(kind) => void retry(kind)}
                brandId={brandId}
              />
            </>
          ) : null}

          {article ? (
            <>
              <div className="h-px bg-line2" />
              <ArticleImages
                ideas={article.imageIdeas}
                chosen={images}
                onChange={(next) => {
                  setImages(next);
                  keep({ images: Object.values(next) });
                }}
                brandId={brandId}
              />
            </>
          ) : null}

          {pieces && article ? (
            sent ? (
              <div className="flex items-start gap-2 rounded-lg border border-ok-line bg-ok-bg px-3 py-2.5 text-[12.5px] text-ok">
                <Check size={14} className="mt-px shrink-0" />
                <span>
                  Na sua fila de aprovação no CRM. O artigo, as fontes e o parecer foram junto — a
                  agência não vê nada disso.
                </span>
              </div>
            ) : crmReady ? (
              <Button
                icon={Send}
                variant="primary"
                className="w-full"
                loading={busy === "envio"}
                onClick={() => void send()}
              >
                {busy === "envio" ? "Enviando…" : "Enviar para aprovação"}
              </Button>
            ) : (
              <p className="text-[11.5px] text-faint">
                CRM não configurado — copie o texto ou baixe o .md.
              </p>
            )
          ) : null}
        </div>
      </div>
    </EsteiraShell>
  );
}

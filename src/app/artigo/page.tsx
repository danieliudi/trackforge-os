"use client";

import clsx from "clsx";
import { AlertCircle, ArrowLeft, Check, Copy, Download, FileText, GitBranch } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

import { BrandPills } from "@/components/app/BrandPills";
import { CostReceipt } from "@/components/app/CostReceipt";
import {
  DerivationChain,
  DerivedPieces,
  type DerivedPiece,
} from "@/components/app/DerivedPieces";
import { SignalPicker } from "@/components/app/SignalPicker";
import { VerificationPanel } from "@/components/app/VerificationPanel";
import { Button } from "@/components/ui/Button";
import type { BrandId } from "@/constants/brands";
import type { GenerationCost } from "@/constants/pricing";
import type { ForbiddenHit } from "@/knowledge/check";
import { entryFromCost, pushCostEntry } from "@/lib/costLog";
import { fieldClass, focusRing, labelClass, panelClass } from "@/lib/ui";
import type { Verification } from "@/lib/verify";
import {
  articleBlocks,
  articleToMarkdown,
  countWords,
  TARGET_WORDS,
  type Article,
} from "@/types/article";

type Step = 1 | 2 | 3;

const EXAMPLES = [
  "O que muda com a revisão da Resolução ANTT 5.998/2022",
  "Prazo da NBR 10.004:2024: o que fazer antes de 31/12",
  "Como escolher big bag certificado para resíduo perigoso",
];

/** Passo atual da esteira. A aprovação ainda não é passo — ela vem com o gate. */
function Steps({ current }: { current: Step }) {
  const steps = [
    { n: 1 as const, label: "Brief" },
    { n: 2 as const, label: "Artigo" },
    { n: 3 as const, label: "Peças" },
  ];

  return (
    <ol className="flex items-center gap-2">
      {steps.map(({ n, label }, index) => (
        <li key={n} className="flex items-center gap-2">
          {index > 0 ? <span className="h-px w-5 bg-zinc-200" aria-hidden /> : null}
          <span
            className={clsx(
              "flex items-center gap-1.5 text-[11.5px]",
              n === current ? "font-semibold text-zinc-900" : "text-zinc-400",
            )}
            aria-current={n === current ? "step" : undefined}
          >
            <span
              className={clsx(
                "grid h-[19px] w-[19px] place-items-center rounded-full border font-mono text-[10px]",
                n < current
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : n === current
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 text-zinc-400",
              )}
            >
              {n < current ? "✓" : n}
            </span>
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function ArticleReader({ article }: { article: Article }) {
  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 border-b border-zinc-200 pb-5">
        <h1 className="text-balance text-2xl font-semibold leading-tight tracking-tight text-zinc-900">
          {article.title}
        </h1>
        <p className="text-[15px] leading-relaxed text-zinc-600">{article.dek}</p>
        <p className="font-mono text-[10.5px] uppercase tracking-wide text-zinc-400">
          {article.targetAudience} · {countWords(article)} palavras
        </p>
      </header>

      {article.sections.map((section, index) => (
        <section key={`${section.heading}-${index}`} className="flex flex-col gap-2.5">
          <h2 className="text-[15px] font-semibold tracking-tight text-zinc-900">
            {section.heading}
          </h2>
          {section.paragraphs.map((paragraph, position) => (
            <p key={position} className="text-[14.5px] leading-[1.72] text-zinc-700">
              {paragraph}
            </p>
          ))}
        </section>
      ))}

      <section className="flex flex-col gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-4">
        <h2 className="text-[13px] font-semibold tracking-tight text-zinc-900">O que fazer</h2>
        <ul className="flex flex-col gap-1.5">
          {article.takeaways.map((takeaway, index) => (
            <li
              key={index}
              className="grid grid-cols-[auto_1fr] gap-2 text-[14px] leading-relaxed text-zinc-700"
            >
              <Check size={13} className="mt-[5px] shrink-0 text-emerald-600" />
              <span>{takeaway}</span>
            </li>
          ))}
        </ul>
      </section>

      {article.sources.length > 0 ? (
        <section className="flex flex-col gap-1.5 border-t border-zinc-200 pt-4">
          <span className={labelClass}>Fontes</span>
          <ul className="flex flex-col gap-1">
            {article.sources.map((source, index) => (
              <li key={index} className="text-[12.5px] leading-snug text-zinc-600">
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className={clsx("underline underline-offset-2 hover:text-zinc-900", focusRing)}
                  >
                    {source.label}
                  </a>
                ) : (
                  source.label
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

export default function ArtigoPage() {
  const [brandId, setBrandId] = useState<BrandId | null>("resibag");
  const [signalIds, setSignalIds] = useState<string[] | null>(null);
  const [input, setInput] = useState("");
  const [includeNews, setIncludeNews] = useState(false);
  const [verify, setVerify] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [cost, setCost] = useState<GenerationCost | null>(null);
  const [warnings, setWarnings] = useState<ForbiddenHit[]>([]);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [copied, setCopied] = useState(false);

  const [deriving, setDeriving] = useState(false);
  const [pieces, setPieces] = useState<DerivedPiece[] | null>(null);
  const [deriveCost, setDeriveCost] = useState<GenerationCost | null>(null);
  const [deriveError, setDeriveError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (input.trim().length < 3) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate/artigo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          input: input.trim(),
          includeNews,
          verify,
          brandId,
          signalIds: signalIds ?? undefined,
        }),
      });
      const data = await response.json();

      // O custo vem junto do erro de propósito: os tokens foram cobrados mesmo
      // quando a resposta não serviu, e é a geração que falhou que o usuário
      // menos deveria pagar sem saber.
      if (data.cost) {
        setCost(data.cost);
        pushCostEntry(
          entryFromCost(data.cost, "artigo", data.article?.title ?? input.trim(), !response.ok),
        );
      }
      if (!response.ok) throw new Error(data.error ?? "não foi possível gerar o artigo");

      setArticle(data.article);
      setWarnings(data.warnings ?? []);
      setVerification(data.verification ?? null);
      // Peça derivada de um artigo que não está mais na tela é pior que peça
      // nenhuma: ela parece conferida e não é.
      setPieces(null);
      setDeriveCost(null);
      setDeriveError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [input, includeNews, verify, brandId, signalIds]);

  const derive = useCallback(async () => {
    if (!article) return;
    setDeriving(true);
    setDeriveError(null);

    try {
      const response = await fetch("/api/derive", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ article, brandId }),
      });
      const data = await response.json();

      if (data.cost) {
        setDeriveCost(data.cost);
        pushCostEntry(
          entryFromCost(data.cost, "derivacao", article.title, !response.ok),
        );
      }
      if (!response.ok) throw new Error(data.error ?? "não foi possível derivar as peças");

      setPieces(data.pieces ?? []);
    } catch (caught) {
      setDeriveError(caught instanceof Error ? caught.message : "erro desconhecido");
    } finally {
      setDeriving(false);
    }
  }, [article, brandId]);

  const markdown = article ? articleToMarkdown(article) : "";

  const copy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const download = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${article?.title.slice(0, 60).replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase() ?? "artigo"}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  // O aviso cita a seção pelo título, não pelo número: é o que dá pra achar no texto.
  const blockLabels = article
    ? Object.fromEntries(articleBlocks(article).map((block) => [block.number, block.label]))
    : undefined;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
          <Link
            href="/"
            className={clsx(
              "flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs text-zinc-500 transition hover:text-zinc-900",
              focusRing,
            )}
          >
            <ArrowLeft size={14} />
            Carrossel
          </Link>
          <span className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-zinc-900">
            <FileText size={15} />
            Artigo
          </span>
          <div className="flex-1" />
          <Steps current={pieces ? 3 : article ? 2 : 1} />
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-6 lg:grid-cols-[21rem_1fr]">
        <div className="flex flex-col gap-5">
          <div className={clsx(panelClass, "flex flex-col gap-4 p-4")}>
            <div className="flex flex-col gap-2">
              <span className={labelClass}>Marca</span>
              <BrandPills value={brandId} onChange={setBrandId} />
            </div>

            <SignalPicker brandId={brandId} selected={signalIds} onChange={setSignalIds} />

            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor="tema">
                Tema ou URL
              </label>
              <textarea
                id="tema"
                rows={3}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="O que muda com a revisão da Resolução ANTT 5.998/2022"
                className={clsx(fieldClass, "resize-none")}
              />
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setInput(example)}
                    className={clsx(
                      "rounded border border-zinc-200 px-1.5 py-1 text-left text-[10.5px] leading-snug text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-900",
                      focusRing,
                    )}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-zinc-100 pt-3">
              <label className="flex items-center gap-2 text-[12px] text-zinc-600">
                <input
                  type="checkbox"
                  checked={verify}
                  onChange={(event) => setVerify(event.target.checked)}
                  className={clsx("h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900", focusRing)}
                />
                Conferir os fatos depois de escrever
              </label>
              <label className="flex items-center gap-2 text-[12px] text-zinc-600">
                <input
                  type="checkbox"
                  checked={includeNews}
                  onChange={(event) => setIncludeNews(event.target.checked)}
                  className={clsx("h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900", focusRing)}
                />
                Buscar notícias
                <span className="font-mono text-[10px] text-amber-700">custa por busca</span>
              </label>
            </div>

            <Button
              variant="primary"
              size="lg"
              loading={loading}
              disabled={input.trim().length < 3}
              onClick={() => void generate()}
            >
              {loading ? "Escrevendo…" : "Escrever artigo"}
            </Button>
          </div>

          {deriveCost ? (
            <CostReceipt cost={deriveCost} summary="Derivação · LinkedIn e Instagram" />
          ) : null}
          {cost ? (
            <CostReceipt
              cost={cost}
              summary={`Artigo · ${TARGET_WORDS.min}–${TARGET_WORDS.max} palavras`}
            />
          ) : null}
          {verification ? (
            <VerificationPanel verification={verification} labels={blockLabels} />
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          {error ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[12.5px] text-red-800">
              <AlertCircle size={14} className="mt-px shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {warnings.length > 0 ? (
            <div className="flex flex-col gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-[12.5px] text-amber-900">
              <span className="font-semibold">Termo proibido pela marca</span>
              {warnings.map((hit, index) => (
                <span key={index}>
                  “{hit.matched}” em {blockLabels?.[hit.blockNumber] ?? `bloco ${hit.blockNumber}`} — {hit.reason}
                </span>
              ))}
            </div>
          ) : null}

          {article ? (
            <div className={clsx(panelClass, "flex flex-col gap-5 p-6")}>
              <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 pb-4">
                <Button icon={copied ? Check : Copy} size="sm" onClick={() => void copy()}>
                  {copied ? "Copiado" : "Copiar markdown"}
                </Button>
                <Button icon={Download} size="sm" onClick={download}>
                  Baixar .md
                </Button>
                <div className="flex-1" />
                <span className="font-mono text-[10px] uppercase tracking-wide text-zinc-400">
                  entregue como documento
                </span>
              </div>
              <ArticleReader article={article} />
            </div>
          ) : (
            <div className="flex min-h-[22rem] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 px-6 text-center">
              <FileText size={22} className="text-zinc-300" />
              <p className="text-sm text-zinc-500">O artigo aparece aqui.</p>
              <p className="max-w-xs text-[12px] leading-relaxed text-zinc-400">
                Ele é a origem do ciclo: o post de LinkedIn e o de Instagram vão ser
                derivados dele, para não aparecer afirmação numa peça curta que não
                existe aqui.
              </p>
            </div>
          )}

          {article ? (
            <section className="flex flex-col gap-3">
              <DerivationChain done={Boolean(pieces)} />

              {deriveError ? (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[12.5px] text-red-800">
                  <AlertCircle size={14} className="mt-px shrink-0" />
                  <span>{deriveError}</span>
                </div>
              ) : null}

              {pieces ? (
                <DerivedPieces pieces={pieces} brandId={brandId} />
              ) : (
                <div className={clsx(panelClass, "flex flex-col gap-3 p-4")}>
                  <p className="text-[12.5px] leading-relaxed text-zinc-600">
                    O LinkedIn sai do artigo e o Instagram sai do LinkedIn — nessa
                    ordem, nunca os dois do zero. É o que impede uma afirmação de
                    aparecer na peça curta sem existir no artigo.
                  </p>
                  <Button
                    icon={GitBranch}
                    variant="primary"
                    loading={deriving}
                    onClick={() => void derive()}
                    className="self-start"
                  >
                    {deriving ? "Derivando…" : "Derivar LinkedIn e Instagram"}
                  </Button>
                </div>
              )}
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}

"use client";

import clsx from "clsx";
import { AlertCircle, FileText, Paperclip, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { CostReceipt } from "@/components/app/CostReceipt";
import { EsteiraShell, useFront } from "@/components/app/EsteiraShell";
import { OutputPieces, type Piece } from "@/components/app/OutputPieces";
import { Steps } from "@/components/app/Steps";
import { Button } from "@/components/ui/Button";
import type { GenerationCost } from "@/constants/pricing";
import { entryFromCost, pushCostEntry } from "@/lib/costLog";
import { fieldClass, focusRing, labelClass, panelClass } from "@/lib/ui";
import { OUTPUT_META, type OutputKind, type OutputSuggestion } from "@/types/outputs";

/**
 * A peça avulsa: um post só, sem artigo por trás.
 *
 * ELA EXISTE PARA O CASO EM QUE O TEXTO JÁ EXISTE. A esteira completa parte de
 * um sinal e escreve tudo; aqui o material pode já estar pronto — um relatório
 * interno, uma nota da diretoria, um .md que alguém escreveu — e o trabalho é
 * transformar aquilo em peça, não gerar assunto do zero. Daí os três modos de
 * entrada serem uma escolha explícita: tema, texto colado e arquivo NÃO são a
 * mesma coisa com roupas diferentes. Com tema, a IA inventa o recorte dentro da
 * base de fatos da marca. Com material, ela está proibida de sair dele.
 *
 * A SUGESTÃO SÓ APARECE QUANDO HÁ MATERIAL, e é de propósito: de um tema de uma
 * linha não dá pra dizer honestamente se o assunto sustenta um carrossel de oito
 * slides ou cabe num story — e um palpite com cara de recomendação é pior que
 * nenhuma recomendação.
 */

const STEPS = [
  { n: 1, label: "Origem" },
  { n: 2, label: "Formatos" },
  { n: 3, label: "Peças" },
];

type Mode = "tema" | "texto" | "arquivo";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "tema", label: "Tema", hint: "Uma frase. A IA escreve a partir da base de fatos da marca." },
  { id: "texto", label: "Texto colado", hint: "Cole o material. A peça sai dele e não pode sair dele." },
  { id: "arquivo", label: "Arquivo", hint: "Um .md ou .txt seu. Mesma regra do texto colado." },
];

/**
 * Teto do material.
 *
 * Não é limite técnico do modelo — é que o custo de leitura é proporcional ao
 * tamanho, e um documento de cem páginas colado inteiro vira uma conta alta pra
 * gerar um story de três telas. Cortar o trecho que interessa dá peça melhor e
 * mais barata; por isso o limite recusa em vez de truncar em silêncio.
 */
const MAX_CHARS = 40_000;

/** Abaixo disto não há material para julgar formato nem para lastrear peça. */
const MIN_MATERIAL = 200;

const ACCEPTED = /\.(md|markdown|txt|text)$/i;

const nf = new Intl.NumberFormat("pt-BR");

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export default function AvulsoPage() {
  const router = useRouter();
  const [brandId] = useFront();
  const [view, setView] = useState<1 | 2 | 3>(1);

  const [mode, setMode] = useState<Mode>("tema");
  const [topic, setTopic] = useState("");
  const [material, setMaterial] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [kinds, setKinds] = useState<OutputKind[]>([]);
  const [suggestions, setSuggestions] = useState<OutputSuggestion[] | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestedFor, setSuggestedFor] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pieces, setPieces] = useState<Piece[] | null>(null);
  const [cost, setCost] = useState<GenerationCost | null>(null);

  const fromMaterial = mode !== "tema";
  const source = fromMaterial ? material : topic.trim();
  const ready = fromMaterial ? material.trim().length >= MIN_MATERIAL : topic.trim().length >= 3;
  const title = fromMaterial ? (fileName ?? `${material.trim().slice(0, 60)}…`) : topic.trim();

  const readFile = useCallback(async (file: File) => {
    setFileError(null);

    if (!ACCEPTED.test(file.name)) {
      setFileError(
        "Por enquanto só .md e .txt. PDF e .docx a ferramenta não abre — salve como texto ou cole o conteúdo na aba ao lado.",
      );
      return;
    }

    const text = await file.text();

    if (text.length > MAX_CHARS) {
      setFileError(
        `O arquivo tem ${nf.format(text.length)} caracteres e o limite é ${nf.format(MAX_CHARS)}. Cole aqui só a parte que vira a peça — sai melhor e mais barato que o documento inteiro.`,
      );
      return;
    }
    if (text.trim().length < MIN_MATERIAL) {
      setFileError("O arquivo está praticamente vazio.");
      return;
    }

    setMaterial(text);
    setFileName(file.name);
  }, []);

  /** Lê o material e diz que peças ele sustenta — uma vez por material. */
  const suggest = useCallback(
    async (text: string) => {
      setSuggesting(true);
      try {
        const response = await fetch("/api/suggest-outputs", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ material: text, brandId }),
        });
        const data = await response.json();
        if (!response.ok) return;

        const suggested: OutputSuggestion[] = data.suggestions ?? [];
        setSuggestions(suggested);
        setSuggestedFor(text);
        // União, não substituição: se você marcou algo enquanto a leitura
        // rodava, a sugestão não desfaz a sua escolha.
        setKinds((current) =>
          Array.from(new Set([...current, ...suggested.map((item) => item.kind)])),
        );
      } catch {
        // Sem sugestão a tela continua funcionando: as notas de formato ficam.
      } finally {
        setSuggesting(false);
      }
    },
    [brandId],
  );

  const toFormats = useCallback(() => {
    setError(null);
    setView(2);
    if (fromMaterial && material.trim().length >= MIN_MATERIAL && suggestedFor !== material) {
      void suggest(material);
    }
  }, [fromMaterial, material, suggestedFor, suggest]);

  const generate = useCallback(async () => {
    if (kinds.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/generate/avulso", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: fromMaterial ? "texto" : "tema",
          input: source,
          kinds,
          brandId,
        }),
      });
      const data = await response.json();
      if (data.cost) {
        setCost(data.cost);
        pushCostEntry(entryFromCost(data.cost, "avulso", title, !response.ok));
      }
      if (!response.ok) throw new Error(data.error ?? "não foi possível gerar as peças");

      setPieces(data.pieces ?? []);
      setView(3);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "erro desconhecido");
    } finally {
      setBusy(false);
    }
  }, [kinds, fromMaterial, source, brandId, title]);

  const reset = () => {
    setTopic("");
    setMaterial("");
    setFileName(null);
    setFileError(null);
    setKinds([]);
    setSuggestions(null);
    setSuggestedFor(null);
    setPieces(null);
    setCost(null);
    setError(null);
    setView(1);
  };

  return (
    <EsteiraShell aside={<Steps steps={STEPS} current={view} />}>
      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[12.5px] text-red-800">
          <AlertCircle size={14} className="mt-px shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* ══ PASSO 1 — ORIGEM ══ */}
      {view === 1 ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <span className={labelClass}>Peça avulsa</span>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
              De onde sai esta peça?
            </h1>
            <p className="text-[13px] text-zinc-500">
              Um post só, sem artigo por trás. Se o texto já existe, ele é a fonte.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Origem do material">
              {MODES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={option.id === mode}
                  onClick={() => setMode(option.id)}
                  className={clsx(
                    "rounded-md border px-3 py-1.5 text-[13px] transition",
                    focusRing,
                    option.id === mode
                      ? "border-zinc-900 bg-white font-medium text-zinc-900"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-[11.5px] text-zinc-500">
              {MODES.find((option) => option.id === mode)?.hint}
            </p>
          </div>

          {mode === "tema" ? (
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="tema">
                Tema
              </label>
              <input
                id="tema"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Como escolher o big bag certo para resíduo classe I"
                className={fieldClass}
              />
              <p className="text-[11px] text-zinc-400">
                Pode ser uma URL — a ferramenta lê a página e usa como material.
              </p>
            </div>
          ) : null}

          {mode === "texto" ? (
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="material">
                Material
              </label>
              <textarea
                id="material"
                rows={12}
                value={material}
                onChange={(event) => {
                  setMaterial(event.target.value);
                  setFileName(null);
                }}
                placeholder="Cole aqui o texto que vira a peça — um relatório, uma nota, um trecho de norma."
                className={clsx(fieldClass, "resize-y font-mono text-[12.5px] leading-relaxed")}
              />
              <p
                className={clsx(
                  "text-[11px]",
                  material.length > MAX_CHARS ? "text-red-600" : "text-zinc-400",
                )}
              >
                {material.length === 0
                  ? `Até ${nf.format(MAX_CHARS)} caracteres.`
                  : `${nf.format(material.length)} caracteres · ${nf.format(countWords(material))} palavras${
                      material.length > MAX_CHARS ? ` — acima do limite de ${nf.format(MAX_CHARS)}` : ""
                    }`}
              </p>
            </div>
          ) : null}

          {mode === "arquivo" ? (
            <div className="flex flex-col gap-2">
              <span className={labelClass}>Arquivo</span>

              {fileName ? (
                <div className={clsx(panelClass, "flex flex-wrap items-center gap-3 px-3.5 py-3")}>
                  <FileText size={15} className="shrink-0 text-zinc-400" />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[13px] font-medium text-zinc-900">
                      {fileName}
                    </span>
                    <span className="font-mono text-[10.5px] text-zinc-400">
                      {nf.format(material.length)} caracteres · {nf.format(countWords(material))} palavras
                    </span>
                  </span>
                  <Button
                    icon={X}
                    size="sm"
                    onClick={() => {
                      setFileName(null);
                      setMaterial("");
                    }}
                  >
                    Trocar
                  </Button>
                </div>
              ) : (
                <label
                  className={clsx(
                    "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-4 py-7 text-center transition hover:border-zinc-500 focus-within:border-zinc-900",
                  )}
                >
                  <Paperclip size={16} className="text-zinc-400" />
                  <span className="text-[13px] font-medium text-zinc-800">
                    Escolher arquivo .md ou .txt
                  </span>
                  <span className="text-[11.5px] text-zinc-500">
                    O conteúdo é lido no seu navegador e vira a fonte da peça.
                  </span>
                  <input
                    type="file"
                    accept=".md,.markdown,.txt,.text,text/markdown,text/plain"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      // Zera o valor pra escolher o MESMO arquivo de novo, depois
                      // de corrigi-lo, ainda disparar o onChange.
                      event.target.value = "";
                      if (file) void readFile(file);
                    }}
                  />
                </label>
              )}

              {fileError ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] leading-snug text-amber-900">
                  {fileError}
                </p>
              ) : null}

              {fileName ? (
                <details className="text-[12px] text-zinc-500">
                  <summary className={clsx("cursor-pointer select-none", focusRing)}>
                    Ver o que foi lido
                  </summary>
                  <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-md border border-zinc-200 bg-zinc-50 p-3 font-mono text-[11.5px] leading-relaxed text-zinc-600">
                    {material.slice(0, 2000)}
                    {material.length > 2000 ? "\n…" : ""}
                  </pre>
                </details>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <Button onClick={() => router.push("/esteira")}>Voltar</Button>
            <div className="flex-1" />
            <Button
              variant="primary"
              disabled={!ready || material.length > MAX_CHARS}
              onClick={toFormats}
            >
              Continuar
            </Button>
          </div>
        </div>
      ) : null}

      {/* ══ PASSO 2 — FORMATOS ══ */}
      {view === 2 ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
              Que peças sair daqui?
            </h1>
            <p className="text-[13px] text-zinc-500">
              {fromMaterial
                ? "Marcados são os que o material sustenta. Desmarque o que não quiser, marque o que faltou."
                : "Escolha os formatos. De um tema de uma linha a ferramenta não arrisca sugerir."}
            </p>
          </div>

          <div className={clsx(panelClass, "flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3.5 py-3")}>
            <span className="font-mono text-[10px] uppercase tracking-wide text-zinc-400">
              Partindo de
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-zinc-700">
              {fromMaterial ? (fileName ?? "texto colado") : topic.trim()}
            </span>
            {fromMaterial ? (
              <span className="font-mono text-[10.5px] text-zinc-400">
                {nf.format(countWords(material))} palavras
              </span>
            ) : null}
          </div>

          {suggesting ? (
            <p className="flex items-center gap-1.5 text-[12px] text-zinc-500">
              <Sparkles size={13} className="text-zinc-400" />
              Lendo o material para sugerir formatos…
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            {(Object.keys(OUTPUT_META) as OutputKind[]).map((kind) => {
              const meta = OUTPUT_META[kind];
              const on = kinds.includes(kind);
              const suggested = suggestions?.find((item) => item.kind === kind);

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
                          ? current.filter((item) => item !== kind)
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
                    <span className="text-[11.5px] leading-snug text-zinc-500">
                      {suggested ? suggested.reason : meta.note}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => setView(1)}>Voltar</Button>
            <div className="flex-1" />
            <Button
              variant="primary"
              loading={busy}
              disabled={kinds.length === 0}
              onClick={() => void generate()}
            >
              {busy ? "Gerando…" : `Gerar ${kinds.length} ${kinds.length === 1 ? "peça" : "peças"}`}
            </Button>
          </div>
        </div>
      ) : null}

      {/* ══ PASSO 3 — PEÇAS ══ */}
      {view === 3 && pieces ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
              Pronto
            </h1>
            <p className="text-[13px] text-zinc-500">
              {fromMaterial
                ? "Tudo que as peças afirmam foi conferido contra o material que você deu."
                : "As peças foram conferidas contra a base de fatos da marca."}
            </p>
          </div>

          {cost ? <CostReceipt cost={cost} summary="Peça avulsa" /> : null}

          <OutputPieces pieces={pieces} brandId={brandId} />

          <div className="flex items-center gap-2">
            <Button onClick={() => setView(2)}>Voltar aos formatos</Button>
            <div className="flex-1" />
            <Button variant="primary" onClick={reset}>
              Nova peça avulsa
            </Button>
          </div>
        </div>
      ) : null}
    </EsteiraShell>
  );
}

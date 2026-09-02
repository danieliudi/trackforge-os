"use client";

import clsx from "clsx";
import { FileText, Paperclip, X } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/Button";
import type { MarketSignal } from "@/lib/marketSignals";
import { fieldClass, focusRing, labelClass, metaClass, panelClass } from "@/lib/ui";

/**
 * De onde a peça parte — sinal, tema, texto colado ou arquivo.
 *
 * AS QUATRO SÃO A MESMA COISA: uma origem. A versão anterior tratava arquivo
 * como um tipo de peça ("peça avulsa") e não como uma origem, então subir um
 * relatório e tirar dele o artigo completo era impossível — o arquivo só
 * servia para post solto. Foi a primeira coisa que o Daniel procurou e não
 * achou. Aqui as quatro entram pela mesma porta e alimentam o mesmo fluxo.
 *
 * A DIFERENÇA QUE PERMANECE é factual, não de interface: com texto ou arquivo
 * o material é a fonte e a auditoria confere contra ele; com sinal ou tema a
 * fonte é a base de fatos da marca. Isso é decidido no `mode` enviado à rota,
 * não em telas separadas.
 */

export type OriginMode = "sinal" | "tema" | "texto" | "arquivo";

export type Origin = {
  mode: OriginMode;
  /** Tema digitado, material colado ou conteúdo do arquivo. */
  input: string;
  signalId: string | null;
  fileName: string | null;
};

export const emptyOrigin: Origin = { mode: "sinal", input: "", signalId: null, fileName: null };

/** Rótulo curto da origem, para mostrar ao lado da peça pronta. */
export function originLabel(origin: Origin, signals: MarketSignal[]): string {
  if (origin.mode === "sinal") {
    return signals.find((s) => s.id === origin.signalId)?.title ?? "sinal do setor";
  }
  if (origin.mode === "arquivo") return origin.fileName ?? "arquivo";
  if (origin.mode === "texto") return "texto colado";
  return origin.input.trim();
}

/** Material colado conta como fonte; tema e sinal, não. */
export const originIsMaterial = (mode: OriginMode) => mode === "texto" || mode === "arquivo";

/**
 * Teto do material. Não é limite do modelo — é que o custo de leitura é
 * proporcional ao tamanho, e um documento inteiro colado para gerar três telas
 * de story vira conta alta. Recusa em vez de truncar em silêncio: corte
 * invisível deixaria de fora justamente a parte que importava.
 */
export const MAX_CHARS = 40_000;
const MIN_MATERIAL = 200;
const ACCEPTED = /\.(md|markdown|txt|text)$/i;

const nf = new Intl.NumberFormat("pt-BR");
const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

const MODES: { id: OriginMode; label: string }[] = [
  { id: "sinal", label: "Sinal" },
  { id: "tema", label: "Tema" },
  { id: "texto", label: "Texto" },
  { id: "arquivo", label: "Arquivo" },
];

export function originReady(origin: Origin): boolean {
  if (origin.mode === "sinal") return origin.signalId !== null;
  if (origin.mode === "tema") return origin.input.trim().length >= 3;
  return origin.input.trim().length >= MIN_MATERIAL && origin.input.length <= MAX_CHARS;
}

export function OriginPicker({
  origin,
  onChange,
  signals,
  signalsReady,
}: {
  origin: Origin;
  onChange: (origin: Origin) => void;
  signals: MarketSignal[];
  signalsReady: boolean;
}) {
  const [fileError, setFileError] = useState<string | null>(null);

  const readFile = useCallback(
    async (file: File) => {
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
          `O arquivo tem ${nf.format(text.length)} caracteres e o limite é ${nf.format(MAX_CHARS)}. Cole só a parte que vira a peça — sai melhor e mais barato.`,
        );
        return;
      }
      if (text.trim().length < MIN_MATERIAL) {
        setFileError("O arquivo está praticamente vazio.");
        return;
      }
      onChange({ mode: "arquivo", input: text, signalId: null, fileName: file.name });
    },
    [onChange],
  );

  return (
    <div className="flex flex-col gap-3">
      <span className={labelClass}>Origem</span>

      <div
        className="flex gap-0.5 rounded-lg border border-line bg-surface2 p-0.5"
        role="group"
        aria-label="Origem do material"
      >
        {MODES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={id === origin.mode}
            onClick={() => onChange({ ...emptyOrigin, mode: id })}
            className={clsx(
              "flex-1 rounded-md px-2 py-1.5 text-[12.5px] transition",
              focusRing,
              id === origin.mode
                ? "bg-acc font-semibold text-acc-ink"
                : "text-mut hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {origin.mode === "sinal" ? (
        signalsReady && signals.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {signals.map((signal) => (
              <button
                key={signal.id}
                type="button"
                aria-pressed={signal.id === origin.signalId}
                onClick={() =>
                  onChange({ mode: "sinal", input: "", signalId: signal.id, fileName: null })
                }
                className={clsx(
                  "rounded-lg border px-3 py-2.5 text-left transition",
                  focusRing,
                  signal.id === origin.signalId
                    ? "border-acc bg-surface"
                    : "border-line2 bg-surface hover:border-line3",
                )}
              >
                <span className="flex flex-col gap-1">
                  <span className="text-[12.5px] font-medium leading-snug text-ink2">
                    {signal.title}
                  </span>
                  <span className={metaClass}>
                    {signal.source} · {signal.urgency}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-[12px] text-mut">
            {signalsReady ? "Nenhum sinal nesta frente." : "CRM não configurado."}
          </p>
        )
      ) : null}

      {origin.mode === "tema" ? (
        <div className="flex flex-col gap-1.5">
          <input
            id="tema"
            value={origin.input}
            onChange={(event) =>
              onChange({ mode: "tema", input: event.target.value, signalId: null, fileName: null })
            }
            placeholder="O que muda com a revisão da ANTT 5.998"
            className={fieldClass}
          />
          <p className="text-[11px] text-faint">Pode ser uma URL — a página vira o material.</p>
        </div>
      ) : null}

      {origin.mode === "texto" ? (
        <div className="flex flex-col gap-1.5">
          <textarea
            id="material"
            rows={9}
            value={origin.input}
            onChange={(event) =>
              onChange({ mode: "texto", input: event.target.value, signalId: null, fileName: null })
            }
            placeholder="Cole aqui o texto que vira a peça — um relatório, uma nota, um trecho de norma."
            className={clsx(fieldClass, "resize-y font-mono text-[12px] leading-relaxed")}
          />
          <p
            className={clsx(
              "text-[11px]",
              origin.input.length > MAX_CHARS ? "text-danger" : "text-faint",
            )}
          >
            {origin.input.length === 0
              ? `Até ${nf.format(MAX_CHARS)} caracteres.`
              : `${nf.format(origin.input.length)} caracteres · ${nf.format(countWords(origin.input))} palavras${
                  origin.input.length > MAX_CHARS ? " — acima do limite" : ""
                }`}
          </p>
        </div>
      ) : null}

      {origin.mode === "arquivo" ? (
        <div className="flex flex-col gap-2">
          {origin.fileName ? (
            <div className={clsx(panelClass, "flex items-center gap-2.5 px-3 py-2.5")}>
              <FileText size={15} className="shrink-0 text-faint" />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[12.5px] font-medium text-ink">
                  {origin.fileName}
                </span>
                <span className={metaClass}>
                  {nf.format(origin.input.length)} caracteres · {nf.format(countWords(origin.input))}{" "}
                  palavras
                </span>
              </span>
              <Button
                icon={X}
                size="sm"
                variant="ghost"
                onClick={() => onChange({ ...emptyOrigin, mode: "arquivo" })}
              >
                Trocar
              </Button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-6 text-center transition hover:border-line3 focus-within:border-acc">
              <Paperclip size={16} className="text-faint" />
              <span className="text-[12.5px] font-medium text-ink2">
                Escolher arquivo .md ou .txt
              </span>
              <span className="text-[11.5px] text-mut">
                Lido no seu navegador. Vira a fonte factual da peça.
              </span>
              <input
                type="file"
                accept=".md,.markdown,.txt,.text,text/markdown,text/plain"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  // Zera para que escolher o MESMO arquivo de novo, depois de
                  // corrigi-lo, ainda dispare o onChange.
                  event.target.value = "";
                  if (file) void readFile(file);
                }}
              />
            </label>
          )}

          {fileError ? (
            <p className="rounded-lg border border-warn-line bg-warn-bg px-3 py-2.5 text-[11.5px] leading-snug text-warn">
              {fileError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

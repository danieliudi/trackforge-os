"use client";

import clsx from "clsx";
import { CornerDownLeft, Link2, Loader2, RefreshCw, RotateCw, Sparkles } from "lucide-react";
import { useEffect, useState, type KeyboardEvent } from "react";

import { BrandPills } from "@/components/app/BrandPills";
import { Button, IconButton } from "@/components/ui/Button";
import type { BrandId } from "@/constants/brands";
import { fieldClass, focusRing, kbdClass, labelClass } from "@/lib/ui";

/**
 * Briefs de exemplo do estado vazio.
 *
 * A tela vazia dizia só "O preview aparece aqui depois da geração" — não
 * ensinava o formato aceito nem que uma URL serve como entrada. Um clique
 * aqui preenche o campo e mostra os dois modos de uso.
 */
const EXAMPLES = [
  {
    icon: Link2,
    text: "https://www.sanwey.com.br/global/tem-duvidas-de-quais-produtos-podemos-transportar-em-um-sanbag-o-big-bag-da-sanwey/",
  },
  { icon: Sparkles, text: "Reduzir custo logístico na indústria química" },
  { icon: Sparkles, text: "Como escolher big bag certificado para resíduo perigoso" },
  { icon: Sparkles, text: "5 erros no descarte de resíduo industrial" },
];

const MIN_LENGTH = 3;

/**
 * Segundos desde o início da geração.
 *
 * A chamada de LLM leva dezenas de segundos e o único sinal era um spinner,
 * que não distingue "trabalhando" de "travado". Contador real em vez de barra
 * de progresso falsa: a API não reporta etapas, então inventar percentual
 * seria mentira.
 */
function useElapsed(isRunning: boolean) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const started = Date.now();
    const timer = setInterval(
      () => setSeconds(Math.floor((Date.now() - started) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, [isRunning]);

  return isRunning ? seconds : 0;
}

/**
 * Temas sugeridos pela IA a partir do contexto de marca salvo.
 *
 * Sem contexto, os EXAMPLES fixos continuam valendo — essa seção só existe
 * quando há contexto pra ancorar a sugestão em algo real da marca.
 */
function SuggestionsSection({
  context,
  onPick,
}: {
  context: string;
  onPick: (text: string) => void;
}) {
  const [topics, setTopics] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function fetchSuggestions() {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/generate/suggestions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ context }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error();
      setTopics(data.topics);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(fetchSuggestions, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só busca de novo no clique do refresh, não a cada tecla no contexto
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className={labelClass}>Sugestões da IA</span>
        <IconButton
          icon={loading ? Loader2 : RotateCw}
          label="Gerar novas sugestões"
          size="sm"
          loading={loading}
          onClick={fetchSuggestions}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        {error ? (
          <p className="text-xs text-red-600">Falha ao sugerir temas.</p>
        ) : !loading && topics ? (
          topics.map((text) => (
            <button
              key={text}
              type="button"
              onClick={() => onPick(text)}
              className={clsx(
                "flex items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left text-sm text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900",
                focusRing,
              )}
            >
              <Sparkles size={14} className="shrink-0 text-zinc-400" />
              <span className="truncate">{text}</span>
            </button>
          ))
        ) : null}
      </div>
    </div>
  );
}

function NewsToggleRow({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-zinc-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className={clsx("h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900", focusRing)}
      />
      Incluir notícias recentes do setor
    </label>
  );
}

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  /** "hero" é a tela de entrada; "compact" fica fixo no topo do editor. */
  variant: "hero" | "compact";
  brandId?: BrandId | null;
  onBrandChange?: (id: BrandId | null) => void;
  /** Contexto estratégico da marca ativa — alimenta as sugestões de tema. */
  brandContext?: string;
  includeNews?: boolean;
  onIncludeNewsChange?: (value: boolean) => void;
};

export function Composer({
  value,
  onChange,
  onSubmit,
  isGenerating,
  variant,
  brandId,
  onBrandChange,
  brandContext,
  includeNews,
  onIncludeNewsChange,
}: ComposerProps) {
  const canSubmit = value.trim().length >= MIN_LENGTH && !isGenerating;
  const elapsed = useElapsed(isGenerating);

  // Enter quebra linha (o brief pode ser um parágrafo); Cmd/Ctrl+Enter envia.
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && canSubmit) {
      event.preventDefault();
      onSubmit();
    }
  }

  if (variant === "compact") {
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor="brief-compact" className={labelClass}>
          Regerar a partir de outro brief
        </label>
        <textarea
          id="brief-compact"
          rows={2}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://... ou um tema"
          className={clsx(fieldClass, "resize-y")}
        />
        {onIncludeNewsChange ? (
          <NewsToggleRow
            checked={includeNews ?? false}
            onChange={onIncludeNewsChange}
          />
        ) : null}
        <Button
          variant="primary"
          icon={RefreshCw}
          loading={isGenerating}
          disabled={!canSubmit}
          onClick={onSubmit}
          className="w-full"
        >
          {isGenerating ? "Gerando..." : "Gerar novamente"}
        </Button>
        <p className="text-[11px] text-zinc-500">
          Substitui todos os slides. Dá para desfazer com{" "}
          <kbd className={kbdClass}>Ctrl</kbd> <kbd className={kbdClass}>Z</kbd>.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-7 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Gere um carrossel B2B
        </h1>
        <p className="text-sm leading-relaxed text-zinc-600">
          Cole a URL de um artigo ou descreva o tema. A IA monta a sequência
          completa — capa, slides de conteúdo e CTA — e você edita cada texto
          antes de exportar em PDF ou PNG.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <textarea
          id="brief"
          rows={3}
          autoFocus
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://... ou: reduzir custo logístico na indústria"
          className={clsx(fieldClass, "resize-y px-4 py-3 text-base")}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1 text-[11px] text-zinc-500">
            <kbd className={kbdClass}>Ctrl</kbd>
            <CornerDownLeft size={11} />
            para gerar
          </span>
          <Button
            variant="primary"
            size="lg"
            icon={Sparkles}
            loading={isGenerating}
            disabled={!canSubmit}
            onClick={onSubmit}
          >
            {isGenerating ? "Gerando carrossel..." : "Gerar carrossel"}
          </Button>
        </div>
        {onIncludeNewsChange ? (
          <NewsToggleRow
            checked={includeNews ?? false}
            onChange={onIncludeNewsChange}
          />
        ) : null}
      </div>

      {isGenerating ? (
        <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-zinc-700" />
          </span>
          <p className="flex-1 text-xs leading-relaxed text-zinc-600">
            Montando capa, slides de conteúdo e CTA.{" "}
            {includeNews
              ? "Com busca de notícias, costuma levar de 40 a 80 segundos."
              : "Costuma levar de 10 a 30 segundos."}
          </p>
          <span className="shrink-0 text-xs tabular-nums text-zinc-500">
            {elapsed}s
          </span>
        </div>
      ) : null}

      {brandContext?.trim() ? (
        <SuggestionsSection context={brandContext} onPick={onChange} />
      ) : (
        <div className="flex flex-col gap-2">
          <span className={labelClass}>Comece por um exemplo</span>
          <div className="flex flex-col gap-1.5">
            {EXAMPLES.map(({ icon: Icon, text }) => (
              <button
                key={text}
                type="button"
                onClick={() => onChange(text)}
                className="flex items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left text-sm text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
              >
                <Icon size={14} className="shrink-0 text-zinc-400" />
                <span className="truncate">{text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {onBrandChange ? (
        <div className="flex flex-col gap-2 border-t border-zinc-200 pt-6">
          <span className={labelClass}>Marca (define o tema visual)</span>
          <BrandPills value={brandId ?? null} onChange={onBrandChange} />
        </div>
      ) : null}
    </div>
  );
}

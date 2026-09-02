"use client";

import clsx from "clsx";
import { CornerDownLeft, Link2, Loader2, RefreshCw, RotateCw, Sparkles } from "lucide-react";
import { useEffect, useState, type KeyboardEvent } from "react";

import { BrandPills } from "@/components/app/BrandPills";
import { FormatSelect } from "@/components/app/FormatSelect";
import { PlatformPills } from "@/components/app/PlatformPills";
import { SignalPicker } from "@/components/app/SignalPicker";
import { Button, IconButton } from "@/components/ui/Button";
import type { BrandId } from "@/constants/brands";
import { getPlatformToneNote, type Format, type Platform } from "@/constants/format";
import type { GenerationCost } from "@/constants/pricing";
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
  brandId,
  onPick,
  onCost,
}: {
  context: string;
  brandId?: BrandId | null;
  onPick: (text: string) => void;
  onCost?: (cost: GenerationCost) => void;
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
        body: JSON.stringify({ context, brandId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error();
      if (data.cost) onCost?.(data.cost as GenerationCost);
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
          <p className="text-xs text-danger">Falha ao sugerir temas.</p>
        ) : !loading && topics ? (
          topics.map((text) => (
            <button
              key={text}
              type="button"
              onClick={() => onPick(text)}
              className={clsx(
                "flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 text-left text-sm text-ink2 transition hover:border-line3 hover:text-ink",
                focusRing,
              )}
            >
              <Sparkles size={14} className="shrink-0 text-faint" />
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
    <label className="flex items-center gap-2 text-xs text-mut">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className={clsx("h-3.5 w-3.5 rounded border-line text-ink", focusRing)}
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
  format?: Format;
  onFormatChange?: (format: Format) => void;
  platform?: Platform;
  onPlatformChange?: (platform: Platform) => void;
  /** Sugestão de tema também é chamada paga — entra no extrato como as outras. */
  onSuggestionsCost?: (cost: GenerationCost) => void;
  /** null = ainda não escolheu; o picker marca tudo no primeiro carregamento. */
  signalIds?: string[] | null;
  onSignalIdsChange?: (ids: string[]) => void;
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
  format,
  onFormatChange,
  platform,
  onPlatformChange,
  onSuggestionsCost,
  signalIds,
  onSignalIdsChange,
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
        <p className="text-[11px] text-mut">
          Substitui todos os slides. Dá para desfazer com{" "}
          <kbd className={kbdClass}>Ctrl</kbd> <kbd className={kbdClass}>Z</kbd>.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-7 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Gere um carrossel B2B
        </h1>
        <p className="text-sm leading-relaxed text-mut">
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
          <span className="flex items-center gap-1 text-[11px] text-mut">
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

      {/* Antes da busca paga de propósito: quando o sinal curado já resolve o
          contexto, a busca na web vira gasto sem ganho. */}
      {onSignalIdsChange ? (
        <SignalPicker
          brandId={brandId ?? null}
          selected={signalIds ?? null}
          onChange={onSignalIdsChange}
        />
      ) : null}

      {isGenerating ? (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-faint opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-surface2" />
          </span>
          <p className="flex-1 text-xs leading-relaxed text-mut">
            Montando capa, slides de conteúdo e CTA.{" "}
            {includeNews
              ? "Com busca de notícias, costuma levar de 40 a 80 segundos."
              : "Costuma levar de 10 a 30 segundos."}
          </p>
          <span className="shrink-0 text-xs tabular-nums text-mut">
            {elapsed}s
          </span>
        </div>
      ) : null}

      {brandContext?.trim() ? (
        <SuggestionsSection
          context={brandContext}
          brandId={brandId}
          onPick={onChange}
          onCost={onSuggestionsCost}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <span className={labelClass}>Comece por um exemplo</span>
          <div className="flex flex-col gap-1.5">
            {EXAMPLES.map(({ icon: Icon, text }) => (
              <button
                key={text}
                type="button"
                onClick={() => onChange(text)}
                className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 text-left text-sm text-ink2 transition hover:border-line3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acc"
              >
                <Icon size={14} className="shrink-0 text-faint" />
                <span className="truncate">{text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {onBrandChange ? (
        <div className="flex flex-col gap-6 border-t border-line pt-6">
          {onFormatChange && format ? (
            <div className="flex flex-col gap-2">
              <span className={labelClass}>Formato</span>
              <FormatSelect value={format} onChange={onFormatChange} />
            </div>
          ) : null}
          {onPlatformChange && platform ? (
            <div className="flex flex-col gap-2">
              <span className={labelClass}>Plataforma</span>
              <PlatformPills
                value={platform}
                onChange={onPlatformChange}
                disabled={format === "apresentacao"}
              />
              <p className="text-[11px] leading-relaxed text-mut">
                {getPlatformToneNote(platform)}
              </p>
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <span className={labelClass}>Marca (define o tema visual)</span>
            <BrandPills value={brandId ?? null} onChange={onBrandChange} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

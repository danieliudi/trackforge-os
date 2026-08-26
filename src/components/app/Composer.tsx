"use client";

import clsx from "clsx";
import { CornerDownLeft, Link2, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState, type KeyboardEvent } from "react";

import { BrandPills } from "@/components/app/BrandPills";
import { Button } from "@/components/ui/Button";
import type { BrandId } from "@/constants/brands";
import { fieldClass, kbdClass, labelClass } from "@/lib/ui";

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

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  /** "hero" é a tela de entrada; "compact" fica fixo no topo do editor. */
  variant: "hero" | "compact";
  brandId?: BrandId | null;
  onBrandChange?: (id: BrandId | null) => void;
};

export function Composer({
  value,
  onChange,
  onSubmit,
  isGenerating,
  variant,
  brandId,
  onBrandChange,
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
      </div>

      {isGenerating ? (
        <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-zinc-700" />
          </span>
          <p className="flex-1 text-xs leading-relaxed text-zinc-600">
            Montando capa, slides de conteúdo e CTA. Costuma levar de 10 a 30
            segundos.
          </p>
          <span className="shrink-0 text-xs tabular-nums text-zinc-500">
            {elapsed}s
          </span>
        </div>
      ) : null}

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

      {onBrandChange ? (
        <div className="flex flex-col gap-2 border-t border-zinc-200 pt-6">
          <span className={labelClass}>Marca (define o tema visual)</span>
          <BrandPills value={brandId ?? null} onChange={onBrandChange} />
        </div>
      ) : null}
    </div>
  );
}

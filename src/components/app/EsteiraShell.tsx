"use client";

import clsx from "clsx";
import { Monitor, Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";

import { brandOptions, type BrandId } from "@/constants/brands";
import {
  formatCost,
  getCostLogServerSnapshot,
  getCostLogSnapshot,
  subscribeCostLog,
} from "@/lib/costLog";
import {
  getFrontServerSnapshot,
  getFrontSnapshot,
  setFront,
  subscribeFront,
} from "@/lib/front";
import {
  getThemeServerSnapshot,
  getThemeSnapshot,
  nextTheme,
  setTheme,
  subscribeTheme,
  themeLabel,
} from "@/lib/theme";
import { focusRing } from "@/lib/ui";

/**
 * A casca do app: masthead de jornal em cima, a janela inteira embaixo.
 *
 * DIREÇÃO TRAVADA 07/09/2026 — híbrido Wire Service + Type Specimen Desk
 * (`scratchpad/intent-fase1/DESIGN-hibrido-locked.md`, mock
 * `scratchpad/intent-fase1/impeccable-hibrido-wire-specimen.html`). Da camada
 * Wire vêm as três faixas: masthead serif, dateline e a faixa preta com a
 * navegação.
 *
 * A FRENTE CONTINUA SENDO A PRIMEIRA DECISÃO, e por isso subiu para a linha da
 * marca como `EDIÇÃO · {frente}`: peça sai com o nome de uma empresa, e trocar
 * de frente sem perceber é como fato de uma marca vai parar no material da
 * outra. No mock ela é texto; aqui precisa continuar clicável, então cada
 * frente é um botão — o que está no ar fica sublinhado, não colorido, porque
 * cor sobre papel já é o vocabulário da urgência.
 */

const SECTIONS = [
  { href: "/", label: "Situação" },
  { href: "/esteira/pecas", label: "Peças" },
  { href: "/esteira/fatos", label: "Fatos" },
  { href: "/esteira/custos", label: "Custos" },
  { href: "/esteira/instalacao", label: "Instalação" },
];

const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

export function useFront(): [BrandId, (id: BrandId) => void] {
  const front = useSyncExternalStore(subscribeFront, getFrontSnapshot, getFrontServerSnapshot);
  return [front, setFront];
}

export function EsteiraShell({
  children,
  aside,
}: {
  children: ReactNode;
  /** Conteúdo extra na dateline, à direita — antes do custo e do tema. */
  aside?: ReactNode;
}) {
  const pathname = usePathname();
  const [front, choose] = useFront();

  const entries = useSyncExternalStore(
    subscribeCostLog,
    getCostLogSnapshot,
    getCostLogServerSnapshot,
  );
  const agora = new Date();
  const month = entries
    .filter((entry) => new Date(entry.at).getMonth() === agora.getMonth())
    .reduce((total, entry) => total + entry.usd, 0);

  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);
  const ThemeIcon = theme === "claro" ? Sun : theme === "escuro" ? Moon : Monitor;

  return (
    <div className="flex h-screen flex-col bg-paper">
      {/* ══ MASTHEAD ══ marca serif + edição, regra grossa embaixo */}
      <header className="shrink-0 border-b-[3px] border-ink bg-paper px-5 pb-1.5 pt-2.5">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <Link
            href="/"
            className={clsx(
              "font-serif text-[26px] font-extrabold leading-none tracking-[-0.04em] text-ink",
              focusRing,
            )}
          >
            trackforge
          </Link>

          <span className="flex items-baseline gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink">
            <span aria-hidden="true">Edição ·</span>
            <span className="sr-only">Frente ativa:</span>
            {brandOptions.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                aria-pressed={id === front}
                onClick={() => choose(id)}
                className={clsx(
                  "px-0.5 uppercase tracking-[0.1em] transition",
                  focusRing,
                  id === front
                    ? "font-bold text-ink underline decoration-[2px] underline-offset-[3px]"
                    : "font-medium text-mut hover:text-ink",
                )}
              >
                {label}
              </button>
            ))}
          </span>
        </div>
      </header>

      {/* ══ DATELINE ══ onde/quando, e os controles que não são navegação */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-rule bg-paper px-5 py-1">
        <span className="text-[10px] font-medium text-mut">
          São Paulo · {MESES[agora.getMonth()]} {agora.getFullYear()}
        </span>
        <span className="flex items-center gap-3">
          {aside}
          <span className="font-mono text-[10px] text-mut">
            mês · {formatCost(month).primary}
          </span>
          {/* Um botão, três estados. Três botões custariam espaço permanente por
              uma decisão que se toma uma vez. */}
          <button
            type="button"
            onClick={() => setTheme(nextTheme[theme])}
            aria-label={`Tema: ${themeLabel[theme]} — clique para ${themeLabel[nextTheme[theme]]}`}
            className={clsx(
              "flex items-center gap-1 text-[10px] font-medium text-mut transition hover:text-ink",
              focusRing,
            )}
          >
            <ThemeIcon size={11} aria-hidden="true" />
            <span>Tema · {themeLabel[theme]}</span>
          </button>
        </span>
      </div>

      {/* ══ FAIXA ══ preta nos dois temas; LIVE é status, não rota */}
      <nav className="flex shrink-0 flex-wrap items-center gap-x-3.5 gap-y-1 bg-band px-5 py-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-band-ink">
        {/* Marca de edição do wire service, não indicador de conexão: esta casca
            não observa nada em tempo real, e um ponto que promete isso sem
            observar seria número inventado em forma de enfeite. */}
        <span className="text-urgent" aria-hidden="true">
          • Live
        </span>

        {SECTIONS.map(({ href, label }, i) => {
          const active =
            href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <span key={href} className="flex items-center gap-3.5">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "uppercase tracking-[0.06em] transition",
                  focusRing,
                  active ? "underline decoration-[2px] underline-offset-[3px]" : "opacity-70 hover:opacity-100",
                )}
              >
                {label}
              </Link>
              {/* O (+) fica entre Peças e Fatos, como no mock: produzir é a ação
                  que interrompe a leitura, então mora no meio da fila e não na
                  ponta, onde viraria mais um item de navegação. */}
              {i === 1 ? (
                <Link
                  href="/esteira"
                  aria-label="Produzir peça nova na bancada"
                  className={clsx(
                    "grid h-4 w-4 place-items-center rounded-full bg-band-ink text-[11px] font-extrabold leading-none text-band",
                    focusRing,
                  )}
                >
                  +
                </Link>
              ) : null}
            </span>
          );
        })}
      </nav>

      <main className="min-h-0 flex-1">{children}</main>
    </div>
  );
}

/** Container das telas de leitura — mesma largura do painel Situação. */
export function ShellPage({ children }: { children: ReactNode }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-6 py-6 md:px-8">
        {children}
      </div>
    </div>
  );
}

"use client";

import clsx from "clsx";
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
import { focusRing, labelClass } from "@/lib/ui";

/**
 * A casca do app: uma barra no topo, a janela inteira embaixo.
 *
 * A BARRA LATERAL SAIU e virou esta faixa. Ela custava 184px fixos em toda tela
 * para mostrar quatro links que se usam duas vezes por semana, e empurrava o
 * trabalho para uma coluna estreita no meio de um monitor largo — a reclamação
 * que originou o redesenho. Navegação de baixa frequência mora no topo; a
 * largura toda fica para o que se faz todo dia.
 *
 * A FRENTE CONTINUA SENDO A PRIMEIRA DECISÃO, e por isso fica colada na marca:
 * peça sai com o nome de uma empresa, e trocar de frente sem perceber é como
 * fato de uma marca vai parar no material da outra.
 */

const SECTIONS = [
  { href: "/esteira/pecas", label: "Peças" },
  { href: "/esteira/fatos", label: "Base de fatos" },
  { href: "/esteira/custos", label: "Custos" },
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
  /** Conteúdo extra no topo à direita, antes das seções. */
  aside?: ReactNode;
}) {
  const pathname = usePathname();
  const [front, choose] = useFront();

  const entries = useSyncExternalStore(
    subscribeCostLog,
    getCostLogSnapshot,
    getCostLogServerSnapshot,
  );
  const month = entries
    .filter((entry) => new Date(entry.at).getMonth() === new Date().getMonth())
    .reduce((total, entry) => total + entry.usd, 0);

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <header className="flex shrink-0 items-center gap-4 border-b border-line2 bg-surface px-5 py-2.5">
        <Link
          href="/esteira"
          className={clsx(
            "rounded-md px-1 py-0.5 text-sm font-semibold tracking-tight text-ink",
            focusRing,
          )}
        >
          Esteira
        </Link>

        <span className="flex items-center gap-2">
          <span className={clsx(labelClass, "hidden sm:inline")}>Frente</span>
          <span className="flex gap-0.5 rounded-lg border border-line bg-surface2 p-0.5">
            {brandOptions.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                aria-pressed={id === front}
                onClick={() => choose(id)}
                className={clsx(
                  "rounded-md px-3 py-1 text-[12.5px] transition",
                  focusRing,
                  id === front
                    ? "border border-line bg-surface font-semibold text-ink shadow-sm"
                    : "border border-transparent text-mut hover:text-ink",
                )}
              >
                {label}
              </button>
            ))}
            {/* Listada e desligada: esconder sugeriria que não é parte do
                desenho; habilitar deixaria sair peça sem o auditor de fronteira. */}
            {/* Recuada, mas legível: a 2,2:1 ela sumia, e item invisível não
                comunica "em breve" — comunica que não existe. */}
            <span
              className="flex items-center gap-1.5 px-3 py-1 text-[12.5px] text-faint"
              title="Em breve — falta o auditor de fronteira para esta frente"
            >
              Meu
              <span className="font-mono text-[9px] uppercase tracking-wide">em breve</span>
            </span>
          </span>
        </span>

        <span className="flex-1" />
        {aside}

        <span className="font-mono text-[11px] text-faint">mês · {formatCost(month).primary}</span>

        <nav className="flex items-center gap-0.5">
          {SECTIONS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "rounded-md px-2.5 py-1.5 text-[12.5px] transition",
                  focusRing,
                  active ? "bg-surface2 font-medium text-ink" : "text-mut hover:bg-surface2 hover:text-ink",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="min-h-0 flex-1">{children}</main>
    </div>
  );
}

/** Container das telas de leitura — as que não são a bancada de três colunas. */
export function ShellPage({ children }: { children: ReactNode }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-6">{children}</div>
    </div>
  );
}

"use client";

import clsx from "clsx";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";

import { brandOptions, type BrandId } from "@/constants/brands";
import {
  getFrontServerSnapshot,
  getFrontSnapshot,
  setFront,
  subscribeFront,
} from "@/lib/front";
import { focusRing, labelClass } from "@/lib/ui";

/**
 * A casca do app: uma barra lateral, uma porta.
 *
 * Antes havia duas entradas — o editor de carrossel em "/" e a esteira — as
 * duas pedindo "descreva o tema" e produzindo coisas diferentes. Isto é a
 * correção: a esteira é a casa, a frente é a primeira decisão, e as seções são
 * a espinha de navegação. O editor virou destino, não porta.
 */

const SECTIONS = [
  { href: "/esteira", label: "Painel" },
  { href: "/esteira/pecas", label: "Peças" },
  { href: "/esteira/fatos", label: "Base de fatos" },
  { href: "/esteira/custos", label: "Custos" },
];

export function useFront(): [BrandId, (id: BrandId) => void] {
  const front = useSyncExternalStore(
    subscribeFront,
    getFrontSnapshot,
    getFrontServerSnapshot,
  );
  return [front, setFront];
}

export function EsteiraShell({
  children,
  aside,
}: {
  children: ReactNode;
  /** Conteúdo do topo à direita — os passos, quando há um fluxo em curso. */
  aside?: ReactNode;
}) {
  const pathname = usePathname();
  const [front, choose] = useFront();

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
          <Link
            href="/esteira"
            className={clsx(
              "rounded-md px-1 py-0.5 text-sm font-semibold tracking-tight text-zinc-900",
              focusRing,
            )}
          >
            Esteira
          </Link>
          <div className="flex-1" />
          {aside}
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 md:grid-cols-[11.5rem_1fr]">
        <nav className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Frente</span>
            <div className="flex flex-col gap-0.5">
              {brandOptions.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={id === front}
                  onClick={() => choose(id)}
                  className={clsx(
                    "rounded-md border px-2.5 py-1.5 text-left text-[13px] transition",
                    focusRing,
                    id === front
                      ? "border-zinc-900 bg-white font-semibold text-zinc-900"
                      : "border-transparent text-zinc-600 hover:bg-white",
                  )}
                >
                  {label}
                </button>
              ))}
              {/* Listada e desligada: esconder sugeriria que não é parte do
                  desenho, habilitar deixaria sair peça sem o auditor de
                  fronteira — que é a guarda que esta frente mais precisa. */}
              <span className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-[13px] text-zinc-300">
                Meu · pessoal
                <span className="font-mono text-[9px] uppercase">em breve</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Seções</span>
            <div className="flex flex-col gap-0.5">
              {SECTIONS.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "rounded-md px-2.5 py-1.5 text-[13px] transition",
                      focusRing,
                      active
                        ? "bg-white font-medium text-zinc-900"
                        : "text-zinc-600 hover:bg-white",
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        <main className="flex flex-col gap-4">{children}</main>
      </div>
    </div>
  );
}

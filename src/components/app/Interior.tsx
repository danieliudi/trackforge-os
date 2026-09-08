"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

import { focusRing } from "@/lib/ui";

/**
 * As peças dos interiores de leitura — Peças, Fatos, Custos, Instalação.
 *
 * DIREÇÃO: híbrido Wire + Specimen, aprovado em 08/09/2026
 * (`scratchpad/intent-fase2/DESIGN-fase2-locked.md`, mock
 * `scratchpad/intent-fase2/mockup-interiores.html`). Antes disso os interiores
 * eram Clockwork — cartões arredondados flutuando em branco debaixo de um
 * masthead de jornal, duas linguagens coladas.
 *
 * POR QUE EXTRAIU AGORA E NÃO ANTES: o cabeçalho (rótulo → manchete → frase)
 * estava escrito igual nas QUATRO telas, e a grade de células existia na home.
 * É a regra da seção 7 — extrai na terceira ocorrência, nunca antes.
 *
 * O QUE NÃO ESTÁ AQUI, de propósito: a bancada (`/esteira`, `/artigo`) e o
 * editor. São superfícies de trabalho, de três colunas e canvas, e seguem o
 * Clockwork até a fase delas.
 */

/**
 * Cabeçalho de tela: rótulo da seção, manchete e a frase que explica.
 *
 * A manchete é SERIF porque é manchete de edição, não título de cartão de
 * dashboard — e em peso 400, o único que o Instrument Serif tem (seção 4).
 */
export function PageHead({
  secao,
  titulo,
  children,
  aoLado,
}: {
  secao: string;
  titulo: string;
  /** A frase que diz o que a tela faz — e, quando cabe, o que ela não faz. */
  children: ReactNode;
  /** Meta à direita da linha de prova: o mês, a frente, o que for. */
  aoLado?: ReactNode;
}) {
  return (
    <div className="pb-1">
      <div className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.08em] text-mut">
        <span>{secao}</span>
        {aoLado ? <span>{aoLado}</span> : null}
      </div>
      <h1 className="mt-1 font-serif text-[41px] font-normal leading-[1.05] tracking-[-0.01em] text-ink">
        {titulo}
      </h1>
      <p className="mt-2 max-w-[60ch] text-[15.5px] leading-snug text-mut">{children}</p>
    </div>
  );
}

export type Celula = {
  /** Índice fixo — `01`…`04`. Numera a leitura, não a importância. */
  n: string;
  valor: string;
  rotulo: string;
  /** Invertida: é a célula que o resto da tela está mostrando. */
  destaque?: boolean;
  /** Rótulo em `urgent` — só quando a contagem em si é o problema. */
  urgente?: boolean;
};

/**
 * A grade de células.
 *
 * MESMA da home, e é esse o ponto: some o cartão preenchido de laranja do
 * Clockwork, entram as células separadas por 1px de regra com a ativa
 * invertida. Na casca Wire a urgência é a inversão e o ponto, não o
 * preenchimento.
 *
 * As células NÃO são clicáveis aqui — na home elas trocam o glifo, no interior
 * são leitura. Botão que não faz nada é pior que texto.
 */
export function CellGrid({ celulas }: { celulas: Celula[] }) {
  return (
    <div className="-mx-6 grid grid-cols-2 gap-px border-y border-rule bg-rule sm:grid-cols-4">
      {celulas.map((c) => (
        <div
          key={c.n}
          className={clsx(
            "min-h-[104px] px-5 py-4",
            c.destaque ? "bg-ink text-paper" : "bg-cell text-ink",
          )}
        >
          <span className={clsx("font-mono text-[11px]", c.destaque ? "text-paper" : "text-mut")}>
            {c.n}
          </span>
          <b className="mt-1.5 block text-[clamp(26px,2.2vw,37px)] font-extrabold leading-none tracking-[-0.04em]">
            {c.valor}
          </b>
          <span
            className={clsx(
              "mt-1.5 block text-[12px] uppercase tracking-[0.04em]",
              c.destaque ? "text-paper" : c.urgente ? "text-urgent" : "text-mut",
            )}
          >
            {c.rotulo}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Cabeçalho de bloco: o que vem abaixo, e um comentário à direita.
 *
 * É SANS em caixa alta, não mono. Mono aqui significa "o que a máquina
 * escreveu ou o que alinha em coluna"; isto são palavras (seção 4).
 */
export function BlockHead({
  children,
  nota,
  ponto = false,
}: {
  children: ReactNode;
  nota?: ReactNode;
  /** Ponto `urgent` à esquerda — só quando o bloco pede ação. */
  ponto?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 pt-5 pb-1 text-[11px] font-semibold uppercase tracking-[0.07em] text-mut">
      <span>
        {ponto ? <span className="text-urgent">• </span> : null}
        {children}
      </span>
      {nota ? <span className="text-right font-normal">{nota}</span> : null}
    </div>
  );
}

/** A folha onde as linhas moram — `cell` sobre `rule`, sem raio nem sombra. */
export function Sheet({ children }: { children: ReactNode }) {
  return <div className="-mx-6 border-t border-rule bg-cell">{children}</div>;
}

/**
 * Estado vazio: o selo, a manchete serif, a frase e a saída.
 *
 * Mesmo desenho do vazio da home — tracejado, sem cartão, com o CTA em bloco
 * sólido de tinta.
 */
export function EmptyState({
  selo,
  titulo,
  children,
  acao,
}: {
  selo: string;
  titulo: string;
  children: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <div className="my-4 border-2 border-dashed border-rule px-4 py-7 text-center">
      <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-urgent">
        {selo}
      </span>
      <h2 className="mt-2 font-serif text-[27px] font-normal tracking-[-0.01em] text-ink">
        {titulo}
      </h2>
      <p className="mt-1.5 text-[15px] text-mut">{children}</p>
      {acao}
    </div>
  );
}

/** Botão-bloco de saída do estado vazio. Tinta sólida, sem raio. */
export const ctaClass = clsx(
  "mt-4 inline-block bg-ink px-4 py-2.5 text-[13.5px] font-extrabold text-paper",
  focusRing,
);

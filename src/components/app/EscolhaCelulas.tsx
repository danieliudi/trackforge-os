"use client";

import clsx from "clsx";

import { focusRing } from "@/lib/ui";

/**
 * Escolha de UMA opção, em células regradas.
 *
 * POR QUE EXISTE AGORA E NÃO ANTES: a regra da seção 7 é extrair na TERCEIRA
 * ocorrência. A Fase 4 trouxe três de uma vez — trabalho, voz e arco de evento —
 * e as três são a mesma coisa: uma linha ou grade de células separadas por 1px
 * de regra, onde a escolhida é INVERTIDA. É o componente da home, e é assim que
 * o híbrido diz "ativo": inversão, nunca preenchimento arredondado.
 *
 * O QUE DELIBERADAMENTE NÃO ENTROU: a grade de FORMATOS da bancada. Ela parece
 * igual e não é — é múltipla escolha, tem estado de falha com borda `urgent`, e
 * carrega a etiqueta de voz da peça. Forçar as duas no mesmo componente
 * significaria três props booleanas para uma cobrir a outra, e o custo de uma
 * abstração errada é maior que o de duas cópias (seção 7).
 */

export type Celula<T extends string> = {
  id: T;
  titulo: string;
  /** Rótulo curto embaixo do título: o papel, o ângulo, a etapa. */
  nota?: string;
};

export function EscolhaCelulas<T extends string>({
  opcoes,
  valor,
  onChange,
  rotulo,
  colunas = 2,
  centrado = false,
}: {
  opcoes: Celula<T>[];
  valor: T | null;
  /** `null` quando a escolhida é clicada de novo — escolher não é irreversível. */
  onChange: (id: T | null) => void;
  /** Nome acessível do grupo. */
  rotulo: string;
  colunas?: 2 | 3 | 4 | 5;
  /** O arco de evento é uma fita de etapas; as outras são grade de rótulos. */
  centrado?: boolean;
}) {
  if (opcoes.length === 0) return null;

  return (
    <div
      role="group"
      aria-label={rotulo}
      className={clsx(
        "grid gap-px border border-rule bg-rule",
        colunas === 2 && "grid-cols-2",
        colunas === 3 && "grid-cols-3",
        colunas === 4 && "grid-cols-4",
        colunas === 5 && "grid-cols-5",
      )}
    >
      {opcoes.map((opcao) => {
        const marcada = opcao.id === valor;
        return (
          <button
            key={opcao.id}
            type="button"
            aria-pressed={marcada}
            onClick={() => onChange(marcada ? null : opcao.id)}
            className={clsx(
              "flex flex-col gap-0.5 px-3 py-2 text-left transition",
              focusRing,
              centrado && "items-center text-center",
              // A cor se escolhe UMA vez, com ternário: somar `bg-ink` a uma
              // classe que já carrega `bg-cell` deixa duas utilidades da mesma
              // propriedade na lista, e quem vence é a ordem do CSS gerado.
              marcada ? "bg-ink text-paper" : "bg-cell text-ink hover:text-ink",
            )}
          >
            <span className="text-[12.5px] font-medium leading-tight">{opcao.titulo}</span>
            {opcao.nota ? (
              <span
                className={clsx(
                  "text-[10.5px] uppercase leading-tight tracking-[0.06em]",
                  marcada ? "text-paper/75" : "text-mut",
                )}
              >
                {opcao.nota}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

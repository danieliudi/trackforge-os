"use client";

import { useSyncExternalStore } from "react";

import {
  MODEL_PRICING,
  WEB_SEARCH_PRICE,
  type PricedModel,
} from "@/constants/pricing";
import {
  formatUsd,
  getCostLogServerSnapshot,
  getCostLogSnapshot,
  subscribeCostLog,
  type CostKind,
} from "@/lib/costLog";
import { labelClass } from "@/lib/ui";

/**
 * O que uma geração VAI custar, antes de gastar.
 *
 * A seção 5 do CLAUDE.md diz "custo é visível ou não existe", e até a Fase 3 a
 * bancada só mostrava o recibo DEPOIS que a API cobrou: a tela dizia o que você
 * gastou, nunca o que ia gastar.
 *
 * NADA AQUI É ESTIMATIVA, e essa é a decisão de projeto. Estimar exigiria
 * adivinhar o tamanho da saída, que é justamente o que a seção 2 proíbe. O que
 * o painel mostra são duas coisas verificáveis:
 *
 *   · o PREÇO DE TABELA, lido de `MODEL_PRICING` — o mesmo número que o recibo
 *     usa depois para cobrar;
 *   · a FAIXA HISTÓRICA, lida do `costLog` — o que gerações do mesmo tipo
 *     custaram de verdade neste navegador.
 *
 * Sem histórico a faixa some e sobra a tabela. Em nenhum caminho aparece um
 * número inventado.
 *
 * O MOCKUP PROMETIA MAIS DO QUE O DADO SUSTENTA, e isso foi corrigido aqui: ele
 * dizia "os últimos 6 artigos DESTA FRENTE". `CostEntry` não guarda marca —
 * tem `kind`, `usd`, `at`, `title` e os tokens, mais nada. Filtrar por frente
 * daria um número que a base não tem como produzir, então a frase fala só do
 * tipo de geração. Gravar a frente no log resolveria, e é mudança de outro
 * escopo.
 */
export function PriceSheet({
  kind,
  model,
  titulo,
  comBusca = false,
}: {
  /** Que tipo de geração este painel está precificando. */
  kind: CostKind;
  model: PricedModel;
  /** "O que escrever vai custar", "O que gerar vai custar". */
  titulo: string;
  /** A linha de busca na web só entra onde a rota pode buscar. */
  comBusca?: boolean;
}) {
  const entries = useSyncExternalStore(
    subscribeCostLog,
    getCostLogSnapshot,
    getCostLogServerSnapshot,
  );

  const preco = MODEL_PRICING[model];

  // Geração que falhou continua no log de propósito (seção 5), mas não serve
  // de referência do que uma geração COMPLETA custa.
  const anteriores = entries.filter((e) => e.kind === kind && !e.failed).map((e) => e.usd);
  const faixa =
    anteriores.length >= 2
      ? { n: anteriores.length, min: Math.min(...anteriores), max: Math.max(...anteriores) }
      : null;

  // `formatUsd` tem quatro casas de propósito: no recibo uma geração pode
  // custar US$ 0,0084, e arredondar ali esconderia gasto. Preço POR MILHÃO é
  // outra ordem de grandeza e outra unidade — US$ 2,0000 só polui.
  const porMilhao = (v: number) =>
    `US$ ${(v * 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / milhão`;

  const linhas: [string, string][] = [
    ["Entrada", porMilhao(preco.input)],
    ["Saída", porMilhao(preco.output)],
  ];
  if (comBusca) {
    linhas.push([
      "Busca na web, se usada",
      `US$ ${WEB_SEARCH_PRICE.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / busca`,
    ]);
  }

  return (
    <section className="border border-rule bg-cell">
      <header className="flex items-baseline justify-between gap-3 border-b border-rule px-3 py-2">
        <span className={labelClass}>{titulo}</span>
        <span className="font-mono text-[12px] text-ink">{MODEL_LABELS[model]}</span>
      </header>

      <dl className="flex flex-col">
        {linhas.map(([nome, valor]) => (
          <div key={nome} className="flex items-baseline justify-between gap-3 px-3 py-1.5">
            <dt className="text-[12.5px] text-mut">{nome}</dt>
            <dd className="font-mono text-[12.5px] text-ink2 tabular-nums">{valor}</dd>
          </div>
        ))}
      </dl>

      <p className="border-t border-rule px-3 py-2 text-[12px] leading-relaxed text-mut">
        {faixa ? (
          <>
            As últimas {faixa.n} gerações deste tipo custaram entre{" "}
            <b className="font-mono font-normal text-ink">{formatUsd(faixa.min)}</b> e{" "}
            <b className="font-mono font-normal text-ink">{formatUsd(faixa.max)}</b>. Preço de
            tabela; o total real sai no recibo.
          </>
        ) : (
          <>Preço de tabela. O total real depende do tamanho do texto e sai no recibo.</>
        )}
      </p>
    </section>
  );
}

/**
 * Nome curto do modelo para a tela.
 *
 * Fica aqui e não em `pricing.ts` porque lá o identificador é o contrato com a
 * API; aqui é rótulo. `satisfies` garante que modelo novo na tabela de preço
 * apareça nesta lista também, em vez de renderizar o id cru.
 */
const MODEL_LABELS = {
  "claude-sonnet-5": "Sonnet 5",
  "claude-haiku-4-5": "Haiku 4.5",
} satisfies Record<PricedModel, string>;

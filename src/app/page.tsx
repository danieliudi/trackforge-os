"use client";

import clsx from "clsx";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { EsteiraShell, useFront } from "@/components/app/EsteiraShell";
import { brandLabel } from "@/constants/brands";
import {
  buildDashboardStats,
  esperandoDecisao,
  monthsWithCost,
  type PendingPieceRow,
} from "@/lib/dashboardStats";
import {
  formatCost,
  getCostLogServerSnapshot,
  getCostLogSnapshot,
  subscribeCostLog,
} from "@/lib/costLog";
import { factVerificationQueue } from "@/lib/factQueue";
import {
  getProductionsServerSnapshot,
  getProductionsSnapshot,
  subscribeProductions,
} from "@/lib/produced";
import { focusRing, medidaClass } from "@/lib/ui";

/**
 * Porta de entrada: a situação deste navegador, como folha de espécime.
 *
 * DIREÇÃO TRAVADA 07/09/2026 — corpo Type Specimen Desk
 * (`scratchpad/intent-fase1/DESIGN-hibrido-locked.md`). O glifo gigante é a
 * contagem da prioridade ativa; a célula invertida na grade espelha qual é. A
 * decisão de desenho é que o número É a manchete: quem abre a casa vê primeiro
 * quanta coisa pede ação, não uma frase descrevendo que existe uma fila.
 *
 * NENHUM NÚMERO AQUI É DE ENFEITE. Todos saem de `buildDashboardStats` sobre o
 * que está no localStorage mais a fila do CRM. O mock trazia contagens
 * ilustrativas (3 · 2 · 1 · 12) e elas NÃO vieram junto: instalação nova abre
 * com zero em tudo, que é o estado verdadeiro dela.
 */

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

type PrioridadeId = "fila" | "nao-enviados" | "sem-fonte" | "custo";

export default function SituacaoPage() {
  const [brandId] = useFront();
  const productions = useSyncExternalStore(
    subscribeProductions,
    getProductionsSnapshot,
    getProductionsServerSnapshot,
  );
  const costEntries = useSyncExternalStore(
    subscribeCostLog,
    getCostLogSnapshot,
    getCostLogServerSnapshot,
  );

  const [pending, setPending] = useState<PendingPieceRow[]>([]);
  const [crmConfigured, setCrmConfigured] = useState(false);
  /** Fila configurada mas fora do ar — estado diferente de "não configurada". */
  const [filaForaDoAr, setFilaForaDoAr] = useState(false);
  const [escolhida, setEscolhida] = useState<PrioridadeId | null>(null);
  const [reference, setReference] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const loadPending = useCallback(() => {
    void fetch(`/api/publish?brandId=${brandId}`)
      .then((response) => response.json())
      .then((data) => {
        setCrmConfigured(data.configured === true);
        // A rota devolve `unreachable` quando a fila existe e não respondeu. Sem
        // separar os dois, "CRM não configurado" apareceria para quem tem CRM e
        // está só com a rede caída — e a pessoa iria mexer na configuração certa.
        setFilaForaDoAr(data.configured === true && data.unreachable === true);
        setPending(Array.isArray(data.pending) ? data.pending : []);
      })
      .catch(() => {
        setCrmConfigured(false);
        setFilaForaDoAr(false);
        setPending([]);
      });
  }, [brandId]);

  useEffect(() => {
    const timer = setTimeout(loadPending, 0);
    return () => clearTimeout(timer);
  }, [loadPending]);

  const stats = useMemo(
    () => buildDashboardStats({ productions, costEntries, brandId, pending, reference }),
    [productions, costEntries, brandId, pending, reference],
  );

  const facts = useMemo(() => factVerificationQueue(brandId), [brandId]);
  const monthOptions = useMemo(() => {
    const listed = monthsWithCost(costEntries);
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${now.getMonth()}`;
    if (!listed.some((item) => `${item.year}-${item.month}` === currentKey)) {
      return [
        {
          year: now.getFullYear(),
          month: now.getMonth(),
          label: `${MESES[now.getMonth()]}/${now.getFullYear()}`,
        },
        ...listed,
      ];
    }
    return listed;
  }, [costEntries]);

  const custo = formatCost(stats.month.usd);

  /**
   * As quatro células, na ordem fixa do mock. `valor` é o que o glifo mostra;
   * `peso` é só para escolher a prioridade padrão — custo nunca vira urgência
   * sozinho, então entra com peso 0.
   */
  const celulas = [
    {
      id: "fila" as const,
      n: "01",
      rotulo: "fila crm",
      valor: crmConfigured ? String(stats.pendingCount) : "—",
      peso: crmConfigured ? stats.pendingCount : 0,
      legenda: "na fila do CRM",
      sub: crmConfigured ? "esperando aprovação" : "CRM não configurado nesta instalação",
    },
    {
      id: "nao-enviados" as const,
      n: "02",
      rotulo: "não enviados",
      valor: String(stats.unsent.length),
      peso: stats.unsent.length,
      legenda: "não enviados",
      sub: "pagos, ainda na bancada",
    },
    {
      id: "sem-fonte" as const,
      n: "03",
      rotulo: "sem fonte",
      valor: String(stats.flagged.length),
      peso: stats.flagged.length,
      legenda: "sem fonte",
      sub:
        stats.flaggedClaimCount > 0
          ? `afirmações marcadas · n=${stats.flaggedClaimCount}`
          : "nenhuma afirmação marcada",
    },
    {
      id: "custo" as const,
      n: "04",
      // Dinheiro, não contagem. O mock mostrava "12" solto; número sem unidade
      // no lugar mais visível da tela é exatamente o que esta ferramenta existe
      // para não fazer.
      rotulo: "custo",
      valor: custo.primary,
      peso: 0,
      legenda: "custo do mês",
      sub:
        stats.month.count === 0
          ? "nenhuma geração neste mês"
          : `${stats.month.count} ${stats.month.count === 1 ? "geração" : "gerações"}`,
    },
  ];

  /**
   * Regra de produto: fila > não enviados > sem fonte. Custo NÃO entra na
   * disputa — é leitura, não pendência.
   *
   * Nada pedindo decisão não cai no custo: cai no `0` quieto que a spec pede
   * (item 3). Além de ser o combinado, evita o glifo virar "R$ 0,00" a 200px,
   * que atropela a legenda e transforma a manchete da casa num extrato.
   */
  // A ordem NÃO mora aqui: mora em `esperandoDecisao`, que a faixa da casca
  // também usa. Duas telas respondendo "o que espera decisão" com regras
  // separadas é como uma passa a mentir sem ninguém notar.
  const padrao =
    esperandoDecisao({
      productions,
      brandId,
      pendingCount: crmConfigured && !filaForaDoAr ? stats.pendingCount : null,
    })?.id ?? null;
  const ativa = escolhida ?? padrao;
  const nadaPedindo = padrao === null && escolhida === null;
  const cell = celulas.find((c) => c.id === ativa) ?? null;

  const glifo = nadaPedindo ? "0" : (cell?.valor ?? "0");
  // Contagem cabe em corpo 11vw; dinheiro formatado tem 7+ caracteres e precisa
  // encolher, senão vaza a linha.
  /**
   * Os tetos caíram quando o corpo ganhou a medida de 1280px (08/09/2026).
   *
   * O `11vw` foi calibrado quando o conteúdo sangrava de ponta a ponta: 208px
   * era 11% de uma tela de 1900. Dentro de uma coluna de 1280 o mesmo 208px
   * vira 16% e o número atropela a coluna. O que atravessa é a PROPORÇÃO —
   * 150px é 11,7% de 1280, a mesma presença de antes. Terceira vez que este
   * repo tropeça em traduzir pixel no lugar de proporção (CLAUDE.md seção 4).
   */
  const glifoClasse =
    glifo.length <= 2
      ? "text-[clamp(72px,11vw,150px)]"
      : glifo.length <= 4
        ? "text-[clamp(60px,8vw,108px)]"
        : "text-[clamp(44px,5vw,72px)]";

  /**
   * A lista sob a grade (tela 02 do mock) mostra o que dá para ABRIR da
   * prioridade ativa. Custo não entra: é leitura, não fila de trabalho.
   */
  const lista: { id: string; titulo: string; meta: string; href: string }[] =
    ativa === "fila"
      ? pending.map((row) => ({
          id: row.id,
          titulo: row.title,
          meta: row.createdAt
            ? `no CRM desde ${new Date(row.createdAt).toLocaleDateString("pt-BR")}`
            : "aguardando aprovação",
          href: "/esteira/pecas",
        }))
      : ativa === "custo" || ativa === null
        ? []
        : (ativa === "sem-fonte" ? stats.flagged : stats.unsent).map((item) => ({
            id: item.id,
            titulo: item.title,
            meta: `${item.pieces.length} ${item.pieces.length === 1 ? "peça" : "peças"} · ${new Date(item.at).toLocaleDateString("pt-BR")}`,
            href: `/esteira?abrir=${item.id}`,
          }));
  const mostraLista = !nadaPedindo && lista.length > 0;
  const frente = brandLabel(brandId);

  return (
    <EsteiraShell
      aside={
        <label className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-mut">Mês</span>
          <select
            className={clsx(
              "cursor-pointer border-0 bg-transparent p-0 font-mono text-[10px] text-ink",
              focusRing,
            )}
            value={`${reference.getFullYear()}-${reference.getMonth()}`}
            onChange={(event) => {
              const [year, month] = event.target.value.split("-").map(Number);
              setReference(new Date(year, month, 1));
            }}
          >
            {monthOptions.map((option) => (
              <option key={`${option.year}-${option.month}`} value={`${option.year}-${option.month}`}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      }
    >
      <div className="flex h-full flex-col overflow-y-auto">
        {/* ══ AVISOS ══ erro de fila em cima; CRM ausente é nota, não erro */}
        {filaForaDoAr ? (
          <p className={clsx(medidaClass, "mt-2 border border-urgent-line bg-urgent-bg py-2 text-[13px] leading-snug text-ink")}>
            <b className="block font-bold text-urgent">Não foi possível carregar a fila.</b>
            Tente de novo. Os dados desta máquina continuam abaixo.
          </p>
        ) : null}

        {!crmConfigured ? (
          <p className={clsx(medidaClass, "mt-2 border border-rule bg-note-bg py-2 text-[13px] leading-snug text-mut")}>
            <b className="block font-bold text-ink">CRM não configurado</b>
            A fila não aparece nesta instalação. O resto da casa segue utilizável.
          </p>
        ) : null}

        {/* ══ PROVA ══ a linha mono do espécime, com dado real e não eixo de fonte */}
        <div className={clsx(medidaClass, "flex items-center justify-between gap-3 pt-4 font-mono text-[11px] uppercase tracking-[0.08em] text-mut")}>
          <span>situação · {frente}</span>
          <span>{MESES[reference.getMonth()]} {reference.getFullYear()}</span>
        </div>

        {/* ══ GLIFO ══ o número É a manchete */}
        <p
          className={clsx(
            medidaClass,
            "flex items-end pt-0.5 font-extrabold leading-[0.82] tracking-[-0.07em] text-ink",
            // O mock é um quadro 16:10 de ~730px com o glifo em 78px — 11% da
            // largura. Fixar 78px numa tela de 1900 deixaria o número perdido;
            // o clamp mantém a PROPORÇÃO, que é o que foi aprovado.
            glifoClasse,
            nadaPedindo && "font-medium opacity-30",
          )}
        >
          {glifo}
          <span className="text-urgent" aria-hidden="true">.</span>
        </p>
        <p className={clsx(medidaClass, "pb-4 text-[15.5px] leading-snug text-mut")}>
          {nadaPedindo ? (
            <b className="font-bold text-ink">nada pedindo decisão</b>
          ) : (
            <>
              <b className="font-bold text-ink">{cell?.legenda}</b> · {cell?.sub}
            </>
          )}
        </p>

        {/* ══ GRADE ══ célula invertida = o que o glifo está mostrando */}
        <div className="mx-auto grid w-full max-w-[1280px] grid-cols-2 gap-px border-y border-rule bg-rule sm:grid-cols-4">
          {celulas.map((c) => {
            const on = c.id === ativa;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => setEscolhida(c.id)}
                className={clsx(
                  "min-h-[clamp(96px,14vh,148px)] px-5 py-4 text-left transition",
                  focusRing,
                  on ? "bg-ink text-paper" : "bg-cell text-ink hover:bg-paper",
                )}
              >
                <span className={clsx("font-mono text-[11px]", on ? "text-paper" : "text-mut")}>
                  {c.n}
                </span>
                <b className="mt-1.5 block text-[clamp(26px,2.2vw,37px)] font-extrabold tracking-[-0.04em]">
                  {c.valor}
                </b>
                <span
                  className={clsx(
                    "mt-1.5 block text-[12px] uppercase tracking-[0.04em]",
                    on ? "font-medium text-paper" : "text-mut",
                  )}
                >
                  {c.rotulo}
                </span>
              </button>
            );
          })}
        </div>

        {/* ══ LISTA ══ só quando a prioridade ativa tem itens para abrir */}
        {mostraLista ? (
          <ul className="mx-auto w-full max-w-[1280px] border-t border-rule bg-cell">
            {lista.slice(0, 6).map((item, i) => (
              <li key={item.id} className="border-b border-dotted border-rule last:border-b-0">
                <Link
                  href={item.href}
                  className={clsx(
                    "grid grid-cols-[40px_1fr_auto] items-center gap-3 px-6 py-3.5 text-[13px] transition hover:bg-paper",
                    focusRing,
                  )}
                >
                  <span className="font-mono text-[11px] text-mut">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15.5px] font-medium text-ink">{item.titulo}</span>
                    <span className="mt-1 block text-[11.5px] text-mut">{item.meta}</span>
                  </span>
                  <span aria-hidden="true" className="text-[16px] font-extrabold text-ink">→</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {/* ══ VAZIO ══ nada pede decisão: diz isso e aponta a saída */}
        {nadaPedindo ? (
          <div className={clsx(medidaClass, "my-5 border-2 border-dashed border-rule py-7 text-center")}>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-urgent">
              Situação
            </span>
            {/* Mesmo ajuste do masthead: o `-0.03em` foi calibrado quando
                `font-serif` caía no serif genérico do sistema. O Instrument
                Serif já é estreito — nesse aperto as palavras se encostam. */}
            <h2 className="mt-1.5 font-serif text-[22px] tracking-[-0.01em] text-ink">
              Nada pedindo decisão
            </h2>
            <p className="mt-1.5 text-[15px] text-mut">
              {facts.length > 0
                ? `O atalho é produzir — e há ${facts.length} ${facts.length === 1 ? "fato" : "fatos"} para conferir.`
                : "O atalho é produzir."}
            </p>
            <Link
              href="/esteira/pecas"
              className={clsx(
                "mt-4 inline-block bg-ink px-4 py-2.5 text-[13.5px] font-extrabold text-paper",
                focusRing,
              )}
            >
              Ir para Peças
            </Link>
          </div>
        ) : null}
      </div>
    </EsteiraShell>
  );
}

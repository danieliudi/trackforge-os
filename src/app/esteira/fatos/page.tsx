"use client";

import clsx from "clsx";
import { useMemo } from "react";

import { EsteiraShell, ShellPage, useFront } from "@/components/app/EsteiraShell";
import { BlockHead, CellGrid, PageHead, Sheet } from "@/components/app/Interior";
import { brandLabel } from "@/constants/brands";
import { decorateFact, factVerificationQueue, type FactQueueItem } from "@/lib/factQueue";
import { getNormativeFacts, isExpired, isPublishable } from "@/knowledge/provenance";
import type { SourceTier } from "@/knowledge/provenance";
import { focusRing } from "@/lib/ui";

/**
 * A base de fatos — fila de risco no topo, todos os fatos abaixo.
 * Densidade Situação (KPIs + listas em 1440px).
 */

/**
 * A cor e a barra de cada nível de proveniência.
 *
 * O NÍVEL SAIU DA PONTA DIREITA em 08/09/2026 (Fase 2). Ele ficava depois da
 * afirmação, a mais de mil pixels de onde a leitura termina, e as dezoito
 * linhas saíam com a mesma cor e o mesmo peso. É o nível que decide se um fato
 * pode virar número numa peça (seção 2) — então passou a ser a primeira coisa
 * lida, com barra e cor próprias.
 *
 * É SANS, não mono: são palavras, não string do sistema (seção 4).
 */
const TIER_STYLE: Record<SourceTier, string> = {
  primaria: "border-ok text-ok",
  secundaria: "border-rule text-mut",
  interna: "border-rule text-mut",
  "nao-verificado": "border-urgent text-urgent",
};

const TIER_NOTA: Record<SourceTier, string> = {
  primaria: "pode citar",
  secundaria: "contexto",
  interna: "contexto",
  "nao-verificado": "não vira número",
};

/**
 * Uma linha de fato: nível à esquerda, afirmação no meio, conferência à direita.
 *
 * A COLUNA DE CONFERÊNCIA é nova, e o dado sempre existiu: `checkedAt` mora em
 * `src/knowledge/provenance.ts` e a tela nunca mostrou. Em 08/09/2026, 1 dos 19
 * fatos da Resibag tinha data. "Nunca conferido" repetido é a informação — é o
 * que justifica a fila existir —, não ruído a esconder.
 */
function LinhaFato({ fact }: { fact: FactQueueItem }) {
  const vencido = fact.status === "vencido";
  const conferido = fact.checkedAt
    ? new Date(fact.checkedAt).toLocaleDateString("pt-BR")
    : null;
  return (
    <div className="grid grid-cols-[152px_1fr_196px] gap-5 border-b border-dotted border-rule px-6 py-4 last:border-b-0">
      <span
        className={clsx(
          "border-l-[3px] pl-3 text-[11.5px] font-bold uppercase leading-[1.35] tracking-[0.06em]",
          vencido ? "border-urgent text-urgent" : TIER_STYLE[fact.tier],
        )}
      >
        {fact.statusLabel}
        <em className="mt-1 block text-[10.5px] font-normal not-italic tracking-[0.02em] text-mut">
          {fact.hasHardData ? "dado duro" : TIER_NOTA[fact.tier]}
        </em>
      </span>

      <span className="min-w-0">
        <p className="max-w-[64ch] text-[15.5px] leading-relaxed text-ink">{fact.claim}</p>
        {/* MONO aqui é certo: id e nome de arquivo são string do sistema. */}
        <span className="mt-1.5 block font-mono text-[11.5px] text-mut">
          {fact.id} · {fact.source}
          {fact.url ? (
            <>
              {" · "}
              <a
                href={fact.url}
                target="_blank"
                rel="noreferrer"
                className={clsx("underline underline-offset-2 hover:text-ink", focusRing)}
              >
                conferir fonte
              </a>
            </>
          ) : null}
        </span>
      </span>

      <span
        className={clsx(
          "text-right text-[11.5px] font-semibold uppercase leading-[1.35] tracking-[0.06em]",
          conferido ? "text-mut" : "text-ink",
        )}
      >
        {conferido ? `conferido ${conferido}` : "nunca conferido"}
        <em className="mt-1 block text-[10.5px] font-normal normal-case not-italic tracking-normal text-mut">
          {fact.revalidateBy
            ? `revalidar até ${new Date(fact.revalidateBy).toLocaleDateString("pt-BR")}`
            : "sem data de revalidação"}
        </em>
      </span>
    </div>
  );
}

export default function FatosPage() {
  const [front] = useFront();
  const facts = useMemo(() => getNormativeFacts(front), [front]);
  const queue = useMemo(() => factVerificationQueue(front), [front]);
  const publishable = facts.filter((fact) => isPublishable(fact));
  const expired = facts.filter((fact) => isExpired(fact)).length;
  const hardInQueue = queue.filter((fact) => fact.hasHardData).length;
  // A base inteira, vestida com o MESMO status da fila — nunca recalculado aqui.
  const todos = useMemo(() => facts.map((fact) => decorateFact(fact, front)), [facts, front]);
  const frente = brandLabel(front);

  return (
    <EsteiraShell>
      <ShellPage>
        <PageHead secao={`Base de fatos · ${frente}`} titulo="O que a ferramenta pode afirmar">
          Só fonte primária vira número numa peça. Secundária e interna dão
          contexto e nunca entram no slide.
        </PageHead>

        <CellGrid
          celulas={[
            { n: "01", valor: String(publishable.length), rotulo: `publicáveis · de ${facts.length}` },
            {
              n: "02",
              valor: String(queue.length),
              rotulo: "para conferir",
              destaque: queue.length > 0,
            },
            { n: "03", valor: String(expired), rotulo: "vencidos", urgente: expired > 0 },
            { n: "04", valor: String(hardInQueue), rotulo: "dado duro na fila" },
          ]}
        />

        {/* A nota contava `publishable` e dizia "conferido contra a fonte" — duas
            coisas diferentes que coincidiam por acaso enquanto o único fato com
            `checkedAt` era também o único primária. A revisão da base em
            11/09/2026 desfez a coincidência: os 9 passaram a ter `checkedAt`, e
            a tela ficou dizendo "1 de 9 já foi conferido" com "CONFERIDO
            11/09/2026" em cada um dos nove cartões. Conferir contra a fonte
            DECLARADA e poder virar número numa peça não são a mesma coisa —
            quem decide a segunda é o `tier`. O número estava certo; a frase é
            que media outra coisa. */}
        <BlockHead ponto={queue.length > 0} nota={`${publishable.length} de ${facts.length} pode virar número numa peça`}>
          Para conferir, em ordem de risco · n={queue.length}
        </BlockHead>
        {queue.length === 0 ? (
          <p className="border-2 border-dashed border-rule px-4 py-6 text-center text-[15px] text-mut">
            Nada pendente nesta frente.
          </p>
        ) : (
          <Sheet>
            {queue.map((fact) => (
              <LinhaFato key={fact.id} fact={fact} />
            ))}
          </Sheet>
        )}

        <BlockHead nota="a base inteira desta frente">
          Todos os fatos · n={facts.length}
        </BlockHead>
        {facts.length === 0 ? (
          <p className="border-2 border-dashed border-rule px-4 py-6 text-center text-[15px] text-mut">
            Nenhum fato catalogado para esta frente.
          </p>
        ) : (
          <Sheet>
            {todos.map((fact) => (
              <LinhaFato key={fact.id} fact={fact} />
            ))}
          </Sheet>
        )}

      </ShellPage>
    </EsteiraShell>
  );
}

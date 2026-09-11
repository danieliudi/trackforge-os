"use client";

import clsx from "clsx";
import { Monitor, Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

import { brandOptions, type BrandId } from "@/constants/brands";
import { esperandoDecisao } from "@/lib/dashboardStats";
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
  getProductionsServerSnapshot,
  getProductionsSnapshot,
  subscribeProductions,
} from "@/lib/produced";
import {
  getThemeServerSnapshot,
  getThemeSnapshot,
  nextTheme,
  setTheme,
  subscribeTheme,
  themeLabel,
} from "@/lib/theme";
import { focusRing, folhaClass, medidaClass } from "@/lib/ui";

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
  medida = "pagina",
}: {
  children: ReactNode;
  /** Conteúdo extra na dateline, à direita — antes do custo e do tema. */
  aside?: ReactNode;
  /**
   * Onde o masthead, a dateline e a faixa terminam.
   *
   * `pagina` alinha os três à coluna de 1280px — é o certo num interior de
   * leitura, onde a página É a coluna. `folha` manda os três de ponta a ponta,
   * com o mesmo gutter dos painéis: é o certo numa superfície de TRABALHO, onde
   * a folha é inteira e quem carrega medida é a prosa lá dentro.
   *
   * O desalinhamento que isto corrige era de 605px, medido com o app rodando.
   */
  medida?: "pagina" | "folha";
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

  /**
   * O que espera decisão, na faixa, em toda tela.
   *
   * A fila do CRM vem da rota; o resto sai do localStorage que já está em
   * memória. `null` enquanto não respondeu, e `null` quando o CRM não está
   * configurado — fila desconhecida não é fila vazia, e chutar zero aqui faria a
   * faixa dizer "em dia" para quem tem três peças esperando aprovação.
   */
  const productions = useSyncExternalStore(
    subscribeProductions,
    getProductionsSnapshot,
    getProductionsServerSnapshot,
  );
  /**
   * Três estados, não dois. "Não sei" precisa ser distinguível de "zero": a
   * fila fora do ar com a faixa dizendo "em dia" é uma afirmação falsa no lugar
   * mais visível da casca, e falsa justamente sobre o que exige decisão sua.
   */
  const [fila, setFila] = useState<
    { estado: "ok"; total: number } | { estado: "sem-crm" } | { estado: "fora-do-ar" }
  >({ estado: "sem-crm" });

  useEffect(() => {
    let vivo = true;
    const timer = setTimeout(() => {
      void fetch(`/api/publish?brandId=${front}`)
        .then((r) => r.json())
        .then((data) => {
          if (!vivo) return;
          if (data.configured !== true) setFila({ estado: "sem-crm" });
          else if (data.unreachable === true) setFila({ estado: "fora-do-ar" });
          else setFila({ estado: "ok", total: Array.isArray(data.pending) ? data.pending.length : 0 });
        })
        // Rede caída é fila fora do ar, não instalação sem CRM.
        .catch(() => vivo && setFila({ estado: "fora-do-ar" }));
    }, 0);
    return () => {
      vivo = false;
      clearTimeout(timer);
    };
  }, [front]);

  const espera = esperandoDecisao({
    productions,
    brandId: front,
    pendingCount: fila.estado === "ok" ? fila.total : null,
  });

  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);
  const borda = medida === "folha" ? folhaClass : medidaClass;
  const ThemeIcon = theme === "claro" ? Sun : theme === "escuro" ? Moon : Monitor;

  return (
    <div className="flex h-screen flex-col bg-paper">
      {/* ══ MASTHEAD ══ marca serif + edição, regra grossa embaixo */}
      <header className="shrink-0 border-b-[3px] border-ink bg-paper pb-1.5 pt-2.5">
        <div className={clsx(borda, "flex flex-wrap items-end justify-between gap-x-4 gap-y-1")}>
          <Link
            href="/"
            className={clsx(
              // Peso 400 porque é o ÚNICO que o Instrument Serif tem. Pedir
              // `font-extrabold` aqui fazia o navegador engordar a letra por
              // deformação — negrito sintético — e a palavra encolhia de 107px
              // para 87px, borrada. Em display serif o peso vem do tamanho, e
              // o tracking abre um pouco: -0.04em era aperto de sans pesado.
              "font-serif text-[30px] font-normal leading-none tracking-[-0.02em] text-ink",
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
      <div className="shrink-0 border-b border-rule bg-paper py-1">
       <div className={clsx(borda, "flex flex-wrap items-center justify-between gap-x-4 gap-y-1")}>
        <span className="text-[11px] font-medium text-mut">
          São Paulo · {MESES[agora.getMonth()]} {agora.getFullYear()}
        </span>
        <span className="flex items-center gap-3">
          {aside}
          <span className="font-mono text-[11px] text-mut">
            mês · {formatCost(month).primary}
          </span>
          {/* Um botão, três estados. Três botões custariam espaço permanente por
              uma decisão que se toma uma vez. */}
          <button
            type="button"
            onClick={() => setTheme(nextTheme[theme])}
            aria-label={`Tema: ${themeLabel[theme]} — clique para ${themeLabel[nextTheme[theme]]}`}
            className={clsx(
              "flex items-center gap-1 text-[11px] font-medium text-mut transition hover:text-ink",
              focusRing,
            )}
          >
            <ThemeIcon size={12} aria-hidden="true" />
            <span>Tema · {themeLabel[theme]}</span>
          </button>
        </span>
       </div>
      </div>

      {/* ══ FAIXA ══ preta nos dois temas; LIVE é status, não rota */}
      {/* O fundo preto SANGRA de ponta a ponta; o conteúdo se alinha à medida.
          É como a tinta do cabeçalho de um jornal atravessa a folha enquanto a
          mancha de texto respeita a margem. */}
      <nav className="shrink-0 bg-band py-2 text-[11.5px] font-bold uppercase tracking-[0.06em] text-band-ink">
       <div className={clsx(borda, "flex flex-wrap items-center gap-x-4.5 gap-y-1")}>
        {/* O ponto diz o que espera VOCÊ, com a mesma regra do glifo da home
            (`esperandoDecisao`). Vermelho só quando há algo: cor de urgência sem
            urgência treina a pessoa a ignorar a cor.

            O VERMELHO FICA NO PONTO, NÃO NA FRASE — que é o que a spec pede
            ("ponto urgent") e o que o gate de contraste obriga. Pintar as
            palavras de `urgent` dava 3,93:1 sobre a faixa no tema claro, abaixo
            do piso de 4,5:1 de corpo, e justamente no texto que existe para
            avisar que algo espera decisão sua. A regra da seção 4 vale aqui sem
            adaptação: cor da paleta que não passa como letra vira ornamento —
            troca-se a letra, não se mexe na cor. Como ornamento o ponto tem
            3,93:1 no claro e 7,48:1 no escuro, acima do piso de 3:1.

            A urgência continua legível de duas formas somadas: o ponto colorido
            e a opacidade cheia, contra os 70% do resto da faixa. */}
        <Link
          href="/"
          className={clsx(
            "flex items-center gap-1 uppercase tracking-[0.06em] transition",
            focusRing,
            espera || fila.estado === "fora-do-ar"
              ? "opacity-100"
              : "opacity-70 hover:opacity-100",
          )}
        >
          <span aria-hidden="true" className={clsx(espera && "text-urgent")}>
            •
          </span>
          <span>
            {espera
              ? `${espera.total} ${espera.total === 1 ? "espera" : "esperam"} · ${espera.rotulo}`
              : fila.estado === "fora-do-ar"
                ? "fila indisponível"
                : "em dia"}
          </span>
        </Link>

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
                    "grid h-[18px] w-[18px] place-items-center rounded-full bg-band-ink text-[13px] font-extrabold leading-none text-band",
                    focusRing,
                  )}
                >
                  +
                </Link>
              ) : null}
            </span>
          );
        })}
       </div>
      </nav>

      <main className="min-h-0 flex-1">{children}</main>
    </div>
  );
}

/**
 * Container das telas de leitura.
 *
 * Usa a MESMA `medidaClass` da casca: o masthead, a dateline, a faixa e o corpo
 * compartilham uma borda esquerda e uma direita. Antes daqui eram duas larguras
 * diferentes — a casca em `px-5` de ponta a ponta e o corpo num `max-w-1440`
 * centrado —, e o desalinhamento entre as duas era parte do "está muito largo"
 * que o Daniel apontou em 08/09/2026.
 */
export function ShellPage({ children }: { children: ReactNode }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className={clsx(medidaClass, "flex flex-col gap-4 py-6")}>{children}</div>
    </div>
  );
}

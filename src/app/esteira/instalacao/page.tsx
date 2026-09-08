"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import { EsteiraShell, ShellPage } from "@/components/app/EsteiraShell";
import { BlockHead, CellGrid, PageHead, Sheet } from "@/components/app/Interior";

type Integration = {
  id: string;
  label: string;
  env: string[];
  configured: boolean;
};

/**
 * O que está ligado nesta instalação — sem imprimir valor de segredo.
 */
export default function InstalacaoPage() {
  const [rows, setRows] = useState<Integration[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    void fetch("/api/instalacao")
      .then((response) => {
        if (!response.ok) throw new Error("não foi possível ler o diagnóstico");
        return response.json();
      })
      .then((data) => {
        setRows(Array.isArray(data.integrations) ? data.integrations : []);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "falha ao carregar");
        setRows([]);
      });
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <EsteiraShell>
      <ShellPage>
        <PageHead secao="Instalação · esta máquina" titulo="O que está ligado aqui">
          Só o nome da variável e se ela está definida. O valor nunca aparece —
          a service role e a chave de agente não podem vazar para a tela.
        </PageHead>

        {/* A ausência passa a CONTAR. Antes a tela listava as variáveis sem
            dizer o que a falta custa; sem `APP_PASSWORD`, por exemplo, a
            diferença é entre localhost e uma URL pública aberta. */}
        {rows !== null ? (
          <CellGrid
            celulas={[
              { n: "01", valor: String(rows.filter((r) => r.configured).length), rotulo: "ligadas" },
              {
                n: "02",
                valor: String(rows.filter((r) => !r.configured).length),
                rotulo: "faltando",
                destaque: rows.some((r) => !r.configured),
                urgente: true,
              },
              { n: "03", valor: String(rows.length), rotulo: "conferidas" },
              { n: "04", valor: "—", rotulo: "o valor nunca aparece" },
            ]}
          />
        ) : null}

        {error ? (
          <p className="border border-urgent-line bg-urgent-bg px-4 py-3 text-[14px] text-ink">
            {error}
          </p>
        ) : null}

        {rows === null ? (
          <p className="text-[15px] text-mut" role="status" aria-live="polite">
            Lendo diagnóstico…
          </p>
        ) : (
          <>
            <BlockHead ponto={rows.some((r) => !r.configured)} nota="o valor nunca é impresso, nem para depurar">
              Ambiente · n={rows.length}
            </BlockHead>
            <Sheet>
              {rows.map((row, i) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[40px_1fr_auto] items-baseline gap-3 border-b border-dotted border-rule px-6 py-3.5 last:border-b-0"
                >
                  <span className="font-mono text-[11px] text-mut">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    {/* O NOME da variável é mono: é string do sistema. O que
                        ela faz é sans, porque é frase. */}
                    <span className="block font-mono text-[14.5px] text-ink">
                      {row.env.join(" · ")}
                    </span>
                    <span className="mt-1 block text-[13.5px] text-mut">{row.label}</span>
                  </span>
                  <span
                    data-status={row.configured ? "on" : "off"}
                    className={clsx(
                      "text-right text-[11.5px] font-semibold uppercase tracking-[0.07em]",
                      row.configured ? "text-ok" : "text-urgent",
                    )}
                  >
                    {row.configured ? "definida" : "faltando"}
                  </span>
                </div>
              ))}
            </Sheet>
          </>
        )}
      </ShellPage>
    </EsteiraShell>
  );
}

"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import { EsteiraShell, ShellPage } from "@/components/app/EsteiraShell";
import { labelClass, metaClass, panelClass } from "@/lib/ui";

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
        <div className="flex flex-col gap-0.5">
          <span className={labelClass}>Instalação</span>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            O que está ligado aqui
          </h1>
          <p className="text-[13px] text-mut">
            Só o nome da variável e se ela está definida. O valor nunca aparece —
            a service role e a chave de agente não podem vazar para a tela.
          </p>
        </div>

        {error ? (
          <p className="rounded-lg border border-danger-line bg-danger-bg px-3.5 py-3 text-[12.5px] text-danger">
            {error}
          </p>
        ) : null}

        {rows === null ? (
          <p className="text-[12.5px] text-mut" role="status" aria-live="polite">
            Lendo diagnóstico…
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map((row) => (
              <div
                key={row.id}
                className={clsx(panelClass, "flex flex-wrap items-center gap-3 px-3.5 py-3")}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[13px] font-medium text-ink">{row.label}</span>
                  <span className={metaClass}>{row.env.join(" · ")}</span>
                </span>
                <span
                  data-status={row.configured ? "on" : "off"}
                  className={clsx(
                    "rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide",
                    row.configured
                      ? "border-ok-line bg-ok-bg text-ok"
                      : "border-line bg-canvas text-mut",
                  )}
                >
                  {row.configured ? "ligado" : "desligado"}
                </span>
              </div>
            ))}
          </div>
        )}
      </ShellPage>
    </EsteiraShell>
  );
}

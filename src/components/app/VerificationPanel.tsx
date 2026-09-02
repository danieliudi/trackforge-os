"use client";

import clsx from "clsx";
import { AlertTriangle, Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import type { Verification } from "@/lib/verify";
import { focusRing } from "@/lib/ui";

type VerificationPanelProps = {
  verification: Verification;
  /**
   * Como nomear o bloco de cada afirmação. Sem isto vira "slide N", que é o
   * caso do carrossel; o artigo passa o título da seção, que é o que o leitor
   * consegue achar no texto.
   */
  labels?: Record<number, string>;
};

const VERDICT_LABEL: Record<string, string> = {
  rastreado: "rastreado",
  "sem-fonte": "sem fonte",
  contradiz: "contradiz a base",
};

/**
 * Parecer da verificação semântica.
 *
 * Fica abaixo do recibo e nunca bloqueia o export: quem edita e publica é o
 * usuário, e a peça já foi paga. O papel aqui é impedir que uma afirmação sem
 * lastro passe despercebida até depois de publicada — não substituir a leitura.
 */
export function VerificationPanel({ verification, labels }: VerificationPanelProps) {
  const [open, setOpen] = useState(false);
  const { claims, flagged } = verification;

  if (claims.length === 0) return null;

  const clean = flagged === 0;
  // Problema primeiro: com 12 afirmações rastreadas e 2 sem fonte, a ordem do
  // modelo enterraria justamente o que precisa de decisão.
  const ordered = [...claims].sort((a, b) =>
    Number(a.verdict === "rastreado") - Number(b.verdict === "rastreado"),
  );

  return (
    <div
      className={clsx(
        "overflow-hidden rounded-lg border",
        clean ? "border-line bg-surface" : "border-warn-line bg-warn-bg",
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={clsx(
          "flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition",
          clean ? "hover:bg-canvas" : "hover:bg-warn-bg/60",
          focusRing,
        )}
      >
        <span
          className={clsx(
            "flex items-center gap-2 text-xs",
            clean ? "text-mut" : "text-warn",
          )}
        >
          {clean ? (
            <Check size={13} className="shrink-0 text-ok" />
          ) : (
            <AlertTriangle size={13} className="shrink-0" />
          )}
          {clean ? (
            <span>
              <strong className="font-semibold">
                {claims.length} {claims.length === 1 ? "afirmação verificada" : "afirmações verificadas"}
              </strong>
              {claims.length === 1 ? ", rastreada até uma fonte" : ", todas rastreadas até uma fonte"}
            </span>
          ) : (
            <span>
              <strong className="font-semibold">
                {flagged} {flagged === 1 ? "afirmação" : "afirmações"} sem fonte
              </strong>{" "}
              de {claims.length} verificadas
            </span>
          )}
        </span>
        <ChevronDown
          size={14}
          className={clsx(
            "shrink-0 text-faint transition",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <dl className="border-t border-line2 bg-surface px-3.5 py-1">
          {ordered.map((claim, index) => (
            <div
              key={`${claim.blockNumber}-${index}`}
              className="grid grid-cols-[auto_1fr] gap-x-2.5 border-b border-line2 py-2 last:border-b-0"
            >
              <dt className="max-w-[7.5rem] truncate pt-0.5 font-mono text-[10px] tabular-nums text-faint">
                {labels?.[claim.blockNumber] ?? `slide ${claim.blockNumber}`}
              </dt>
              <dd className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[11.5px] leading-snug text-ink">{claim.claim}</span>
                <span
                  className={clsx(
                    "text-[10.5px] leading-snug",
                    claim.verdict === "rastreado" ? "text-mut" : "text-warn",
                  )}
                >
                  {VERDICT_LABEL[claim.verdict] ?? claim.verdict}
                  {claim.source ? ` — ${claim.source}` : ""}
                  {claim.note ? ` — ${claim.note}` : ""}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

"use client";

import clsx from "clsx";
import { AlertTriangle, Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import type { Verification } from "@/lib/verify";
import { focusRing } from "@/lib/ui";

type VerificationPanelProps = {
  verification: Verification;
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
export function VerificationPanel({ verification }: VerificationPanelProps) {
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
        clean ? "border-zinc-200 bg-white" : "border-amber-200 bg-amber-50",
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={clsx(
          "flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition",
          clean ? "hover:bg-zinc-50" : "hover:bg-amber-100/60",
          focusRing,
        )}
      >
        <span
          className={clsx(
            "flex items-center gap-2 text-xs",
            clean ? "text-zinc-600" : "text-amber-900",
          )}
        >
          {clean ? (
            <Check size={13} className="shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle size={13} className="shrink-0" />
          )}
          {clean ? (
            <span>
              <strong className="font-semibold">{claims.length} afirmações verificadas</strong>,
              todas rastreadas até uma fonte
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
            "shrink-0 text-zinc-400 transition",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <dl className="border-t border-zinc-100 bg-white px-3.5 py-1">
          {ordered.map((claim, index) => (
            <div
              key={`${claim.slideNumber}-${index}`}
              className="grid grid-cols-[auto_1fr] gap-x-2.5 border-b border-zinc-100 py-2 last:border-b-0"
            >
              <dt className="pt-0.5 font-mono text-[10px] tabular-nums text-zinc-400">
                slide {claim.slideNumber}
              </dt>
              <dd className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[11.5px] leading-snug text-zinc-900">{claim.claim}</span>
                <span
                  className={clsx(
                    "text-[10.5px] leading-snug",
                    claim.verdict === "rastreado" ? "text-zinc-500" : "text-amber-700",
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

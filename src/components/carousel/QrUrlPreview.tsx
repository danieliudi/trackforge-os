"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { IconButton } from "@/components/ui/Button";
import { labelClass } from "@/lib/ui";

type QrUrlPreviewProps = {
  url: string;
  /** Rótulo acima do link. Default: "Link final do QR". */
  label?: string;
  /** Nota curta abaixo do link (content_id, aviso de produção, etc.). */
  note?: string;
};

/**
 * Mostra a URL inteira do QR com botão de copiar.
 *
 * O campo truncado + nota em cinza era a única pista do destino — e sumia
 * metade do UTM. Aqui o link é o objeto, não um input estreito.
 */
export function QrUrlPreview({
  url,
  label = "Link final do QR",
  note,
}: QrUrlPreviewProps) {
  const [copied, setCopied] = useState(false);

  if (!url.trim()) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Sem clipboard (iframe/permissão): o texto já está selecionável.
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className={labelClass}>{label}</span>
        <IconButton
          icon={copied ? Check : Copy}
          label={copied ? "Copiado" : "Copiar link do QR"}
          size="sm"
          variant="secondary"
          onClick={() => void copy()}
        />
      </div>
      <p className="break-all rounded-md border border-line2 bg-canvas px-2.5 py-2 font-mono text-[11px] leading-relaxed text-ink select-all">
        {url}
      </p>
      {note ? <p className="text-[11px] leading-relaxed text-mut">{note}</p> : null}
    </div>
  );
}

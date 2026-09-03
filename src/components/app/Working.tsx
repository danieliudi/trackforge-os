"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * O aviso de "está sendo gerado", no lugar onde o resultado vai cair.
 *
 * ANTES ELE VIVIA SÓ NO BOTÃO, no rodapé de uma coluna que rola — fora da vista
 * em tela cheia — enquanto o centro continuava dizendo "o artigo aparece aqui".
 * Quem clicava e olhava para o meio da tela via a mesma coisa de antes de
 * clicar, por dezenas de segundos. O sinal precisa estar onde a pessoa está
 * olhando, que é onde a resposta vai aparecer.
 *
 * O RELÓGIO É O ÚNICO NÚMERO AQUI, e é medido. Não há barra de progresso nem
 * "faltam 20 segundos": o servidor não devolve etapa nem previsão, e inventar
 * uma barra que anda sozinha seria a versão visual de estimar um dado — o que
 * esta ferramenta inteira existe para não fazer.
 */
export function Working({
  title,
  note,
  lines = 3,
}: {
  title: string;
  note?: string;
  /** Quantas linhas de esqueleto sugerir abaixo — a forma do que vem. */
  lines?: number;
}) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-4 px-6 py-14 text-center"
    >
      <Loader2 size={22} className="animate-spin text-acc" />

      <span className="flex flex-col gap-1">
        <span className="text-[15px] font-semibold tracking-tight text-ink">{title}</span>
        {note ? <span className="max-w-sm text-[12.5px] leading-snug text-mut">{note}</span> : null}
      </span>

      <span className="font-mono text-[11px] tabular-nums text-faint">
        {seconds}s
      </span>

      {lines > 0 ? (
        <span aria-hidden className="mt-2 flex w-full max-w-xl flex-col gap-2.5">
          {Array.from({ length: lines }).map((_, index) => (
            <span
              key={index}
              className="h-2.5 animate-pulse rounded bg-surface2"
              style={{
                // Larguras irregulares: barras iguais parecem tabela, não texto.
                width: `${[100, 92, 64, 88, 71][index % 5]}%`,
                animationDelay: `${index * 140}ms`,
              }}
            />
          ))}
        </span>
      ) : null}
    </div>
  );
}

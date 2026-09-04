"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import type { Production } from "@/lib/produced";
import { labelClass, metaClass, panelClass } from "@/lib/ui";

type UnsentListProps = {
  items: Production[];
};

export function UnsentList({ items }: UnsentListProps) {
  const router = useRouter();

  return (
    <div className={`${panelClass} flex flex-col gap-2 px-4 py-3.5`}>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-acc" aria-hidden />
        <span className={labelClass}>Produzido e não enviado</span>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-3 py-3 text-[12.5px] text-mut">
          Nada pendente de envio nesta frente.
        </p>
      ) : (
        <ul className="flex flex-col">
          {items.slice(0, 6).map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 border-b border-line2 py-2.5 last:border-b-0"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-ink">{item.title}</span>
                <span className={metaClass}>
                  {item.pieces.length} {item.pieces.length === 1 ? "peça" : "peças"}
                  {" · "}
                  {new Date(item.at).toLocaleDateString("pt-BR")}
                </span>
              </span>
              <Button size="sm" onClick={() => router.push(`/esteira?abrir=${item.id}`)}>
                Abrir
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

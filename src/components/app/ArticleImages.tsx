"use client";

import clsx from "clsx";
import { Check, ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { ImageSearchPanel, type PickedImage } from "@/components/carousel/ImageSearchPanel";
import { Button } from "@/components/ui/Button";
import { brands, type BrandId } from "@/constants/brands";
import { labelClass, panelClass } from "@/lib/ui";
import type { ChosenImage, ImageIdea } from "@/types/article";

/**
 * As imagens do artigo: a ferramenta sugere onde procurar, você escolhe.
 *
 * NÃO EXISTE GERAÇÃO DE IMAGEM AQUI, e é decisão, não falta. Uma foto sintética
 * de um pátio com big bag é uma afirmação visual sobre um produto real feita por
 * um modelo que nunca o viu — e a imagem é a afirmação em que o leitor acredita
 * primeiro, antes de ler uma linha. O resto da ferramenta existe para não
 * afirmar o que não sustenta; abrir exceção justamente no elemento mais
 * persuasivo seria furar a regra no ponto que mais importa.
 *
 * A BIBLIOTECA DA MARCA ABRE PRIMEIRO quando tem foto. Foto sua é do produto
 * que existe, com a marca certa; foto de acervo é ilustração de contexto. A
 * ordem das abas é essa preferência escrita na interface.
 */

type ArticleImagesProps = {
  ideas: ImageIdea[];
  chosen: Record<string, ChosenImage>;
  onChange: (chosen: Record<string, ChosenImage>) => void;
  brandId: BrandId | null;
};

export function ArticleImages({ ideas, chosen, onChange, brandId }: ArticleImagesProps) {
  const [openSlot, setOpenSlot] = useState<string | null>(null);
  const [hasLibrary, setHasLibrary] = useState<boolean | null>(null);

  // Saber se a biblioteca tem foto decide qual aba abre. Sem isto a aba da
  // marca abriria vazia — que sugere "não tem nada" quando o certo é "não tem
  // nada NESTA frente".
  useEffect(() => {
    let live = true;
    fetch(brandId ? `/api/assets/library?brandId=${brandId}` : "/api/assets/library")
      .then((response) => response.json())
      .then((data) => {
        if (live) setHasLibrary((data.images ?? []).length > 0);
      })
      .catch(() => {
        if (live) setHasLibrary(false);
      });
    return () => {
      live = false;
    };
  }, [brandId]);

  if (ideas.length === 0) return null;

  const count = Object.keys(chosen).length;
  const brandLabel = brandId ? brands[brandId].label : undefined;

  const pick = (slot: string, image: PickedImage) => {
    onChange({ ...chosen, [slot]: { slot, ...image } });
    setOpenSlot(null);
  };

  const drop = (slot: string) => {
    const next = { ...chosen };
    delete next[slot];
    onChange(next);
  };

  return (
    <div className={clsx(panelClass, "flex flex-col")}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-3.5 pb-2.5 pt-3">
        <span className={labelClass}>Imagens do artigo</span>
        <span className="font-mono text-[10.5px] text-faint">
          {ideas.length} {ideas.length === 1 ? "sugestão" : "sugestões"} ·{" "}
          {count === 0
            ? "nenhuma escolhida"
            : `${count} escolhida${count === 1 ? "" : "s"}`}
        </span>
      </div>

      {ideas.map((idea) => {
        const image = chosen[idea.slot];
        const open = openSlot === idea.slot;

        return (
          <div key={idea.slot} className="border-t border-line2">
            <div
              className={clsx(
                "flex flex-wrap items-start gap-x-3 gap-y-2 px-3.5 py-3",
                open && "bg-canvas/70",
              )}
            >
              {image ? (
                /* eslint-disable-next-line @next/next/no-img-element -- remoto ou servido pelo próprio app; sem ganho em otimizar miniatura */
                <img
                  src={image.url}
                  alt={image.alt || idea.describes}
                  className="h-14 w-14 shrink-0 rounded-md border border-line object-cover"
                />
              ) : null}

              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-mono text-[10px] uppercase tracking-wide text-faint">
                  {idea.slot}
                </span>
                <span className="text-[13px] leading-snug text-ink2">
                  {image?.fileName ?? idea.describes}
                </span>

                {image ? (
                  <span className="text-[11px] leading-snug text-mut">
                    {image.fileName
                      ? `Biblioteca ${brandLabel ?? ""} · vai anexada, não por link`.replace(
                          /\s+·/,
                          " ·",
                        )
                      : image.credit
                        ? `Foto: ${image.credit} · Unsplash`
                        : "Sem crédito informado"}
                  </span>
                ) : (
                  <span className="mt-0.5 w-fit rounded border border-line bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-mut">
                    {idea.query}
                  </span>
                )}
              </span>

              <span className="flex shrink-0 items-center gap-1.5">
                <Button size="sm" onClick={() => setOpenSlot(open ? null : idea.slot)}>
                  {open ? "Fechar" : image ? "Trocar" : "Procurar"}
                </Button>
                {image ? (
                  <Button size="sm" variant="ghost" onClick={() => drop(idea.slot)}>
                    Remover
                  </Button>
                ) : null}
              </span>
            </div>

            {open ? (
              <div className="px-3.5 pb-3">
                <ImageSearchPanel
                  brandId={brandId}
                  brandLabel={brandLabel}
                  initialQuery={idea.query}
                  initialTab={hasLibrary ? "biblioteca" : "unsplash"}
                  onSelect={(picked) => pick(idea.slot, picked)}
                />
              </div>
            ) : null}
          </div>
        );
      })}

      <p className="flex items-start gap-1.5 border-t border-line2 px-3.5 py-2.5 text-[11.5px] leading-snug text-faint">
        {count > 0 ? (
          <>
            <Check size={13} className="mt-px shrink-0 text-ok" />
            <span>
              <span className="text-ok">
                {count === 1 ? "A imagem entra" : `As ${count} imagens entram`} no markdown, com
                crédito.
              </span>{" "}
              Sem escolher nenhuma, o artigo sai como sai hoje — só texto.
            </span>
          </>
        ) : (
          <>
            <ImageIcon size={13} className="mt-px shrink-0" />
            <span>
              A ferramenta não gera imagem — sugere onde procurar. A foto vem da sua biblioteca
              ou do acervo, e o crédito vai junto no markdown entregue.
            </span>
          </>
        )}
      </p>
    </div>
  );
}

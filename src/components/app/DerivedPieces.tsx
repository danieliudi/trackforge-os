"use client";

import clsx from "clsx";
import { AlertTriangle, ArrowRight, Check, PenLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { VerificationPanel } from "@/components/app/VerificationPanel";
import { Button } from "@/components/ui/Button";
import { brands, type BrandId } from "@/constants/brands";
import { platformOptions, type Platform } from "@/constants/format";
import type { ForbiddenHit } from "@/knowledge/check";
import { addDraft } from "@/lib/storage";
import { labelClass, panelClass } from "@/lib/ui";
import type { Verification } from "@/lib/verify";
import type { Carousel } from "@/types/carousel";

export type DerivedPiece = {
  platform: Platform;
  carousel: Carousel;
  warnings: ForbiddenHit[];
  verification: Verification | null;
};

type DerivedPiecesProps = {
  pieces: DerivedPiece[];
  brandId: BrandId | null;
};

const platformLabel = (platform: Platform) =>
  platformOptions.find(({ id }) => id === platform)?.label ?? platform;

/**
 * As peças que saíram do artigo, na ordem em que foram escritas.
 *
 * A ordem aparece na tela de propósito: quem lê precisa saber que o Instagram
 * saiu do LinkedIn, não do tema. É a diferença entre uma peça conferida e três
 * peças que ninguém comparou entre si.
 */
export function DerivedPieces({ pieces, brandId }: DerivedPiecesProps) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  const openInEditor = useCallback(
    (piece: DerivedPiece) => {
      const saved = addDraft({
        id: crypto.randomUUID(),
        title: piece.carousel.title,
        updatedAt: Date.now(),
        carousel: piece.carousel,
        themeId: brandId ? brands[brandId].themeId : "dark-modern",
        brandId,
        customLogo: null,
        format: "carrossel",
        platform: piece.platform,
      });

      if (!saved) {
        setFailed(true);
        return;
      }
      router.push("/editor");
    },
    [brandId, router],
  );

  return (
    <div className="flex flex-col gap-4">
      {failed ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] text-amber-900">
          O navegador recusou salvar a peça — provavelmente falta espaço. Apague um
          rascunho antigo e tente de novo.
        </p>
      ) : null}

      {pieces.map((piece, index) => {
        const flagged = piece.verification?.flagged ?? 0;
        const source = index === 0 ? "do artigo" : `do ${platformLabel(pieces[index - 1].platform)}`;

        return (
          <div key={piece.platform} className={clsx(panelClass, "flex flex-col gap-3 p-4")}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="flex items-baseline gap-2">
                <span className="text-sm font-semibold tracking-tight text-zinc-900">
                  {platformLabel(piece.platform)}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wide text-zinc-400">
                  derivado {source}
                </span>
              </span>
              <span className="font-mono text-[10.5px] tabular-nums text-zinc-500">
                {piece.carousel.slides.length} slides
              </span>
            </div>

            <p className="text-[13px] leading-snug text-zinc-700">{piece.carousel.title}</p>

            <ol className="flex flex-col gap-1">
              {piece.carousel.slides.map((slide) => (
                <li
                  key={slide.slideNumber}
                  className="grid grid-cols-[1.4rem_1fr] gap-2 text-[11.5px] leading-snug text-zinc-500"
                >
                  <span className="font-mono tabular-nums text-zinc-300">
                    {String(slide.slideNumber).padStart(2, "0")}
                  </span>
                  <span className="truncate text-zinc-700">{slide.headline}</span>
                </li>
              ))}
            </ol>

            {piece.warnings.length > 0 ? (
              <div className="flex flex-col gap-0.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11.5px] text-amber-900">
                <span className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle size={12} />
                  Termo proibido pela marca
                </span>
                {piece.warnings.map((hit, position) => (
                  <span key={position}>
                    “{hit.matched}” no slide {hit.blockNumber} — {hit.reason}
                  </span>
                ))}
              </div>
            ) : null}

            {piece.verification ? (
              <VerificationPanel verification={piece.verification} />
            ) : null}

            <div className="flex items-center gap-2 border-t border-zinc-100 pt-3">
              <Button icon={PenLine} size="sm" onClick={() => openInEditor(piece)}>
                Abrir no editor
              </Button>
              {flagged === 0 && piece.verification ? (
                <span className="flex items-center gap-1 text-[11px] text-emerald-700">
                  <Check size={12} />
                  tudo rastreado até o artigo
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Cabeçalho da seção, com a corrente explícita. */
export function DerivationChain({ done }: { done: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={labelClass}>Peças derivadas</span>
      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-zinc-400">
        Artigo
        <ArrowRight size={11} />
        LinkedIn
        <ArrowRight size={11} />
        Instagram
      </span>
      {done ? (
        <span className="flex items-center gap-1 text-[10.5px] text-emerald-700">
          <Check size={11} />
          pronto
        </span>
      ) : null}
    </div>
  );
}

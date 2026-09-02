"use client";

import clsx from "clsx";
import { AlertTriangle, Check, Copy, PenLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { VerificationPanel } from "@/components/app/VerificationPanel";
import { Button } from "@/components/ui/Button";
import { brands, type BrandId } from "@/constants/brands";
import type { ForbiddenHit } from "@/knowledge/check";
import { addDraft } from "@/lib/storage";
import { panelClass } from "@/lib/ui";
import type { Verification } from "@/lib/verify";
import type { Carousel } from "@/types/carousel";
import {
  isCarousel,
  OUTPUT_META,
  type Legenda,
  type OutputKind,
  type PostTexto,
  type Reels,
  type Stories,
} from "@/types/outputs";

export type Piece = {
  kind: OutputKind;
  data: unknown;
  /** "derivado do artigo", "do material colado" — a origem fica visível. */
  from: string;
  warnings: ForbiddenHit[];
  verification: Verification | null;
};

/**
 * Cada formato desenhado como ele é lido, não como uma lista genérica.
 *
 * O Reels mostra o tempo por bloco porque o roteiro só funciona se couber no
 * vídeo; o Stories mostra as telas separadas porque cada uma é um toque; a
 * legenda separa a primeira linha porque é a única que aparece antes do corte.
 * Renderizar os quatro como parágrafo esconderia justamente o que diferencia um
 * do outro.
 */

const line = "text-[13px] leading-relaxed text-ink2";

function CarouselBody({ carousel }: { carousel: Carousel }) {
  return (
    <ol className="flex flex-col gap-1">
      {carousel.slides.map((slide) => (
        <li
          key={slide.slideNumber}
          className="grid grid-cols-[1.4rem_1fr] gap-2 text-[12px] leading-snug"
        >
          <span className="font-mono tabular-nums text-faint">
            {String(slide.slideNumber).padStart(2, "0")}
          </span>
          <span className="text-ink2">{slide.headline}</span>
        </li>
      ))}
    </ol>
  );
}

function Hook({ text }: { text: string }) {
  return (
    <p className="border-l-2 border-acc pl-2.5 text-[13.5px] font-medium leading-snug text-ink">
      {text}
    </p>
  );
}

function Cta({ text }: { text: string }) {
  return <p className="text-[12.5px] italic leading-snug text-mut">{text}</p>;
}

function PieceBody({ kind, data }: { kind: OutputKind; data: unknown }) {
  if (isCarousel(kind)) return <CarouselBody carousel={data as Carousel} />;

  if (kind === "post-texto") {
    const post = data as PostTexto;
    return (
      <div className="flex flex-col gap-2.5">
        <Hook text={post.hook} />
        {post.paragraphs.map((paragraph, index) => (
          <p key={index} className={line}>
            {paragraph}
          </p>
        ))}
        <Cta text={post.cta} />
      </div>
    );
  }

  if (kind === "legenda") {
    const legenda = data as Legenda;
    return (
      <div className="flex flex-col gap-2.5">
        <Hook text={legenda.hook} />
        {legenda.body.map((text, index) => (
          <p key={index} className={line}>
            {text}
          </p>
        ))}
        <Cta text={legenda.cta} />
        {legenda.hashtags.length > 0 ? (
          <p className="font-mono text-[11px] text-faint">
            {legenda.hashtags.map((tag) => `#${tag.replace(/^#/, "")}`).join(" ")}
          </p>
        ) : null}
      </div>
    );
  }

  if (kind === "reels") {
    const reels = data as Reels;
    const total = reels.beats.reduce((sum, beat) => sum + beat.seconds, 0);
    return (
      <div className="flex flex-col gap-2.5">
        <Hook text={reels.hook} />
        <div className="flex flex-col gap-2">
          {reels.beats.map((beat, index) => (
            <div key={index} className="grid grid-cols-[2.6rem_1fr] gap-2.5">
              <span className="pt-0.5 font-mono text-[10.5px] tabular-nums text-faint">
                {beat.seconds}s
              </span>
              <span className="flex flex-col gap-0.5">
                <span className={line}>{beat.fala}</span>
                <span className="font-mono text-[10.5px] uppercase tracking-wide text-faint">
                  na tela: {beat.naTela}
                </span>
              </span>
            </div>
          ))}
        </div>
        <Cta text={reels.cta} />
        <span className="font-mono text-[10px] text-faint">{total}s no total</span>
      </div>
    );
  }

  const stories = data as Stories;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2">
        {stories.screens.map((screen, index) => (
          <div
            key={index}
            className="flex min-h-[6.5rem] w-[9.5rem] flex-col gap-1.5 rounded-md border border-line bg-canvas px-2.5 py-2"
          >
            <span className="font-mono text-[9.5px] uppercase tracking-wide text-faint">
              {index + 1} de {stories.screens.length}
            </span>
            <span className="text-[11.5px] leading-snug text-ink2">{screen.texto}</span>
            {screen.interacao ? (
              <span className="mt-auto rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] text-mut">
                {screen.interacao}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <Cta text={stories.cta} />
    </div>
  );
}

/** Texto plano da peça, para colar direto onde ela vai ser publicada. */
function toPlainText(kind: OutputKind, data: unknown): string {
  if (isCarousel(kind)) {
    const carousel = data as Carousel;
    return carousel.slides
      .map((s) => `${s.slideNumber}. ${s.headline}${s.bodyText ? `\n${s.bodyText}` : ""}`)
      .join("\n\n");
  }
  if (kind === "post-texto") {
    const post = data as PostTexto;
    return [post.hook, "", ...post.paragraphs.flatMap((p) => [p, ""]), post.cta].join("\n");
  }
  if (kind === "legenda") {
    const legenda = data as Legenda;
    const tags = legenda.hashtags.map((t) => `#${t.replace(/^#/, "")}`).join(" ");
    return [legenda.hook, "", ...legenda.body, "", legenda.cta, tags].filter(Boolean).join("\n");
  }
  if (kind === "reels") {
    const reels = data as Reels;
    return [
      `GANCHO: ${reels.hook}`,
      "",
      ...reels.beats.map((b) => `[${b.seconds}s] ${b.fala}\n   na tela: ${b.naTela}`),
      "",
      reels.cta,
    ].join("\n");
  }
  const stories = data as Stories;
  return [
    ...stories.screens.map(
      (s, i) => `TELA ${i + 1}: ${s.texto}${s.interacao ? `\n   interação: ${s.interacao}` : ""}`,
    ),
    "",
    stories.cta,
  ].join("\n");
}

export function OutputPieces({
  pieces,
  brandId,
}: {
  pieces: Piece[];
  brandId: BrandId | null;
}) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const openInEditor = useCallback(
    (piece: Piece) => {
      const carousel = piece.data as Carousel;
      const saved = addDraft({
        id: crypto.randomUUID(),
        title: carousel.title,
        updatedAt: Date.now(),
        carousel,
        themeId: brandId ? brands[brandId].themeId : "dark-modern",
        brandId,
        customLogo: null,
        format: "carrossel",
        platform: piece.kind === "carrossel-instagram" ? "instagram" : "linkedin",
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
        <p className="rounded-lg border border-warn-line bg-warn-bg px-3.5 py-2.5 text-[12px] text-warn">
          O navegador recusou salvar a peça — provavelmente falta espaço. Apague um
          rascunho antigo e tente de novo.
        </p>
      ) : null}

      {pieces.map((piece) => {
        const meta = OUTPUT_META[piece.kind];
        const flagged = piece.verification?.flagged ?? 0;

        return (
          <div
            key={piece.kind}
            className={clsx(panelClass, "flex flex-col gap-3 p-4")}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-semibold tracking-tight text-ink">
                  {meta.label}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wide text-faint">
                  {meta.platform} · {piece.from}
                </span>
              </span>
            </div>

            <PieceBody kind={piece.kind} data={piece.data} />

            {piece.warnings.length > 0 ? (
              <div className="flex flex-col gap-0.5 rounded-md border border-warn-line bg-warn-bg px-2.5 py-2 text-[11.5px] text-warn">
                <span className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle size={12} />
                  Termo proibido pela marca
                </span>
                {piece.warnings.map((hit, index) => (
                  <span key={index}>
                    “{hit.matched}” — {hit.reason}
                  </span>
                ))}
              </div>
            ) : null}

            {piece.verification ? (
              <VerificationPanel verification={piece.verification} />
            ) : null}

            <div className="flex flex-wrap items-center gap-2 border-t border-line2 pt-3">
              <Button
                icon={copied === piece.kind ? Check : Copy}
                size="sm"
                onClick={() => {
                  void navigator.clipboard.writeText(toPlainText(piece.kind, piece.data));
                  setCopied(piece.kind);
                  setTimeout(() => setCopied(null), 1800);
                }}
              >
                {copied === piece.kind ? "Copiado" : "Copiar texto"}
              </Button>
              {isCarousel(piece.kind) ? (
                <Button icon={PenLine} size="sm" onClick={() => openInEditor(piece)}>
                  Abrir no editor
                </Button>
              ) : null}
              {flagged === 0 && piece.verification ? (
                <span className="flex items-center gap-1 text-[11px] text-ok">
                  <Check size={12} />
                  tudo rastreado até a origem
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

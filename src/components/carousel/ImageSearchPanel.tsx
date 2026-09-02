"use client";

import clsx from "clsx";
import { ExternalLink, Loader2, SearchX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { BrandId } from "@/constants/brands";
import { fieldClass, focusRing } from "@/lib/ui";

type UnsplashResult = {
  id: string;
  thumbUrl: string;
  fullUrl: string;
  alt: string;
  credit: string;
  creditUrl: string;
  downloadLocation: string;
};

type LibraryImage = {
  name: string;
  path: string;
};

const SEARCH_DELAY = 400;
const TABS = [
  { id: "unsplash", label: "Unsplash" },
  { id: "biblioteca", label: "Biblioteca" },
] as const;
type Tab = (typeof TABS)[number]["id"];

type ImageSearchPanelProps = {
  onSelect: (image: PickedImage) => void;
  /** Frente cuja biblioteca abrir. Sem isto, cai na pasta padrão. */
  brandId?: BrandId | null;
  /** Termo já preenchido — usado quando a busca vem de uma sugestão do artigo. */
  initialQuery?: string;
  /** Aba inicial. A biblioteca da marca vem antes quando ela tem foto. */
  initialTab?: Tab;
  /** Nome da frente na aba: "Biblioteca Resibag" diz de quem é a pasta aberta. */
  brandLabel?: string;
};

/**
 * O que a escolha devolve.
 *
 * Antes era só a URL, porque o slide só precisava dela. O artigo precisa do
 * crédito junto: foto de acervo tem exigência de atribuição, e um crédito que
 * depende de alguém lembrar de copiar é um crédito que não vai sair.
 */
export type PickedImage = {
  url: string;
  alt: string;
  credit: string | null;
  creditUrl: string | null;
  fileName: string | null;
};

export function ImageSearchPanel({
  onSelect,
  brandId,
  initialQuery,
  initialTab = "unsplash",
  brandLabel,
}: ImageSearchPanelProps) {
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div className="flex flex-col gap-2 rounded-md border border-line bg-canvas p-2.5">
      <div className="flex w-fit gap-0.5 rounded-md border border-line bg-surface p-0.5">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className={clsx(
              "rounded px-2.5 py-1 text-[11px] font-medium transition",
              focusRing,
              tab === id ? "bg-acc text-acc-ink" : "text-mut hover:text-ink",
            )}
          >
            {id === "biblioteca" && brandLabel ? `${label} ${brandLabel}` : label}
          </button>
        ))}
      </div>

      {tab === "unsplash" ? (
        <UnsplashTab onSelect={onSelect} initialQuery={initialQuery} />
      ) : (
        <LibraryTab onSelect={onSelect} brandId={brandId} />
      )}
    </div>
  );
}

function UnsplashTab({
  onSelect,
  initialQuery,
}: {
  onSelect: (image: PickedImage) => void;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [results, setResults] = useState<UnsplashResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/images/search?q=${encodeURIComponent(trimmed)}`);
        const data = await response.json();
        if (id !== requestId.current) return;
        if (!response.ok) throw new Error(data.error ?? "falha ao buscar imagens");
        setResults(data.results);
        setError(null);
      } catch (cause) {
        if (id !== requestId.current) return;
        setError(cause instanceof Error ? cause.message : "falha ao buscar imagens");
        setResults(null);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, SEARCH_DELAY);

    return () => clearTimeout(timer);
  }, [query]);

  function select(photo: UnsplashResult) {
    onSelect({
      url: photo.fullUrl,
      alt: photo.alt,
      credit: photo.credit,
      creditUrl: photo.creditUrl,
      fileName: null,
    });
    // Fire-and-forget: exigido pelas diretrizes da API do Unsplash quando a foto é usada de fato.
    fetch("/api/images/track-download", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ downloadLocation: photo.downloadLocation }),
    }).catch(() => {});
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        autoFocus
        value={query}
        onChange={(event) => {
          const value = event.target.value;
          setQuery(value);
          if (!value.trim()) {
            requestId.current++;
            setResults(null);
            setError(null);
            setLoading(false);
          }
        }}
        placeholder="Buscar no Unsplash…"
        className={fieldClass}
      />

      {loading ? (
        <div className="flex items-center justify-center gap-1.5 py-4 text-xs text-mut">
          <Loader2 size={13} className="animate-spin" />
          Buscando…
        </div>
      ) : error ? (
        <p className="py-2 text-center text-xs text-danger">{error}</p>
      ) : results?.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-4 text-xs text-mut">
          <SearchX size={16} />
          Nada encontrado
        </div>
      ) : results ? (
        <div className="grid grid-cols-4 gap-1.5">
          {results.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => select(photo)}
              title={`Foto de ${photo.credit} no Unsplash`}
              className={`group relative aspect-square overflow-hidden rounded ${focusRing}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail remoto, sem necessidade de otimização do next/image */}
              <img
                src={photo.thumbUrl}
                alt={photo.alt}
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[9px] text-white opacity-0 transition group-hover:opacity-100">
                {photo.credit}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Só escolhe e insere — upload e exclusão de arquivo real moram na página
 * /biblioteca. Assim nunca existem dois lugares editando a mesma lista.
 */
function LibraryTab({
  onSelect,
  brandId,
}: {
  onSelect: (image: PickedImage) => void;
  brandId?: BrandId | null;
}) {
  const [images, setImages] = useState<LibraryImage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch(brandId ? `/api/assets/library?brandId=${brandId}` : "/api/assets/library")
      .then((response) => response.json())
      .then((data) => setImages(data.images))
      .catch(() => setError("falha ao carregar a biblioteca"));
  }, [brandId]);

  const filtered = images?.filter((image) =>
    image.name.toLowerCase().includes(filter.trim().toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-2">
      <input
        autoFocus
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder="Filtrar por nome…"
        className={fieldClass}
      />

      {error ? (
        <p className="py-2 text-center text-xs text-danger">{error}</p>
      ) : !images ? (
        <div className="flex items-center justify-center gap-1.5 py-4 text-xs text-mut">
          <Loader2 size={13} className="animate-spin" />
          Carregando…
        </div>
      ) : filtered?.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-4 text-xs text-mut">
          <SearchX size={16} />
          Nada encontrado
        </div>
      ) : (
        <div className="grid max-h-56 grid-cols-4 gap-1.5 overflow-y-auto">
          {filtered?.map((image) => (
            <button
              key={image.path}
              type="button"
              onClick={() =>
                onSelect({
                  url: `${window.location.origin}${image.path}`,
                  alt: image.name,
                  credit: null,
                  creditUrl: null,
                  fileName: image.name,
                })
              }
              title={image.name}
              className={`group relative aspect-square overflow-hidden rounded bg-surface2 ${focusRing}`}
            >
              <Image
                src={image.path}
                alt={image.name}
                fill
                sizes="100px"
                className="object-cover transition group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}

      <Link
        href="/biblioteca"
        target="_blank"
        className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-line py-1.5 text-[11px] font-medium text-mut transition hover:border-acc hover:text-ink"
      >
        Gerenciar biblioteca
        <ExternalLink size={11} />
      </Link>
    </div>
  );
}

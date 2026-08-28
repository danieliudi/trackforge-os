"use client";

import clsx from "clsx";
import { ExternalLink, Loader2, SearchX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
  onSelect: (url: string) => void;
};

export function ImageSearchPanel({ onSelect }: ImageSearchPanelProps) {
  const [tab, setTab] = useState<Tab>("unsplash");

  return (
    <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-2.5">
      <div className="flex w-fit gap-0.5 rounded-md border border-zinc-200 bg-white p-0.5">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className={clsx(
              "rounded px-2.5 py-1 text-[11px] font-medium transition",
              focusRing,
              tab === id ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "unsplash" ? <UnsplashTab onSelect={onSelect} /> : <LibraryTab onSelect={onSelect} />}
    </div>
  );
}

function UnsplashTab({ onSelect }: { onSelect: (url: string) => void }) {
  const [query, setQuery] = useState("");
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
    onSelect(photo.fullUrl);
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
        <div className="flex items-center justify-center gap-1.5 py-4 text-xs text-zinc-500">
          <Loader2 size={13} className="animate-spin" />
          Buscando…
        </div>
      ) : error ? (
        <p className="py-2 text-center text-xs text-red-600">{error}</p>
      ) : results?.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-4 text-xs text-zinc-500">
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
function LibraryTab({ onSelect }: { onSelect: (url: string) => void }) {
  const [images, setImages] = useState<LibraryImage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/assets/library")
      .then((response) => response.json())
      .then((data) => setImages(data.images))
      .catch(() => setError("falha ao carregar a biblioteca"));
  }, []);

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
        <p className="py-2 text-center text-xs text-red-600">{error}</p>
      ) : !images ? (
        <div className="flex items-center justify-center gap-1.5 py-4 text-xs text-zinc-500">
          <Loader2 size={13} className="animate-spin" />
          Carregando…
        </div>
      ) : filtered?.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-4 text-xs text-zinc-500">
          <SearchX size={16} />
          Nada encontrado
        </div>
      ) : (
        <div className="grid max-h-56 grid-cols-4 gap-1.5 overflow-y-auto">
          {filtered?.map((image) => (
            <button
              key={image.path}
              type="button"
              onClick={() => onSelect(`${window.location.origin}${image.path}`)}
              title={image.name}
              className={`group relative aspect-square overflow-hidden rounded bg-zinc-100 ${focusRing}`}
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
        className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-zinc-300 py-1.5 text-[11px] font-medium text-zinc-600 transition hover:border-zinc-900 hover:text-zinc-900"
      >
        Gerenciar biblioteca
        <ExternalLink size={11} />
      </Link>
    </div>
  );
}

"use client";

import clsx from "clsx";
import { Loader2, SearchX, Upload, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

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

function LibraryTab({ onSelect }: { onSelect: (url: string) => void }) {
  const [images, setImages] = useState<LibraryImage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [uploading, setUploading] = useState(false);
  const uploadId = useId();

  function loadImages() {
    return fetch("/api/assets/library")
      .then((response) => response.json())
      .then((data) => {
        setImages(data.images);
        setError(null);
      })
      .catch(() => setError("falha ao carregar a biblioteca"));
  }

  useEffect(() => {
    loadImages();
  }, []);

  async function handleUpload(file: File | undefined) {
    if (!file) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/assets/library", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "falha ao enviar a imagem");
      await loadImages();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "falha ao enviar a imagem");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(image: LibraryImage) {
    const previous = images;
    setImages((current) => current?.filter((item) => item.path !== image.path) ?? current);

    try {
      const response = await fetch("/api/assets/library", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: image.name }),
      });
      if (!response.ok) throw new Error();
    } catch {
      setImages(previous);
      setError("falha ao excluir a imagem");
    }
  }

  const filtered = images?.filter((image) =>
    image.name.toLowerCase().includes(filter.trim().toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        <input
          autoFocus
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filtrar por nome…"
          className={fieldClass}
        />
        <label
          htmlFor={uploadId}
          title="Adicionar imagem à biblioteca"
          className={clsx(
            "flex shrink-0 cursor-pointer items-center rounded-md border border-zinc-200 bg-white px-2.5 text-zinc-600 transition hover:border-zinc-900",
            uploading && "pointer-events-none opacity-50",
            focusRing,
          )}
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        </label>
        <input
          id={uploadId}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          disabled={uploading}
          onChange={(event) => {
            handleUpload(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>

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
              <span
                role="button"
                tabIndex={0}
                title={`Excluir "${image.name}"`}
                onClick={(event) => {
                  event.stopPropagation();
                  handleDelete(image);
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  event.stopPropagation();
                  handleDelete(image);
                }}
                className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
              >
                <X size={10} />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

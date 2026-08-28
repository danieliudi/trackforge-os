"use client";

import { ArrowLeft, Loader2, SearchX, Upload, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";

import { fieldClass, focusRing } from "@/lib/ui";

type LibraryImage = {
  name: string;
  path: string;
};

/**
 * Gerenciamento da biblioteca, separado do popover do editor de slide.
 *
 * O popover só escolhe e insere — upload e exclusão de arquivo real em disco
 * moram só aqui, então nunca existem dois lugares editando a mesma lista.
 */
export default function BibliotecaPage() {
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

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/assets/library", { method: "POST", body: form });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error ?? `falha ao enviar "${file.name}"`);
        }
      }
      await loadImages();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "falha ao enviar imagens");
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
      setError(`falha ao excluir "${image.name}"`);
    }
  }

  const filtered = images?.filter((image) =>
    image.name.toLowerCase().includes(filter.trim().toLowerCase()),
  );

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-zinc-100 font-sans">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 py-2.5 sm:px-6">
        <Link
          href="/"
          className={`flex items-center gap-1.5 text-sm text-zinc-600 transition hover:text-zinc-900 ${focusRing}`}
        >
          <ArrowLeft size={15} />
          Carousel Builder
        </Link>
        <span className="text-sm font-semibold tracking-tight text-zinc-900">
          Biblioteca de imagens
        </span>
        <span className="text-xs tabular-nums text-zinc-500">
          {images ? `${images.length} imagens` : ""}
        </span>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4 sm:p-6">
        <div className="flex gap-2">
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filtrar por nome…"
            className={`max-w-xs ${fieldClass}`}
          />
          <label
            htmlFor={uploadId}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-md bg-zinc-900 px-3.5 text-sm font-medium text-white transition hover:bg-zinc-700 ${uploading ? "pointer-events-none opacity-50" : ""} ${focusRing}`}
          >
            {uploading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Upload size={15} />
            )}
            Adicionar imagens
          </label>
          <input
            id={uploadId}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(event) => {
              handleUpload(event.target.files);
              event.target.value = "";
            }}
          />
        </div>

        {error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        ) : null}

        {!images ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-sm text-zinc-500">
            <Loader2 size={16} className="animate-spin" />
            Carregando…
          </div>
        ) : filtered?.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-zinc-500">
            <SearchX size={22} />
            Nada encontrado
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {filtered?.map((image) => (
              <div
                key={image.path}
                className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-200"
              >
                <Image
                  src={image.path}
                  alt={image.name}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                  {image.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(image)}
                  title={`Excluir "${image.name}"`}
                  className={`absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100 ${focusRing}`}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

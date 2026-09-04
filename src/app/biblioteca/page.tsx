"use client";

import { Loader2, SearchX, Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useId, useState } from "react";

import { EsteiraShell, ShellPage, useFront } from "@/components/app/EsteiraShell";
import { fieldClass, focusRing, labelClass, panelClass } from "@/lib/ui";
import { brandLabel, brandOptions, type BrandId } from "@/constants/brands";

type LibraryImage = {
  name: string;
  path: string;
};

/**
 * Biblioteca de imagens da frente — mesma casca da esteira (Situação).
 */
export default function BibliotecaPage() {
  const [front, choose] = useFront();

  const [images, setImages] = useState<LibraryImage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [uploading, setUploading] = useState(false);
  const uploadId = useId();
  const frente = brandLabel(front);

  const loadImages = useCallback(() => {
    return fetch(`/api/assets/library?brandId=${front}`)
      .then((response) => response.json())
      .then((data) => {
        setImages(data.images);
        setError(null);
      })
      .catch(() => setError("falha ao carregar a biblioteca"));
  }, [front]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setImages(null);
      void loadImages();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadImages]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch(`/api/assets/library?brandId=${front}`, {
          method: "POST",
          body: form,
        });
        if (!response.ok) throw new Error();
      }
      await loadImages();
    } catch {
      setError("falha ao enviar imagem");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(image: LibraryImage) {
    const previous = images;
    setImages((current) => current?.filter((item) => item.path !== image.path) ?? current);

    try {
      const response = await fetch(`/api/assets/library?brandId=${front}`, {
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
    <EsteiraShell>
      <ShellPage>
        <div className="flex flex-col gap-0.5">
          <span className={labelClass}>Biblioteca</span>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Imagens da frente
          </h1>
          <p className="text-[13px] text-mut">
            O que está aqui aparece primeiro na busca de imagem · {frente}
            {images ? ` · n=${images.length}` : ""}
          </p>
        </div>

        <div className={`${panelClass} flex flex-wrap items-center gap-3 px-4 py-3.5`}>
          <span className={labelClass}>Frente</span>
          {brandOptions.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={id === front}
              onClick={() => choose(id as BrandId)}
              className={`rounded-md border px-3 py-1 text-[13px] transition ${focusRing} ${
                id === front
                  ? "border-acc bg-surface font-semibold text-ink"
                  : "border-line bg-canvas text-mut hover:border-line3"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="text-[12px] text-mut">
            Cada frente tem a sua pasta.
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filtrar por nome…"
            className={`max-w-xs ${fieldClass}`}
          />
          <label
            htmlFor={uploadId}
            className={`inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-md bg-acc px-3.5 text-sm font-medium text-acc-ink transition hover:bg-acc-soft ${uploading ? "pointer-events-none opacity-50" : ""} ${focusRing}`}
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
              void handleUpload(event.target.files);
              event.target.value = "";
            }}
          />
        </div>

        {error ? (
          <p className="rounded-lg border border-danger-line bg-danger-bg px-3.5 py-3 text-[12.5px] text-danger">
            {error}
          </p>
        ) : null}

        {!images ? (
          <p className="text-[12.5px] text-mut" role="status" aria-live="polite">
            Carregando…
          </p>
        ) : filtered?.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-3.5 py-8 text-center text-[12.5px] text-mut">
            <SearchX size={18} className="mx-auto mb-2 text-faint" />
            Nada encontrado nesta frente.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {filtered?.map((image) => (
              <div
                key={image.path}
                className="group relative aspect-square overflow-hidden rounded-lg border border-line2 bg-surface2"
              >
                <Image
                  src={image.path}
                  alt={image.name}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-ink/70 to-transparent px-2 py-1.5 text-[10px] text-canvas opacity-0 transition group-hover:opacity-100">
                  {image.name}
                </span>
                <button
                  type="button"
                  onClick={() => void handleDelete(image)}
                  title={`Excluir "${image.name}"`}
                  className={`absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink/65 text-canvas opacity-0 transition hover:bg-danger group-hover:opacity-100 ${focusRing}`}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </ShellPage>
    </EsteiraShell>
  );
}

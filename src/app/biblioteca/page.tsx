"use client";

import { ArrowLeft, Loader2, Monitor, Moon, SearchX, Sun, Upload, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useState, useSyncExternalStore } from "react";

import { IconButton } from "@/components/ui/Button";

import { brandOptions, type BrandId } from "@/constants/brands";
import {
  getFrontServerSnapshot,
  getFrontSnapshot,
  setFront,
  subscribeFront,
} from "@/lib/front";
import {
  getThemeServerSnapshot,
  getThemeSnapshot,
  nextTheme,
  setTheme,
  subscribeTheme,
  themeLabel,
} from "@/lib/theme";
import { fieldClass, focusRing, labelClass } from "@/lib/ui";

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
  // A mesma frente do resto do app, e não uma escolha local: trocar de frente
  // aqui e voltar para a esteira noutra frente é como a foto de uma marca
  // termina numa peça da outra.
  const front = useSyncExternalStore(subscribeFront, getFrontSnapshot, getFrontServerSnapshot);
  const tema = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);
  const themeIcon = tema === "claro" ? Sun : tema === "escuro" ? Moon : Monitor;
  const [images, setImages] = useState<LibraryImage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [uploading, setUploading] = useState(false);
  const uploadId = useId();

  const loadImages = useCallback(() => {
    return fetch(`/api/assets/library?brandId=${front}`)
      .then((response) => response.json())
      .then((data) => {
        setImages(data.images);
        setError(null);
      })
      .catch(() => setError("falha ao carregar a biblioteca"));
  }, [front]);

  // Agendado como no resto do app: setState síncrono dentro do efeito encadeia
  // render antes da pintura. Trocar de frente esvazia a grade antes de recarregar,
  // senão as fotos da frente anterior ficam na tela como se fossem desta.
  useEffect(() => {
    const timer = setTimeout(() => {
      setImages(null);
      loadImages();
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
    <div className="flex flex-1 flex-col overflow-y-auto bg-surface2 font-sans">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line bg-surface px-4 py-2.5 sm:px-6">
        <Link
          href="/"
          className={`flex items-center gap-1.5 text-sm text-mut transition hover:text-ink ${focusRing}`}
        >
          <ArrowLeft size={15} />
          Esteira
        </Link>
        <span className="text-sm font-semibold tracking-tight text-ink">
          Biblioteca de imagens
        </span>
        <span className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-mut">
            {images ? `${images.length} imagens` : ""}
          </span>
          <IconButton
            icon={themeIcon}
            size="sm"
            label={`Tema: ${themeLabel[tema]} — clique para ${themeLabel[nextTheme[tema]]}`}
            onClick={() => setTheme(nextTheme[tema])}
          />
        </span>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className={labelClass}>Frente</span>
          {brandOptions.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={id === front}
              onClick={() => setFront(id as BrandId)}
              className={`rounded-md border px-3 py-1 text-[13px] transition ${focusRing} ${
                id === front
                  ? "border-acc bg-surface font-semibold text-ink"
                  : "border-line bg-surface text-mut hover:border-line3"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="text-[11.5px] text-mut">
            Cada frente tem a sua pasta. O que está aqui aparece primeiro na busca de imagem.
          </span>
        </div>

        <div className="flex gap-2">
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filtrar por nome…"
            className={`max-w-xs ${fieldClass}`}
          />
          <label
            htmlFor={uploadId}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-md bg-acc px-3.5 text-sm font-medium text-acc-ink transition hover:bg-surface2 ${uploading ? "pointer-events-none opacity-50" : ""} ${focusRing}`}
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
          <p className="rounded-md bg-danger-bg px-3 py-2 text-xs text-danger">{error}</p>
        ) : null}

        {!images ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-sm text-mut">
            <Loader2 size={16} className="animate-spin" />
            Carregando…
          </div>
        ) : filtered?.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-mut">
            <SearchX size={22} />
            Nada encontrado
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {filtered?.map((image) => (
              <div
                key={image.path}
                className="group relative aspect-square overflow-hidden rounded-lg bg-line"
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
                  className={`absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition hover:bg-danger group-hover:opacity-100 ${focusRing}`}
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

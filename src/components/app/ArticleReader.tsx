"use client";

import clsx from "clsx";
import { Check } from "lucide-react";

import { focusRing, labelClass } from "@/lib/ui";
import { countWords, type Article } from "@/types/article";

/**
 * O artigo como documento, para leitura.
 *
 * Vive fora da tela do fluxo porque o artigo é lido em dois momentos: quando
 * sai do redator e de novo na conferência antes de enviar. Duplicar a
 * renderização daria duas versões do mesmo texto divergindo com o tempo.
 *
 * Começa em h2 porque quem manda na página é a tela do fluxo: o h1 é o passo
 * ("Confira antes de enviar"), e o título do artigo é conteúdo dentro dele.
 */
export function ArticleReader({ article }: { article: Article }) {
  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 border-b border-zinc-200 pb-5">
        <h2 className="text-balance text-2xl font-semibold leading-tight tracking-tight text-zinc-900">
          {article.title}
        </h2>
        <p className="text-[15px] leading-relaxed text-zinc-600">{article.dek}</p>
        <p className="font-mono text-[10.5px] uppercase tracking-wide text-zinc-400">
          {article.targetAudience} · {countWords(article)} palavras
        </p>
      </header>

      {article.sections.map((section, index) => (
        <section key={`${section.heading}-${index}`} className="flex flex-col gap-2.5">
          <h3 className="text-[15px] font-semibold tracking-tight text-zinc-900">
            {section.heading}
          </h3>
          {section.paragraphs.map((paragraph, position) => (
            <p key={position} className="text-[14.5px] leading-[1.72] text-zinc-700">
              {paragraph}
            </p>
          ))}
        </section>
      ))}

      <section className="flex flex-col gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-4">
        <h3 className="text-[13px] font-semibold tracking-tight text-zinc-900">O que fazer</h3>
        <ul className="flex flex-col gap-1.5">
          {article.takeaways.map((takeaway, index) => (
            <li
              key={index}
              className="grid grid-cols-[auto_1fr] gap-2 text-[14px] leading-relaxed text-zinc-700"
            >
              <Check size={13} className="mt-[5px] shrink-0 text-emerald-600" />
              <span>{takeaway}</span>
            </li>
          ))}
        </ul>
      </section>

      {article.sources.length > 0 ? (
        <section className="flex flex-col gap-1.5 border-t border-zinc-200 pt-4">
          <span className={labelClass}>Fontes</span>
          <ul className="flex flex-col gap-1">
            {article.sources.map((source, index) => (
              <li key={index} className="text-[12.5px] leading-snug text-zinc-600">
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className={clsx("underline underline-offset-2 hover:text-zinc-900", focusRing)}
                  >
                    {source.label}
                  </a>
                ) : (
                  source.label
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

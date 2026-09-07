import type { BrandId } from "@/constants/brands";
import { readLocal, writeLocal } from "@/lib/localKeys";

/**
 * A frente ativa, compartilhada entre as seções do app.
 *
 * POR QUE É ESTADO GLOBAL E NÃO PROP: trocar de frente troca tudo — fatos,
 * proibições, sinais e fila de aprovação. Se cada seção guardasse a sua, dava
 * pra estar no painel da Resibag e na base de fatos da Sanwey ao mesmo tempo, e
 * é exatamente desse tipo de descuido que sai peça de uma marca com dado de
 * outra.
 *
 * Mesmo padrão do log de custo: store externo com snapshot de servidor, porque
 * ler localStorage direto no render dá divergência de hidratação.
 */

const KEY = "front:v1";
const DEFAULT: BrandId = "resibag";

let cache: BrandId | null = null;
const listeners = new Set<() => void>();

function read(): BrandId {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = readLocal(KEY);
    return raw === "sanwey" || raw === "resibag" || raw === "meu" ? raw : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function subscribeFront(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getFrontSnapshot(): BrandId {
  cache ??= read();
  return cache;
}

/** O servidor não tem frente escolhida; renderiza o padrão e o cliente corrige. */
export function getFrontServerSnapshot(): BrandId {
  return DEFAULT;
}

export function setFront(brandId: BrandId): void {
  cache = brandId;
  try {
    writeLocal(KEY, brandId);
  } catch {
    // Sessão sem localStorage ainda troca de frente — só não lembra depois.
  }
  for (const listener of listeners) listener();
}

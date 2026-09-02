/**
 * Tema da interface: segue o sistema, ou o que você escolheu.
 *
 * TRÊS ESTADOS E NÃO DOIS. "Sistema" é o padrão porque quem trabalha de manhã
 * no claro e à noite no escuro já configurou isso uma vez no computador — pedir
 * de novo aqui é trabalho repetido. Claro e escuro existem para quando a
 * escolha desta ferramenta precisa ser diferente da do sistema.
 *
 * O ATRIBUTO NO <html> É A FONTE DA VERDADE, não este módulo: quem pinta é o
 * CSS, lendo `data-tema`. Ele é escrito por um script que roda antes da
 * primeira pintura (ver `layout.tsx`) — sem isso a tela nasce clara e pisca
 * para escura, que é pior que não ter modo escuro.
 */

export type Theme = "sistema" | "claro" | "escuro";

const KEY = "carousel-builder:tema:v1";
const DEFAULT: Theme = "sistema";

const isTheme = (value: unknown): value is Theme =>
  value === "sistema" || value === "claro" || value === "escuro";

let cache: Theme | null = null;
const listeners = new Set<() => void>();

function read(): Theme {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(KEY);
    return isTheme(raw) ? raw : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getThemeSnapshot(): Theme {
  cache ??= read();
  return cache;
}

/** O servidor não sabe a preferência; o script inline corrige antes da pintura. */
export function getThemeServerSnapshot(): Theme {
  return DEFAULT;
}

export function setTheme(theme: Theme): void {
  cache = theme;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, theme);
    } catch {
      // Segue com o valor em memória: o tema volta ao padrão no próximo
      // carregamento, o que é bem menos grave que travar a troca.
    }
    // "sistema" remove o atributo em vez de escrever um valor: assim a mídia
    // `prefers-color-scheme` volta a mandar, sem uma terceira regra de CSS.
    if (theme === "sistema") document.documentElement.removeAttribute("data-tema");
    else document.documentElement.setAttribute("data-tema", theme);
  }

  listeners.forEach((listener) => listener());
}

/** O que o próximo clique escolhe. Um botão só, três estados, ciclo previsível. */
export const nextTheme: Record<Theme, Theme> = {
  sistema: "claro",
  claro: "escuro",
  escuro: "sistema",
};

export const themeLabel: Record<Theme, string> = {
  sistema: "segue o sistema",
  claro: "claro",
  escuro: "escuro",
};

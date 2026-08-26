/**
 * Tokens de classe da interface.
 *
 * Antes cada arquivo redefinia seu próprio botão, campo e label com valores
 * levemente divergentes (px-4 aqui, px-3 ali; border-zinc-200 num, 300 noutro).
 * Aqui existe uma fonte só, então mudar a densidade da UI é mudar um lugar.
 */

/**
 * Todo controle interativo precisa disso. A UI antiga usava `outline-none` sem
 * substituto, o que deixava a navegação por teclado literalmente invisível.
 * `focus-visible` mantém o anel fora do clique de mouse.
 */
export const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

export const labelClass =
  "text-[11px] font-medium uppercase tracking-wide text-zinc-500";

export const fieldClass = `w-full rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-sm text-zinc-900 transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-900 ${focusRing}`;

/** Superfície padrão de bloco agrupado. */
export const panelClass = "rounded-lg border border-zinc-200 bg-white";

/** Atalho exibido ao lado de uma ação. */
export const kbdClass =
  "rounded border border-zinc-300 bg-zinc-50 px-1 font-mono text-[10px] leading-4 text-zinc-500";

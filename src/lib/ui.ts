/**
 * Tokens de classe da interface.
 *
 * Antes cada arquivo redefinia seu próprio botão, campo e label com valores
 * levemente divergentes (px-4 aqui, px-3 ali; border-line num, 300 noutro).
 * Aqui existe uma fonte só, então mudar a densidade da UI é mudar um lugar.
 */

/**
 * Todo controle interativo precisa disso. A UI antiga usava `outline-none` sem
 * substituto, o que deixava a navegação por teclado literalmente invisível.
 * `focus-visible` mantém o anel fora do clique de mouse.
 */
export const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-acc focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";

export const labelClass =
  "text-[11px] font-medium uppercase tracking-wide text-mut";

export const fieldClass = `w-full rounded-md border border-line bg-canvas px-2.5 py-2 text-sm text-ink transition placeholder:text-faint hover:border-line3 focus:border-acc ${focusRing}`;

/** Superfície padrão de bloco agrupado. */
export const panelClass = "rounded-lg border border-line2 bg-surface";

/** Atalho exibido ao lado de uma ação. */
export const kbdClass =
  "rounded border border-line bg-canvas px-1 font-mono text-[10px] leading-4 text-mut";

/** Rótulo curto e discreto ao lado de um dado — origem, plataforma, contagem. */
export const metaClass = "font-mono text-[10px] uppercase tracking-wide text-faint";

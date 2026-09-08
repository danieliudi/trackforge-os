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

/**
 * A MEDIDA da página — a coluna onde a leitura mora.
 *
 * POR QUE EXISTE: num monitor de 1900px, conteúdo de ponta a ponta faz o olho
 * viajar quase dois mil pixels por linha. O Daniel descreveu isso como "está
 * muito largo, não sei explicar" (08/09/2026), e a causa era o mock da Fase 1
 * ter sido desenhado num artboard de ~468px e traduzido em pixel em vez de
 * proporção (CLAUDE.md seção 4).
 *
 * A CASCA USA A MESMA MEDIDA. Faixa preta, dateline e masthead continuam
 * sangrando de ponta a ponta — é o fundo deles que atravessa —, mas o conteúdo
 * de cada um se alinha a esta coluna. Uma borda esquerda e uma direita para a
 * página inteira, que é como um jornal se comporta: a mancha tem margem, a
 * tinta do cabeçalho não.
 */
export const medidaClass = "mx-auto w-full max-w-[1280px] px-6";

/**
 * A FORMA do rótulo, sem cor.
 *
 * Existe separada porque `labelClass` embute `text-mut`, e componente com
 * variante de cor acaba com DUAS utilidades de cor na mesma lista de classes —
 * onde quem vence é a ordem do CSS gerado, não a ordem da string. Foi assim que
 * o rótulo do KPI urgente ficou `text-mut` sobre `bg-acc`: 1,79:1 no claro e
 * 1,41:1 no escuro. Variante usa a forma e escolhe a cor uma vez só.
 */
export const labelShapeClass = "text-[11px] font-medium uppercase tracking-wide";

export const labelClass = `${labelShapeClass} text-mut`;

export const fieldClass = `w-full rounded-md border border-line bg-canvas px-2.5 py-2 text-sm text-ink transition placeholder:text-faint hover:border-line3 focus:border-acc ${focusRing}`;

/** Superfície padrão de bloco agrupado. */
export const panelClass = "rounded-lg border border-line2 bg-surface";

/** Atalho exibido ao lado de uma ação. */
export const kbdClass =
  "rounded border border-line bg-canvas px-1 font-mono text-[10px] leading-4 text-mut";

/** Rótulo curto e discreto ao lado de um dado — origem, plataforma, contagem. */
export const metaClass = "font-mono text-[10px] uppercase tracking-wide text-faint";

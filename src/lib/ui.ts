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
 * A folha inteira — a medida das SUPERFÍCIES DE TRABALHO (Fase 3).
 *
 * A `medidaClass` acima trava a PÁGINA em 1280px, e isso resolveu o desconforto
 * dos interiores de leitura. Aqui não transfere: espremer os três painéis da
 * bancada em 1280px deixaria a coluna do artigo com ~530px e pioraria a
 * ferramenta.
 *
 * A regra que vale nas duas fases é mais estreita do que parecia: **a medida é
 * da COLUNA DE LEITURA, não da página.** Num interior a página *é* a coluna, e
 * por isso 1280px funcionou lá e escondeu a distinção. Numa superfície de
 * trabalho a folha é inteira e quem carrega medida é a prosa — ver
 * `leituraClass` logo abaixo.
 *
 * Antes disso a casca renderizava em 1280px sobre um corpo de 1885px: a faixa
 * preta flutuava no meio de uma grade que passava por baixo dela, e a borda
 * esquerda dela caía a 8px do divisor da primeira coluna. Perto o bastante para
 * parecer erro de alinhamento, longe o bastante para não ser alinhamento.
 */
export const folhaClass = "w-full px-10";

/**
 * A coluna de leitura dentro de um painel de trabalho.
 *
 * 680px NÃO foi escolhido, foi medido: com Geist a 15,5px dá **72 caracteres
 * por linha**, dentro da faixa confortável de 60 a 75. O roteiro que gera as
 * capturas do mockup imprime essa conta a cada rodada.
 */
export const leituraClass = "mx-auto w-full max-w-[680px]";

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

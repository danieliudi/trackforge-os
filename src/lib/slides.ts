import { MIN_SLIDES, type Slide } from "@/types/carousel";

/** A ordem do array é a verdade: slideNumber é sempre recalculado a partir dela. */
export const renumber = (slides: Slide[]): Slide[] =>
  slides.map((slide, index) => ({ ...slide, slideNumber: index + 1 }));

/** Motivo pelo qual remover está bloqueado, ou undefined se pode remover. */
export function removeBlockedReason(index: number, total: number) {
  if (total <= MIN_SLIDES) return `O mínimo é ${MIN_SLIDES} slides`;
  if (index === 0) return "A capa não pode ser removida";
  if (index === total - 1) return "O slide de CTA não pode ser removido";
  return undefined;
}

/**
 * O schema exige capa em primeiro e CTA em último, então os dois são âncoras:
 * não se movem, e nenhum slide do meio pode passar por cima deles.
 */
export const canMoveUp = (index: number, total: number) =>
  index > 1 && index <= total - 2;

export const canMoveDown = (index: number, total: number) =>
  index >= 1 && index < total - 2;

/** Troca o slide de lugar com o vizinho. Fora dos limites, devolve o mesmo array. */
export function moveSlide(slides: Slide[], index: number, direction: -1 | 1): Slide[] {
  const target = index + direction;
  const allowed =
    direction === -1
      ? canMoveUp(index, slides.length)
      : canMoveDown(index, slides.length);
  if (!allowed) return slides;

  const next = [...slides];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

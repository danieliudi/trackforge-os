import { redirect } from "next/navigation";

/**
 * A tela do artigo virou o passo 3 da esteira.
 *
 * Redireciona em vez de sumir: o link já circulou, e uma porta a menos é melhor
 * que duas telas fazendo quase a mesma coisa.
 */
export default function ArtigoPage() {
  redirect("/esteira");
}

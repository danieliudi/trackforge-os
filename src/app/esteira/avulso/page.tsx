import { redirect } from "next/navigation";

/**
 * A peça avulsa virou uma origem da bancada, não uma tela.
 *
 * Ela existia porque arquivo e texto colado só serviam para post solto —
 * o que impedia justamente o caso mais útil, subir um relatório e tirar dele o
 * artigo inteiro. Hoje as quatro origens entram pela mesma porta, e "sem
 * artigo" é uma caixa de seleção. Redireciona em vez de sumir: o link circulou.
 */
export default function AvulsoPage() {
  redirect("/esteira");
}

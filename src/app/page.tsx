import { redirect } from "next/navigation";

/**
 * Porta única: a esteira.
 *
 * Antes havia duas telas pedindo a mesma coisa — "descreva o tema" no editor de
 * carrossel e "criar peça" na esteira — produzindo coisas diferentes. Duas
 * entradas para a mesma pergunta é confusão, não escolha. O editor continua
 * existindo em /editor, mas como bancada onde se cai ao abrir uma peça, não
 * como porta de entrada concorrente.
 */
export default function HomePage() {
  redirect("/esteira");
}

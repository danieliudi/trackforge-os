/**
 * Base de fatos verificados por marca, injetada no prompt de geração.
 *
 * Existe porque o gerador não tinha nenhuma fonte de verdade: norma, número e
 * data saíam da memória do modelo, sem checagem. O resultado foi um carrossel
 * Resibag com um slide inteiro sobre homologação marítima — que a Resibag não
 * tem, e que a própria base de compliance da marca proíbe citar.
 *
 * O conteúdo aqui é cópia curada das fontes canônicas do grupo. Curada porque
 * o prompt paga por token: entra o que um redator de carrossel precisa (fato
 * verificável, número com fonte, proibição), fica de fora o que é de outra
 * disciplina (design system, protocolo de versionamento) ou de circulação
 * interna (faixa de preço de concorrente, contato pessoal).
 */
export type BrandKnowledge = {
  /** Bloco de fatos colado no prompt, já em markdown. */
  facts: string;
  /**
   * O que nunca pode sair numa peça da marca, com o porquê.
   *
   * O motivo vai junto no prompt de propósito: "não escreva X" o modelo
   * contorna com um sinônimo; "não escreva X porque a marca não tem essa
   * homologação" fecha a categoria inteira.
   */
  forbidden: { term: string; reason: string }[];
};

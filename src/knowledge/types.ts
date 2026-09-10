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
  forbidden: {
    term: string;
    reason: string;
    /**
     * Padrões que detectam a violação no texto já gerado.
     *
     * Comparados contra o texto normalizado (sem acento, minúsculo) — escreva o
     * padrão assim também. Ausente de propósito quando a proibição depende de
     * semântica e não de string: "INMETRO atribuído ao Filtrante" não vira
     * regex sem falso positivo, e continua valendo só como regra de prompt.
     */
    match?: RegExp[];
    /**
     * Violação que só existe na COMBINAÇÃO — nenhum dos lados é proibido
     * sozinho.
     *
     * `match` responde "este texto contém X?", uma regex por vez, e para no
     * primeiro acerto. Há regra de marca que nenhuma quantidade de regex assim
     * expressa, porque o erro é os dois aparecerem JUNTOS: a Resibag proíbe
     * misturar tagline institucional (Nível 01/02) com slogan comercial
     * (Nível 03) na mesma peça, e cada um deles, sozinho, é correto.
     *
     * Dispara quando algum bloco casa `a` E algum bloco casa `b` — o mesmo
     * bloco ou outro, porque o escopo da regra é a peça, não a linha.
     *
     * EXISTE POR UM ERRO DESTA SESSÃO, 08/09/2026: o mockup da Fase 3 montou
     * uma capa de carrossel com o slogan Nível 03 ao lado do endosso
     * institucional. Passou por quem estava lendo as regras de marca naquele
     * momento, e o gate não tinha como pegar.
     */
    pair?: { a: RegExp[]; b: RegExp[] };
  }[];
};

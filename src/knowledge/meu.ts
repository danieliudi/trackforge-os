import type { BrandKnowledge } from "./types";

/**
 * Frente pessoal (Meu).
 *
 * Sem base de fatos de marca de propósito: o que pode ser afirmado vem só do
 * material que o Daniel colou. A fronteira com Sanwey/Resibag é esta — não
 * carregar a base delas aqui — e a proibição abaixo impede a peça de falar
 * *em nome* das empresas do Grupo.
 */
export const meuKnowledge: BrandKnowledge = {
  facts: `## Esta frente é pessoal
- Peça gerada aqui não representa Sanwey nem Resibag.
- Não há base de fatos corporativa nesta frente: número, norma, data e certificação
  só entram se estiverem no material de origem que você colou ou no sinal escolhido.
- Não invente dado de produto, cliente ou operação do Grupo.`,

  forbidden: [
    {
      term: "falando como sanwey",
      reason:
        "esta frente é pessoal — não fale em nome da Sanwey (nós da Sanwey, nossa fábrica, nosso Sanbag)",
      match: [
        /nos da sanwey/,
        /nossa fabrica/,
        /somos a sanwey/,
        /sanwey industria/,
      ],
    },
    {
      term: "falando como resibag",
      reason:
        "esta frente é pessoal — não fale em nome da Resibag (nós da Resibag, nosso filtrante, nossa operação)",
      match: [/nos da resibag/, /somos a resibag/, /nossa resibag/],
    },
  ],
};

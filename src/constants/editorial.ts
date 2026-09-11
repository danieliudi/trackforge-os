import { z } from "zod";

import { BRAND_IDS, type BrandId } from "./brands";

/**
 * Os dois eixos editoriais: QUEM assina e O QUE o post tem de fazer.
 *
 * POR QUE EXISTEM. Uma estratégia de LinkedIn não é "postar carrossel" — é um
 * mix, e o mix só é real se cada peça tiver um trabalho. Até aqui a ferramenta
 * sabia o FORMATO (carrossel, post de texto) e a PLATAFORMA, e não sabia nem
 * para que a peça servia nem de quem ela era. As duas coisas mudam o texto
 * inteiro.
 *
 * POR QUE SÃO DIMENSÃO E NÃO FORMATO. Como formato seriam 6 formatos × 4 vozes
 * = 24 `kind`s, e cada `kind` exige entrada em `OUTPUT_META`, esquema em
 * `OUTPUT_SCHEMAS`, achatamento em `outputBlocks`, renderização em
 * `OutputPieces` e linha em `MODEL_PRICING`. Vinte e quatro de cada. Como
 * dimensão — que é o que `platform` já é — são dois campos, e os seis formatos
 * continuam seis. Decisão aprovada em 11/09/2026
 * (`scratchpad/intent-fase4/DESIGN-fase4.md`).
 *
 * POR QUE AS LISTAS SÃO POR FRENTE. A Resibag vende para um especificador
 * técnico que entra pela porta do compliance; a Sanwey vende engenharia
 * aplicada com marcos datados desde 1983. Uma lista só serviria mal às duas. E
 * a voz "Responsável" não existe na Sanwey — é a pessoa responsável pela
 * Resibag. A frente pessoal não tem sistema editorial de marca: lista vazia, e
 * a tela esconde os dois controles.
 */

/* ══ VOZ ═══════════════════════════════════════════════════════════════════ */

export const VOZ_IDS = ["pagina", "diretor", "responsavel", "daniel"] as const;
export type VozId = (typeof VOZ_IDS)[number];
export const vozIdSchema = z.enum(VOZ_IDS);

export type Voz = {
  id: VozId;
  label: string;
  /** O ângulo, em duas palavras. Vai na célula, embaixo do nome. */
  angulo: string;
  /**
   * Como esta voz escreve. Vai inteiro para o prompt.
   *
   * Escrito no positivo e na segunda pessoa, como o resto do system: "escreva
   * assim" prende mais que "não escreva assado".
   */
  instrucao: string;
  /**
   * Se esta voz pode carregar a assinatura institucional da marca.
   *
   * SÓ A PÁGINA PODE, e isso não é estilo: a página é a empresa falando, e uma
   * pessoa carregando a mesma frase vira anúncio. A regra vira gate em
   * `src/knowledge/check.ts`, derivada de `brands[].tagline` — não é uma lista
   * de frases mantida à mão, é a própria tagline da marca.
   */
  carregaTagline: boolean;
};

const PAGINA: Voz = {
  id: "pagina",
  label: "Página",
  angulo: "registro",
  instrucao:
    "Você escreve como a EMPRESA, não como uma pessoa: impessoal ou primeira pessoa do plural, nunca 'eu'. " +
    "Seu papel é ser o registro — o que a marca é e o que ela prova, com o número do certificado ao lado da afirmação. " +
    "É a única voz que pode carregar a assinatura institucional da marca.",
  carregaTagline: true,
};

const DIRETOR: Voz = {
  id: "diretor",
  label: "Diretor",
  angulo: "mercado",
  instrucao:
    "Você escreve como uma pessoa que lidera a área comercial: primeira pessoa do singular, tom de quem conversa com um par. " +
    "Seu papel é a leitura de mercado — o que está mudando e o que custa descobrir tarde. " +
    "NUNCA escreva a assinatura institucional da marca: pessoa carregando a tagline vira anúncio, e o leitor desconta isso primeiro.",
  carregaTagline: false,
};

const RESPONSAVEL: Voz = {
  id: "responsavel",
  label: "Responsável",
  angulo: "operação",
  instrucao:
    "Você escreve como quem está perto do cliente e da operação: primeira pessoa do singular, tom técnico e direto. " +
    "Seu papel é o detalhe de especificação e o que dá errado na prática — só quem está perto pode contar o erro sem parecer acusação. " +
    "Sem slogan, sem assinatura institucional.",
  carregaTagline: false,
};

const DANIEL: Voz = {
  id: "daniel",
  label: "Daniel",
  angulo: "tese",
  instrucao:
    "Você escreve como quem decidiu: primeira pessoa do singular, tom de quem conta uma decisão e não de quem vende. " +
    "Seu papel é a tese por trás do produto — por que ele é assim, e o marco datado que sustenta. " +
    "Sem assinatura institucional: quem assina é você, não a marca.",
  carregaTagline: false,
};

/**
 * A Sanwey não tem "Responsável" — esse é o papel de quem responde pela
 * Resibag. Três vozes, e a tela mostra três células em vez de quatro.
 */
export const VOZES_POR_FRENTE: Record<BrandId, Voz[]> = {
  resibag: [PAGINA, DIRETOR, RESPONSAVEL, DANIEL],
  sanwey: [PAGINA, DIRETOR, DANIEL],
  meu: [],
};

/* ══ TRABALHO ══════════════════════════════════════════════════════════════ */

export const TRABALHO_IDS = [
  "norma-em-movimento",
  "como-se-confere",
  "a-conta",
  "a-operacao",
  "marco-datado",
  "engenharia-por-carga",
  "vertical",
  "certificacao-com-escopo",
] as const;
export type TrabalhoId = (typeof TRABALHO_IDS)[number];
export const trabalhoIdSchema = z.enum(TRABALHO_IDS);

export type Trabalho = {
  id: TrabalhoId;
  label: string;
  /** O papel no mix. É o que impede o calendário de virar quatro posts iguais. */
  papel: "autoridade" | "comercial" | "prova" | "diferencial" | "alcance" | "barreira";
  instrucao: string;
};

const RESIBAG_TRABALHOS: Trabalho[] = [
  {
    id: "norma-em-movimento",
    label: "Norma em movimento",
    papel: "autoridade",
    instrucao:
      "Este post diz o que mudou, ou o que está em consulta, numa norma que obriga o cliente. " +
      "Processo em curso se relata como processo: nunca afirme o resultado de uma revisão que ainda não fechou.",
  },
  {
    id: "como-se-confere",
    label: "Como se confere",
    papel: "autoridade",
    instrucao:
      "Este post é um checklist técnico: o que se confere num documento, num certificado ou numa embalagem, na ordem em que se confere. " +
      "É o post que alguém salva e encaminha internamente — cada item precisa ser verificável sozinho.",
  },
  {
    id: "a-conta",
    label: "A conta",
    papel: "comercial",
    instrucao:
      "Este post faz a conta: substituição, custo total, previsibilidade, espaço. " +
      "É o post que arma quem compra, e por isso fala em números que a base sustenta — nunca em estimativa.",
  },
  {
    id: "a-operacao",
    label: "A operação",
    papel: "prova",
    instrucao:
      "Este post mostra a coisa acontecendo: a peça, o documento que viaja junto, a rastreabilidade. " +
      "Prova, não promessa — descreva o que existe, não o que se pretende.",
  },
];

const SANWEY_TRABALHOS: Trabalho[] = [
  {
    id: "marco-datado",
    label: "Marco datado",
    papel: "autoridade",
    instrucao:
      "Este post conta UM marco datado e a decisão de engenharia por trás dele. " +
      "Nunca use a idade da empresa como prova: número que se reescreve todo ano não acumula memória, e o ano de um pioneirismo fica onde está.",
  },
  {
    id: "engenharia-por-carga",
    label: "Engenharia por carga",
    papel: "diferencial",
    instrucao:
      "Este post parte de um problema de carga e chega na decisão de projeto que ele obriga. " +
      "É o diferencial declarado — engenharia aplicada, não catálogo — e só funciona se o problema vier primeiro.",
  },
  {
    id: "vertical",
    label: "Vertical",
    papel: "alcance",
    instrucao:
      "Este post fala com UMA vertical de cada vez: mineração, químico e O&G, agro, armazenagem. " +
      "Use a língua do especificador daquela vertical, não a linguagem geral da marca.",
  },
  {
    id: "certificacao-com-escopo",
    label: "Certificação com escopo",
    papel: "barreira",
    instrucao:
      "Este post cita certificação SEMPRE com o escopo colado: o que ela cobre e o que não cobre. " +
      "Somar certificações diferentes num 'selo' é o erro que o mercado inteiro comete — e é o que este post desfaz.",
  },
];

export const TRABALHOS_POR_FRENTE: Record<BrandId, Trabalho[]> = {
  resibag: RESIBAG_TRABALHOS,
  sanwey: SANWEY_TRABALHOS,
  meu: [],
};

/* ══ ARCO DE EVENTO ════════════════════════════════════════════════════════ */

export const ETAPA_IDS = ["t-14", "t-3", "dia", "d2", "d7"] as const;
export type EtapaId = (typeof ETAPA_IDS)[number];
export const etapaIdSchema = z.enum(ETAPA_IDS);

export type Etapa = {
  id: EtapaId;
  /** O marcador temporal, em mono na tela. */
  quando: string;
  label: string;
  instrucao: string;
  /** A voz que o arco SUGERE. Sugere, não trava. */
  vozSugerida: VozId;
};

/**
 * Evento não tem trabalho, tem ARCO.
 *
 * Por isso a grade de trabalhos some quando a origem é evento: a etapa é que
 * decide o que o post faz. E é a razão de evento ser uma ORIGEM e não quatro
 * trabalhos novos — como trabalho, a grade viraria dez células com metade
 * inaplicável na maior parte do ano.
 */
export const ARCO_EVENTO: Etapa[] = [
  {
    id: "t-14",
    quando: "T−14",
    label: "convite",
    instrucao:
      "Duas semanas antes. Não é anúncio de presença: é convite com utilidade — diga o que vale a pena trazer ao estande como pergunta.",
    vozSugerida: "pagina",
  },
  {
    id: "t-3",
    quando: "T−3",
    label: "pauta",
    instrucao:
      "Três dias antes. As dúvidas técnicas que o estande resolve em cinco minutos e que por e-mail levam duas semanas.",
    vozSugerida: "diretor",
  },
  {
    id: "dia",
    quando: "Dia",
    label: "bastidor",
    instrucao:
      "Durante. O estande, a peça, quem está lá — sem produção. É o pedaço de menor valor estratégico do arco, e o único que a maioria publica.",
    vozSugerida: "responsavel",
  },
  {
    id: "d2",
    quando: "D+2",
    label: "o que ouvimos",
    instrucao:
      "Dois dias depois. A síntese do que o mercado PERGUNTOU — inteligência original, que só existe porque alguém estava lá. " +
      "É o post de maior valor do arco. O que foi ouvido entra como o que foi ouvido, nunca como dado da marca.",
    vozSugerida: "diretor",
  },
  {
    id: "d7",
    quando: "D+7",
    label: "material",
    instrucao:
      "Uma semana depois. Fecha o ciclo e dá ao follow-up comercial um motivo que não é 'passando para saber'.",
    vozSugerida: "pagina",
  },
];

/* ══ ACESSO ════════════════════════════════════════════════════════════════ */

export const vozesDaFrente = (brandId: BrandId | null | undefined): Voz[] =>
  brandId ? VOZES_POR_FRENTE[brandId] : [];

export const trabalhosDaFrente = (brandId: BrandId | null | undefined): Trabalho[] =>
  brandId ? TRABALHOS_POR_FRENTE[brandId] : [];

export function acharVoz(brandId: BrandId | null | undefined, id: VozId | null | undefined) {
  if (!id) return null;
  return vozesDaFrente(brandId).find((v) => v.id === id) ?? null;
}

export function acharTrabalho(
  brandId: BrandId | null | undefined,
  id: TrabalhoId | null | undefined,
) {
  if (!id) return null;
  return trabalhosDaFrente(brandId).find((t) => t.id === id) ?? null;
}

export const acharEtapa = (id: EtapaId | null | undefined) =>
  id ? (ARCO_EVENTO.find((e) => e.id === id) ?? null) : null;

/**
 * A voz pode carregar a assinatura institucional?
 *
 * Default `true` quando não há voz escolhida: sem voz, o comportamento é o de
 * antes desta fase — a peça sai com a tagline, como sempre saiu. Uma fase que
 * muda o padrão de quem não pediu nada é uma fase que quebra o que funcionava.
 */
export function vozCarregaTagline(
  brandId: BrandId | null | undefined,
  id: VozId | null | undefined,
): boolean {
  if (!id) return true;
  return acharVoz(brandId, id)?.carregaTagline ?? true;
}

/** Toda frente tem lista, mesmo que vazia — o `satisfies` quebra se faltar. */
export const _completo = { VOZES_POR_FRENTE, TRABALHOS_POR_FRENTE } satisfies {
  VOZES_POR_FRENTE: Record<(typeof BRAND_IDS)[number], Voz[]>;
  TRABALHOS_POR_FRENTE: Record<(typeof BRAND_IDS)[number], Trabalho[]>;
};

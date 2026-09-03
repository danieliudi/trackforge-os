/**
 * Prova de que o artigo não se perde mais por limite que a API nunca aplicou.
 *
 * Roda sem chave e sem servidor: o que está sob teste é a camada de schema, que
 * é onde os 2,4 minutos de Sonnet eram descartados. Cada caso abaixo é uma
 * resposta que a Anthropic devolve como VÁLIDA (ela garante forma, não tamanho)
 * e que o schema antigo reprovava inteira.
 */
import {
  articleSchema,
  articleToMarkdown,
  articleWireSchema,
  normalizeArticle,
} from "../src/types/article.ts";

const base = {
  title: "Descarte correto de resíduo perigoso",
  dek: "O que muda para quem responde pela destinação.",
  targetAudience: "Gerente de compras e compliance",
  sections: [
    { heading: "O que a norma exige", paragraphs: ["Um.", "Dois."] },
    { heading: "Onde a operação falha", paragraphs: ["Três."] },
    { heading: "O que fazer agora", paragraphs: ["Quatro."] },
  ],
  takeaways: ["Revise o contrato.", "Peça o certificado."],
  sources: [{ label: "Resolução ANTT nº 5.998/2022" }],
  suggestedOutputs: [{ kind: "post-texto", reason: "O prazo cabe em texto." }],
  imageIdeas: [{ slot: "capa", describes: "pátio industrial com big bag", query: "industrial yard" }],
};

const casos = [
  {
    nome: "seção com 7 parágrafos (o teto era 6)",
    resposta: {
      ...base,
      sections: [
        { heading: "O que a norma exige", paragraphs: Array.from({ length: 7 }, (_, i) => `P${i + 1}.`) },
        ...base.sections.slice(1),
      ],
    },
    espera: (a) => a.sections[0].paragraphs.length === 7,
    explica: (a) => `parágrafos preservados: ${a.sections[0].paragraphs.length}`,
  },
  {
    nome: "9 seções (o teto era 8)",
    resposta: {
      ...base,
      sections: Array.from({ length: 9 }, (_, i) => ({ heading: `Seção ${i + 1}`, paragraphs: ["Texto."] })),
    },
    espera: (a) => a.sections.length === 9,
    explica: (a) => `seções preservadas: ${a.sections.length}`,
  },
  {
    nome: "6 takeaways (o teto era 5)",
    resposta: { ...base, takeaways: Array.from({ length: 6 }, (_, i) => `Ação ${i + 1}.`) },
    espera: (a) => a.takeaways.length === 6,
    explica: (a) => `takeaways preservados: ${a.takeaways.length}`,
  },
  {
    nome: 'reason com 240 caracteres (o teto é 180)',
    resposta: {
      ...base,
      suggestedOutputs: [{ kind: "post-texto", reason: "x ".repeat(120).trim() }],
    },
    espera: (a) => a.suggestedOutputs[0].reason.length <= 180,
    explica: (a) => `reason cortado para: ${a.suggestedOutputs[0].reason.length} caracteres`,
  },
  {
    nome: "describes com 300 caracteres (o teto é 160)",
    resposta: {
      ...base,
      imageIdeas: [{ slot: "capa", describes: "operador ".repeat(40).trim(), query: "industrial yard" }],
    },
    espera: (a) => a.imageIdeas[0].describes.length <= 160,
    explica: (a) => `describes cortado para: ${a.imageIdeas[0].describes.length} caracteres`,
  },
  {
    nome: 'url null numa fonte (campo opcional preenchido com null)',
    resposta: { ...base, sources: [{ label: "Resolução ANTT nº 5.998/2022", url: null }] },
    espera: (a) => a.sources.length === 1 && a.sources[0].url === undefined,
    explica: (a) => `fonte mantida pelo nome, sem link: ${JSON.stringify(a.sources[0])}`,
  },
  {
    nome: 'url sem esquema ("www.gov.br/antt")',
    resposta: { ...base, sources: [{ label: "Portal ANTT", url: "www.gov.br/antt" }] },
    espera: (a) => a.sources[0].url === undefined && a.sources[0].label === "Portal ANTT",
    explica: (a) => `link inválido descartado, fonte preservada: ${JSON.stringify(a.sources[0])}`,
  },
  {
    nome: "formato sugerido em duplicata",
    resposta: {
      ...base,
      suggestedOutputs: [
        { kind: "post-texto", reason: "O prazo cabe em texto." },
        { kind: "post-texto", reason: "De novo o mesmo formato." },
        { kind: "stories", reason: "Lembrete de prazo." },
      ],
    },
    espera: (a) => a.suggestedOutputs.length === 2,
    explica: (a) => `formatos após dedupe: ${a.suggestedOutputs.map((s) => s.kind).join(", ")}`,
  },
  {
    nome: "6 ideias de imagem (o teto era 4)",
    resposta: {
      ...base,
      imageIdeas: Array.from({ length: 6 }, (_, i) => ({
        slot: `Seção ${i}`,
        describes: "pátio industrial",
        query: "industrial yard",
      })),
    },
    espera: (a) => a.imageIdeas.length === 6,
    explica: (a) => `ideias preservadas: ${a.imageIdeas.length}`,
  },
];

let falhas = 0;
for (const caso of casos) {
  // 1. a resposta passa pelo schema que VAI ao modelo?
  const wire = articleWireSchema.safeParse(caso.resposta);
  // 2. e sobrevive à normalização + schema estrito?
  const final = wire.success ? articleSchema.safeParse(normalizeArticle(wire.data)) : null;

  const ok = wire.success && final.success && caso.espera(final.data);
  if (!ok) falhas++;

  const detalhe = !wire.success
    ? `REPROVADO no wire: ${wire.error.issues[0].message}`
    : !final.success
      ? `REPROVADO no estrito: ${final.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`
      : caso.explica(final.data);

  console.log(`${ok ? "OK  " : "FALHA"} ${caso.nome}\n       ${detalhe}`);
}

// O artigo consertado ainda produz o documento que vai para o CRM.
const wire = articleWireSchema.parse(base);
const artigo = articleSchema.parse(normalizeArticle(wire));
const md = articleToMarkdown(artigo);
console.log(`\nmarkdown gerado: ${md.split("\n").length} linhas, ${md.length} caracteres`);
console.log(`fontes no markdown: ${md.includes("Resolução ANTT nº 5.998/2022") ? "presente" : "AUSENTE"}`);

console.log(`\n${casos.length - falhas}/${casos.length} casos passam`);
process.exit(falhas === 0 ? 0 : 1);

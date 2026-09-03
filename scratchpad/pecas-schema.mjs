/**
 * Prova de que uma peça curta não se perde mais — nem leva o lote junto.
 *
 * Roda sem chave e sem servidor. Cada caso é uma resposta que a Anthropic
 * devolve como VÁLIDA (ela garante forma, não tamanho) e que antes derrubava a
 * chamada inteira em `generateObject`, com as peças já geradas junto.
 */
import {
  normalizeOutput,
  OUTPUT_SCHEMAS,
  OUTPUT_WIRE_SCHEMAS,
} from "../src/types/outputs.ts";

const slide = (n, type, extra = {}) => ({
  slideNumber: n,
  type,
  headline: `Título do slide ${n}`,
  bodyText: "rótulo curto",
  footerNote: "assinatura",
  ...extra,
});

const casos = [
  {
    kind: "reels",
    nome: 'naTela acima de 70 caracteres (o teto era 70)',
    resposta: {
      hook: "O prazo venceu e ninguém avisou o comprador.",
      beats: [
        { seconds: 5, fala: "Fala um.", naTela: "texto de tela deliberadamente longo para estourar o limite de setenta caracteres do roteiro" },
        { seconds: 8, fala: "Fala dois.", naTela: "curto" },
        { seconds: 7, fala: "Fala três.", naTela: "curto" },
      ],
      cta: "Chama no direct.",
    },
    espera: (d) => d.beats[0].naTela.length > 70,
    explica: (d) => `naTela preservada inteira: ${d.beats[0].naTela.length} caracteres, ${d.beats[0].naTela.length - 70} acima do antigo teto`,
  },
  {
    kind: "reels",
    nome: "bloco de 45s e outro de 2,6s (o teto era 30, e int)",
    resposta: {
      hook: "Gancho.",
      beats: [
        { seconds: 45, fala: "Fala longa.", naTela: "na tela" },
        { seconds: 2.6, fala: "Fala curta.", naTela: "na tela" },
      ],
      cta: "CTA.",
    },
    espera: (d) => d.beats[0].seconds === 45 && d.beats[1].seconds === 3,
    explica: (d) => `tempos: ${d.beats.map((b) => `${b.seconds}s`).join(", ")} (45 mantido, 2,6 arredondado)`,
  },
  {
    kind: "post-texto",
    nome: "11 parágrafos (o teto era 9) e gancho de 260 caracteres",
    resposta: {
      hook: "x ".repeat(130).trim(),
      paragraphs: Array.from({ length: 11 }, (_, i) => `Parágrafo ${i + 1}.`),
      cta: "Fale com a gente.",
    },
    espera: (d) => d.paragraphs.length === 11 && d.hook.length === 259,
    explica: (d) => `parágrafos: ${d.paragraphs.length} · gancho: ${d.hook.length} caracteres, intacto`,
  },
  {
    kind: "legenda",
    nome: "12 hashtags, com repetida e com '#' na frente (o teto era 8)",
    resposta: {
      hook: "Gancho da legenda.",
      body: ["Linha um.", "  ", "Linha dois."],
      cta: "Salva esse post.",
      hashtags: ["#bigbag", "bigbag", "BigBag", "residuos", "#residuos", "logistica", "a", ...Array.from({ length: 5 }, (_, i) => `tag${i}`)],
    },
    espera: (d) => d.hashtags.length === 8 && d.body.length === 2,
    explica: (d) => `hashtags após dedupe/limpeza: ${d.hashtags.join(", ")} · blocos vazios removidos: ${d.body.length} restantes`,
  },
  {
    kind: "stories",
    nome: "7 telas (o teto era 5) e uma com texto de 240 caracteres",
    resposta: {
      screens: [
        { texto: "y ".repeat(120).trim() },
        ...Array.from({ length: 6 }, (_, i) => ({ texto: `Tela ${i + 2}.`, interacao: i === 0 ? "enquete" : "  " })),
      ],
      cta: "Arrasta pra cima.",
    },
    espera: (d) => d.screens.length === 7 && d.screens[0].texto.length === 239,
    explica: (d) => `telas: ${d.screens.length} · maior texto: ${d.screens[0].texto.length} caracteres · interações vazias viraram ausência: ${d.screens.filter((s) => s.interacao).length} com interação`,
  },
  {
    kind: "carrossel-linkedin",
    nome: "14 slides (o teto era 12), bodyText de 58 caracteres (o teto era 30)",
    resposta: {
      title: "Descarte correto",
      targetAudience: "Compras",
      slides: [
        slide(1, "cover", { bodyText: "um rótulo de apoio bem mais longo do que trinta caracteres" }),
        ...Array.from({ length: 12 }, (_, i) => slide(i + 2, "content")),
        slide(14, "cta"),
      ],
    },
    espera: (d) => d.slides.length === 14 && d.slides[0].bodyText.length === 58,
    explica: (d) => `slides: ${d.slides.length} · bodyText do slide 1: ${d.slides[0].bodyText.length} caracteres`,
  },
  {
    kind: "carrossel-instagram",
    nome: "primeiro slide não é capa, último não é CTA, numeração embaralhada",
    resposta: {
      title: "Descarte correto",
      targetAudience: "Compras",
      slides: [
        slide(7, "content"),
        slide(3, "quote"),
        slide(9, "content"),
        slide(1, "content"),
      ],
    },
    espera: (d) =>
      d.slides[0].type === "cover" &&
      d.slides[3].type === "cta" &&
      d.slides.every((s, i) => s.slideNumber === i + 1),
    explica: (d) => `molduras: ${d.slides.map((s) => s.type).join(" → ")} · numeração: ${d.slides.map((s) => s.slideNumber).join(",")}`,
  },
  {
    kind: "carrossel-linkedin",
    nome: 'slide "bullets" com um item só, e QR code que não é URL',
    resposta: {
      title: "Descarte correto",
      targetAudience: "Compras",
      slides: [
        slide(1, "cover"),
        slide(2, "bullets", { bullets: ["item único", "   "] }),
        slide(3, "content"),
        slide(4, "cta", { qrCodeUrl: "resibag.com.br" }),
      ],
    },
    espera: (d) => d.slides[1].type === "content" && d.slides[3].qrCodeUrl === undefined,
    explica: (d) => `lista de 1 item virou "${d.slides[1].type}" · QR inválido descartado: ${d.slides[3].qrCodeUrl ?? "ausente"}`,
  },
];

let falhas = 0;
for (const caso of casos) {
  const wire = OUTPUT_WIRE_SCHEMAS[caso.kind].safeParse(caso.resposta);
  const final = wire.success
    ? OUTPUT_SCHEMAS[caso.kind].safeParse(normalizeOutput(caso.kind, wire.data, "assinatura canônica"))
    : null;

  const ok = wire.success && final.success && caso.espera(final.data);
  if (!ok) falhas++;

  const detalhe = !wire.success
    ? `REPROVADO no fio: ${wire.error.issues[0].message}`
    : !final.success
      ? `REPROVADO no estrito: ${final.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`
      : caso.explica(final.data);

  console.log(`${ok ? "OK  " : "FALHA"} [${caso.kind}] ${caso.nome}\n       ${detalhe}`);
}

console.log(`\n${casos.length - falhas}/${casos.length} casos passam`);
process.exit(falhas === 0 ? 0 : 1);

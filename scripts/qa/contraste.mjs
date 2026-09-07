#!/usr/bin/env node
/**
 * Contraste dos pares que a casca e a home usam, nos dois temas.
 *
 * O gate (CLAUDE.md seção 4): corpo ≥ 4,5:1, rótulo pequeno e ornamento ≥ 3:1,
 * medido SOBRE O APP, porque token que passa no claro reprova no escuro.
 *
 * POR QUE OS PARES SÃO DECLARADOS AQUI, E NÃO ESCOLHIDOS A CADA RODADA: numa
 * única sessão, três seletores improvisados casaram com o elemento errado e
 * produziram três números falsos —
 *
 *   · `button[aria-pressed=true]` pegou o botão da frente no masthead, não a
 *     célula da grade;
 *   · `nav a:not([aria-current])` pegou o sinal da faixa, não um item de seção;
 *   · e a medição crua leu `oklab(… / .7)` como se fosse RGB.
 *
 * Dois deles ALARME FALSO, um deles ESCONDEU uma reprovação real de 1,17:1. Por
 * isso cada alvo aqui traz um localizador por PAPEL (o que a pessoa vê), a
 * contagem esperada, e o relatório imprime o texto que mediu. Seletor que deixa
 * de casar é REPROVAÇÃO, não silêncio: alvo que some do relatório é cobertura
 * que evaporou sem ninguém notar.
 */

import { abrirNavegador, novaPagina, BASE, medirContraste } from "./lib/navegador.mjs";

/** Piso por papel do texto. Nomeado, para não virar número solto no alvo. */
const CORPO = 4.5;
const MIUDO = 3;

/**
 * A fila semeada. Três linhas com título de tamanho real — título curto esconde
 * truncamento, e é no item truncado que a cor costuma mudar.
 */
const FILA = {
  configured: true,
  pending: [
    { id: "p1", title: "Revisão da ANTT 5.998 — o que muda no descarte", summary: null, priority: "alta", createdAt: "2026-09-01T12:00:00.000Z" },
    { id: "p2", title: "Checklist de conformidade para embarcadores", summary: null, priority: "media", createdAt: "2026-09-03T12:00:00.000Z" },
    { id: "p3", title: "Custo real de um lote reprovado na fiscalização", summary: null, priority: "baixa", createdAt: "2026-09-05T12:00:00.000Z" },
  ],
};

/**
 * Dois estados da mesma tela, porque as cores MUDAM entre eles: a célula ativa
 * inverte (`bg-ink text-paper`) e o glifo sai da opacidade de repouso. Foi
 * exatamente no rótulo da célula invertida que a reprovação de 1,17:1 morava.
 */
const CENARIOS = [
  { id: "vazio", rotulo: "nada pedindo decisão", opcoes: {} },
  { id: "fila", rotulo: "3 na fila do CRM", opcoes: { publish: FILA } },
];

/**
 * `papel` é o que a pessoa vê, não o seletor. `quantos` declara a contagem
 * esperada — casar com um número diferente é falha de alvo, e é o que teria
 * pego os três erros acima na hora.
 */
const ALVOS = [
  // ══ casca ══ presente nos dois cenários
  { nome: "masthead · marca", piso: CORPO, onde: (p) => p.locator("header").getByRole("link", { name: "trackforge" }) },
  { nome: "masthead · 'Edição ·'", piso: MIUDO, onde: (p) => p.locator('header span[aria-hidden="true"]') },
  { nome: "masthead · frente ativa", piso: CORPO, onde: (p) => p.locator('header button[aria-pressed="true"]') },
  { nome: "masthead · frente inativa", piso: CORPO, quantos: 2, onde: (p) => p.locator('header button[aria-pressed="false"]') },
  { nome: "dateline · praça e mês", piso: MIUDO, onde: (p) => p.getByText("São Paulo ·") },
  { nome: "dateline · custo do mês", piso: MIUDO, onde: (p) => p.locator("header + div span.font-mono") },
  { nome: "dateline · rótulo 'Mês'", piso: MIUDO, onde: (p) => p.getByText("Mês", { exact: true }) },
  { nome: "dateline · botão de tema", piso: MIUDO, onde: (p) => p.locator("header + div button") },
  // O sinal é filho DIRETO da faixa; a seção "Situação" mora dentro de um span.
  // Sem o `>` os dois casam e a medição vira loteria — foi um dos três erros.
  { nome: "faixa · ponto do sinal", piso: MIUDO, onde: (p) => p.locator('nav > a[href="/"] > span[aria-hidden="true"]') },
  { nome: "faixa · frase do sinal", piso: CORPO, onde: (p) => p.locator('nav > a[href="/"] > span:not([aria-hidden])') },
  { nome: "faixa · seção ativa", piso: CORPO, onde: (p) => p.locator('nav a[aria-current="page"]') },
  { nome: "faixa · seção inativa", piso: CORPO, quantos: 4, onde: (p) => p.locator("nav span > a:not([aria-current]):not([aria-label])") },
  { nome: "faixa · botão produzir (+)", piso: MIUDO, onde: (p) => p.locator("nav a[aria-label]") },

  // ══ corpo ══ a linha de prova existe nos dois estados
  { nome: "prova · situação e frente", piso: MIUDO, onde: (p) => p.locator("main div.font-mono > span").first() },
  { nome: "prova · mês de referência", piso: MIUDO, onde: (p) => p.locator("main div.font-mono > span").last() },
  { nome: "grade · número da célula", piso: MIUDO, quantos: 4, onde: (p) => p.locator("main .grid button > span.font-mono") },
  { nome: "grade · valor da célula", piso: CORPO, quantos: 4, onde: (p) => p.locator("main .grid button > b") },
  { nome: "grade · rótulo da célula", piso: MIUDO, quantos: 4, onde: (p) => p.locator("main .grid button > span:last-child") },
];

/** Alvos que só existem num estado — declarados por cenário, não adivinhados. */
const ALVOS_POR_CENARIO = {
  vazio: [
    { nome: "vazio · selo 'Situação'", piso: MIUDO, onde: (p) => p.locator("main .border-dashed span").first() },
    { nome: "vazio · manchete", piso: CORPO, onde: (p) => p.getByRole("heading", { name: "Nada pedindo decisão" }) },
    { nome: "vazio · frase de saída", piso: CORPO, onde: (p) => p.getByText("O atalho é produzir") },
    { nome: "vazio · botão Ir para Peças", piso: CORPO, onde: (p) => p.getByRole("link", { name: "Ir para Peças" }) },
    {
      nome: "glifo em repouso",
      piso: MIUDO,
      /**
       * ÚNICA EXCEÇÃO DECLARADA DA SUÍTE, e ela continua sendo MEDIDA E
       * IMPRESSA — exceção que ninguém mede vira exceção que ninguém revisa.
       *
       * O `0` a 30% de opacidade dá ~1,9:1, abaixo do piso de ornamento. Ele
       * está isento porque é decoração redundante, não informação: a spec
       * travada pede "glifo `0` quieto + empty 'Nada pedindo decisão'" no mesmo
       * quadro, e essa manchete diz a mesma coisa em palavras a 14,86:1, logo
       * abaixo. Quem não enxerga o `0` não perde nada.
       *
       * O que NÃO vale como exceção: qualquer alvo em que a informação só
       * exista naquela cor. Se um dia o glifo em repouso passar a contar algo
       * que a frase não diz, esta isenção morre junto.
       */
      isento: "decoração redundante — a manchete abaixo diz o mesmo a 14,86:1",
      onde: (p) => p.locator("main p.leading-\\[0\\.82\\]"),
    },
  ],
  fila: [
    { nome: "glifo · a manchete", piso: CORPO, onde: (p) => p.locator("main p.leading-\\[0\\.82\\]") },
    { nome: "legenda · o que o glifo conta", piso: CORPO, onde: (p) => p.locator("main p.max-w-\\[62ch\\] > b") },
    { nome: "legenda · complemento", piso: CORPO, onde: (p) => p.locator("main p.max-w-\\[62ch\\]") },
    { nome: "lista · índice", piso: MIUDO, quantos: 3, onde: (p) => p.locator("main ul li span.font-mono") },
    { nome: "lista · título do item", piso: CORPO, quantos: 3, onde: (p) => p.locator("main ul li .truncate") },
    { nome: "lista · meta do item", piso: MIUDO, quantos: 3, onde: (p) => p.locator("main ul li .truncate + span") },
    { nome: "lista · seta", piso: MIUDO, quantos: 3, onde: (p) => p.locator('main ul li span[aria-hidden="true"]') },
  ],
};

const TEMAS = ["claro", "escuro"];
const navegador = await abrirNavegador();
let reprovou = 0;

for (const cenario of CENARIOS) {
  for (const tema of TEMAS) {
    console.log(`\n══ ${cenario.rotulo} · tema ${tema} ══`);
    const { pagina } = await novaPagina(navegador, { tema, ...cenario.opcoes });
    await pagina.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 25_000 });
    await pagina.waitForTimeout(600);

    for (const alvo of [...ALVOS, ...ALVOS_POR_CENARIO[cenario.id]]) {
      const esperados = alvo.quantos ?? 1;
      const local = alvo.onde(pagina);
      const achados = await local.count();

      if (achados !== esperados) {
        reprovou++;
        console.log(
          `  \x1b[31mALVO\x1b[0m    ${alvo.nome}: casou com ${achados}, esperava ${esperados}` +
            (achados === 0 ? " — sumiu da tela ou mudou de nome" : " — seletor pegando demais"),
        );
        continue;
      }

      for (let i = 0; i < achados; i++) {
        const { razao, texto, opacidade } = await local.nth(i).evaluate(medirContraste);
        const passa = razao >= alvo.piso;
        if (!passa && !alvo.isento) reprovou++;
        const marca = alvo.isento
          ? "\x1b[33misento\x1b[0m "
          : passa
            ? "\x1b[32mpassa\x1b[0m  "
            : "\x1b[31mREPROVA\x1b[0m";
        const sufixo = achados > 1 ? ` [${i + 1}/${achados}]` : "";
        const op = opacidade < 1 ? ` op.${opacidade}` : "";
        console.log(
          `  ${marca} ${alvo.nome}${sufixo}: ${razao.toFixed(2)}:1 (piso ${alvo.piso}${op}) — "${texto}"`,
        );
        if (alvo.isento) console.log(`          ↳ ${alvo.isento}`);
      }
    }

    await pagina.close();
  }
}

await navegador.close();
console.log(
  reprovou === 0
    ? "\n\x1b[32m✓\x1b[0m todos os pares declarados passam nos dois temas"
    : `\n\x1b[31m✖ ${reprovou} reprovação(ões)\x1b[0m`,
);
process.exit(reprovou === 0 ? 0 : 1);

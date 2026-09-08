#!/usr/bin/env node
/**
 * Contraste dos pares declarados, tela por tela, nos dois temas.
 *
 * O gate (CLAUDE.md seção 4): corpo ≥ 4,5:1, rótulo pequeno e ornamento ≥ 3:1,
 * medido SOBRE O APP, porque token que passa no claro reprova no escuro — e a
 * recíproca também, que foi como o sinal da faixa reprovou só no claro.
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
 *
 * PARA ACHAR PAR NOVO, não escreva seletor no escuro: rode a sonda de descoberta
 * (percorre o DOM e lista todo texto abaixo do piso), veja o que ela aponta, e
 * declare aqui o que for informação. Foi assim que o KPI urgente de 1,04:1
 * apareceu — nenhum alvo declarado cobria aquela célula.
 */

import { abrirNavegador, aquecer, novaPagina, BASE, medirContraste } from "./lib/navegador.mjs";

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
 * A casca aparece em toda tela que nasce do `EsteiraShell`. Medida uma vez por
 * tela mesmo assim: o fundo por trás dela não muda, mas o custo é baixo e uma
 * regressão de token aparece na primeira tela em vez da última.
 */
const casca = ({ secaoAtiva = true } = {}) => [
  { nome: "masthead · marca", piso: CORPO, onde: (p) => p.locator("header").getByRole("link", { name: "trackforge" }) },
  { nome: "masthead · 'Edição ·'", piso: MIUDO, onde: (p) => p.locator('header span[aria-hidden="true"]') },
  { nome: "masthead · frente ativa", piso: CORPO, onde: (p) => p.locator('header button[aria-pressed="true"]') },
  { nome: "masthead · frente inativa", piso: CORPO, quantos: 2, onde: (p) => p.locator('header button[aria-pressed="false"]') },
  { nome: "dateline · praça e mês", piso: MIUDO, onde: (p) => p.getByText("São Paulo ·") },
  { nome: "dateline · custo do mês", piso: MIUDO, onde: (p) => p.locator("header + div span.font-mono") },
  { nome: "dateline · botão de tema", piso: MIUDO, onde: (p) => p.locator("header + div button").last() },
  // O sinal é filho DIRETO da faixa; a seção "Situação" mora dentro de um span.
  // Sem o `>` os dois casam e a medição vira loteria — foi um dos três erros.
  { nome: "faixa · ponto do sinal", piso: MIUDO, onde: (p) => p.locator('nav > a[href="/"] > span[aria-hidden="true"]') },
  { nome: "faixa · frase do sinal", piso: CORPO, onde: (p) => p.locator('nav > a[href="/"] > span:not([aria-hidden])') },
  /**
   * `/artigo` e `/esteira` NÃO estão no menu, então nelas nenhuma seção fica
   * marcada e as cinco ficam inativas. A contagem declarada pegou isso na
   * primeira rodada, que é exatamente para o que ela serve — a alternativa era
   * medir "a seção ativa" num link qualquer e nunca saber.
   */
  ...(secaoAtiva
    ? [
        { nome: "faixa · seção ativa", piso: CORPO, onde: (p) => p.locator('nav a[aria-current="page"]') },
        { nome: "faixa · seção inativa", piso: CORPO, quantos: 4, onde: (p) => p.locator("nav span > a:not([aria-current]):not([aria-label])") },
      ]
    : [
        { nome: "faixa · seção inativa (tela fora do menu)", piso: CORPO, quantos: 5, onde: (p) => p.locator("nav span > a:not([aria-current]):not([aria-label])") },
      ]),
  { nome: "faixa · botão produzir (+)", piso: MIUDO, onde: (p) => p.locator("nav a[aria-label]") },
];

/**
 * Cabeçalho comum dos interiores: rótulo da seção, título e a frase que explica
 * a tela. A frase é CORPO — ela diz o que a tela faz e o que ela não faz.
 */
const CABECALHO = (titulo) => [
  { nome: "cabeçalho · rótulo da seção", piso: MIUDO, onde: (p) => p.locator("main span.uppercase.text-mut").first() },
  { nome: "cabeçalho · título", piso: CORPO, onde: (p) => p.getByRole("heading", { name: titulo }) },
  { nome: "cabeçalho · frase da tela", piso: CORPO, onde: (p) => p.locator("main p.text-\\[13px\\]").first() },
];

/** Os quatro cartões de número que Peças, Fatos e Custos compartilham. */
const KPIS = [
  { nome: "kpi · valor", piso: CORPO, quantos: 4, onde: (p) => p.locator("main span.text-\\[28px\\]") },
  { nome: "kpi · legenda", piso: MIUDO, quantos: 4, onde: (p) => p.locator("main span.text-xs") },
];

const TELAS = [
  {
    rota: "/",
    nome: "Situação",
    /**
     * Dois estados da MESMA tela, porque as cores mudam entre eles: a célula
     * ativa inverte (`bg-ink text-paper`) e o glifo sai da opacidade de
     * repouso. Foi no rótulo da célula invertida que morava o 1,17:1.
     */
    cenarios: [
      { id: "vazio", rotulo: "nada pedindo decisão", opcoes: {} },
      { id: "fila", rotulo: "3 na fila do CRM", opcoes: { publish: FILA } },
    ],
    alvos: [
      ...casca(),
      { nome: "dateline · rótulo 'Mês'", piso: MIUDO, onde: (p) => p.getByText("Mês", { exact: true }) },
      { nome: "prova · situação e frente", piso: MIUDO, onde: (p) => p.locator("main div.font-mono > span").first() },
      { nome: "prova · mês de referência", piso: MIUDO, onde: (p) => p.locator("main div.font-mono > span").last() },
      { nome: "grade · número da célula", piso: MIUDO, quantos: 4, onde: (p) => p.locator("main .grid button > span.font-mono") },
      { nome: "grade · valor da célula", piso: CORPO, quantos: 4, onde: (p) => p.locator("main .grid button > b") },
      { nome: "grade · rótulo da célula", piso: MIUDO, quantos: 4, onde: (p) => p.locator("main .grid button > span:last-child") },
    ],
    porCenario: {
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
           * travada pede "glifo `0` quieto + empty 'Nada pedindo decisão'" no
           * mesmo quadro, e essa manchete diz a mesma coisa em palavras a
           * 14,86:1, logo abaixo. Quem não enxerga o `0` não perde nada.
           *
           * O que NÃO vale como exceção: qualquer alvo em que a informação só
           * exista naquela cor. Se um dia o glifo em repouso passar a contar
           * algo que a frase não diz, esta isenção morre junto.
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
    },
  },

  {
    rota: "/esteira/pecas",
    nome: "Peças",
    alvos: [...casca(), ...CABECALHO("O que já foi produzido"), ...KPIS],
  },

  {
    rota: "/esteira/fatos",
    nome: "Fatos",
    alvos: [
      ...casca(),
      ...CABECALHO("O que a ferramenta pode afirmar"),
      { nome: "kpi · valor comum", piso: CORPO, quantos: 3, onde: (p) => p.locator("main div:not(.bg-acc) > span.text-\\[28px\\]") },
      /**
       * O CARTÃO URGENTE É O ALVO MAIS CARO DESTA SUÍTE.
       *
       * Ele carregava `bg-surface` (do `panelClass`) e `bg-acc` na mesma lista
       * de classes, e quem vence é a ordem do CSS gerado, não a da string:
       * `bg-surface` ganhava, o cartão nunca ficava laranja. No claro passava
       * despercebido — quase-preto sobre branco é legível. No escuro era
       * `#1c1c1b` sobre `#201f1d`: 1,04:1, o número mais importante da tela
       * apagado. Nenhum alvo declarado cobria essa célula até 07/09/2026.
       */
      { nome: "kpi urgente · valor", piso: CORPO, onde: (p) => p.locator("main .bg-acc span.text-\\[28px\\]") },
      { nome: "kpi urgente · rótulo", piso: MIUDO, onde: (p) => p.locator("main .bg-acc span.uppercase") },
      { nome: "kpi urgente · legenda", piso: MIUDO, onde: (p) => p.locator("main .bg-acc span.text-xs") },
      { nome: "fato · o texto da afirmação", piso: CORPO, onde: (p) => p.locator("main p.leading-relaxed").first() },
      // Os selos de proveniência decidem se um fato pode virar número numa peça
      // (seção 2). Ilegível aqui é a pessoa aprovando o que não devia.
      { nome: "selo · não verificado", piso: MIUDO, onde: (p) => p.getByText("não verificado", { exact: true }).first() },
      { nome: "selo · primária", piso: MIUDO, onde: (p) => p.getByText("primária", { exact: true }).first() },
      { nome: "selo · secundária", piso: MIUDO, onde: (p) => p.getByText("secundária", { exact: true }).first() },
      { nome: "fato · id e origem", piso: MIUDO, onde: (p) => p.locator("main p.leading-relaxed + span, main span.text-faint").first() },
    ],
  },

  {
    rota: "/esteira/custos",
    nome: "Custos",
    alvos: [...casca(), ...CABECALHO("O que a API cobrou"), ...KPIS],
  },

  {
    rota: "/esteira/instalacao",
    nome: "Instalação",
    alvos: [...casca(), ...CABECALHO("O que está ligado aqui")],
  },

  {
    rota: "/artigo",
    nome: "Bancada",
    alvos: [
      // `/artigo` não está no menu: nenhuma seção fica marcada.
      ...casca({ secaoAtiva: false }),
      { nome: "bancada · rótulo de seção", piso: MIUDO, onde: (p) => p.locator("main span.uppercase.text-mut").first() },
      { nome: "bancada · origem escolhida", piso: CORPO, onde: (p) => p.locator("main button.flex-1.rounded-md").first() },
      { nome: "bancada · origem não escolhida", piso: CORPO, onde: (p) => p.locator("main button.flex-1.rounded-md").last() },
      { nome: "bancada · nota de CRM ausente", piso: CORPO, onde: (p) => p.locator("main p.border-dashed").first() },
      { nome: "bancada · nome do formato", piso: CORPO, onde: (p) => p.locator("main span.leading-tight").first() },
      { nome: "bancada · contador de marcados", piso: MIUDO, onde: (p) => p.locator("main span.text-faint").first() },
      { nome: "bancada · botão de gerar", piso: CORPO, onde: (p) => p.getByRole("button", { name: /Gerar \d+ peças?/ }) },
    ],
  },

  {
    // O editor NÃO nasce do `EsteiraShell` — tem casca própria, sem masthead
    // nem faixa. Por isso não recebe `casca()`: alvo que não existe é reprovação,
    // e reprovar por ausência esperada seria ruído.
    rota: "/editor",
    nome: "Editor",
    alvos: [
      { nome: "editor · marca no caminho", piso: CORPO, onde: (p) => p.getByRole("link", { name: "Trackforge OS" }) },
      { nome: "editor · separador do caminho", piso: MIUDO, onde: (p) => p.locator("span.text-faint").first() },
      { nome: "editor · seção atual", piso: CORPO, onde: (p) => p.getByText("Editor", { exact: true }).first() },
      { nome: "editor · título", piso: CORPO, onde: (p) => p.getByRole("heading", { name: "Gere um carrossel B2B" }) },
      { nome: "editor · rótulo de bloco", piso: MIUDO, onde: (p) => p.locator("span.uppercase.text-mut").first() },
      { nome: "editor · tecla de atalho", piso: MIUDO, onde: (p) => p.locator("kbd").first() },
      { nome: "editor · opção de notícias", piso: CORPO, onde: (p) => p.getByText("Incluir notícias recentes do setor") },
      { nome: "editor · exemplo de URL", piso: CORPO, onde: (p) => p.locator("span.truncate").first() },
      { nome: "editor · formato ativo", piso: CORPO, onde: (p) => p.getByRole("button", { name: "Carrossel", exact: true }) },
      { nome: "editor · plataforma", piso: CORPO, onde: (p) => p.getByRole("button", { name: "Instagram", exact: true }).first() },
    ],
  },
];

const TEMAS = ["claro", "escuro"];

await aquecer(TELAS.map((t) => t.rota));
const navegador = await abrirNavegador();
let reprovou = 0;
let medidos = 0;

for (const tela of TELAS) {
  const cenarios = tela.cenarios ?? [{ id: "padrao", rotulo: "estado padrão", opcoes: {} }];

  for (const cenario of cenarios) {
    for (const tema of TEMAS) {
      const titulo =
        cenarios.length > 1
          ? `${tela.nome} · ${cenario.rotulo} · tema ${tema}`
          : `${tela.nome} (${tela.rota}) · tema ${tema}`;
      console.log(`\n══ ${titulo} ══`);

      const { pagina } = await novaPagina(navegador, { tema, ...cenario.opcoes });
      await pagina.goto(`${BASE}${tela.rota}`, { waitUntil: "networkidle", timeout: 40_000 });
      await pagina.waitForTimeout(700);

      const alvos = [...tela.alvos, ...(tela.porCenario?.[cenario.id] ?? [])];
      for (const alvo of alvos) {
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
          medidos++;
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
}

await navegador.close();
console.log(
  reprovou === 0
    ? `\n\x1b[32m✓\x1b[0m ${medidos} medições em ${TELAS.length} telas, todas acima do piso`
    : `\n\x1b[31m✖ ${reprovou} reprovação(ões)\x1b[0m`,
);
process.exit(reprovou === 0 ? 0 : 1);

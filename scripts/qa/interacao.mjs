#!/usr/bin/env node
/**
 * Passada de interação, com a rede interceptada.
 *
 * A varredura de rotas prova que cada tela RENDERIZA. Esta prova que ela
 * RESPONDE — e cobre as classes de bug que este projeto já pagou:
 *
 *   · frente que muda num lugar e não no outro (fato da Sanwey no painel da
 *     Resibag é a classe de bug que o store global existe para impedir);
 *   · tema que não sobrevive à navegação (a tela nasce clara e pisca);
 *   · faixa e glifo respondendo "o que espera decisão" com regras separadas —
 *     duas respostas para a mesma pergunta é como uma passa a mentir;
 *   · chave do localStorage que mudou de prefixo e levou junto o dado de quem
 *     já usava a ferramenta.
 *
 * Cada verificação IMPRIME O QUE MEDIU, não "passou": relatório que só sabe
 * dizer verde não distingue teste que rodou de teste que não achou nada.
 */

import { abrirNavegador, aquecer, novaPagina, BASE } from "./lib/navegador.mjs";

const FILA = {
  configured: true,
  pending: [
    { id: "p1", title: "Revisão da ANTT 5.998 — o que muda no descarte", summary: null, priority: "alta", createdAt: "2026-09-01T12:00:00.000Z" },
    { id: "p2", title: "Checklist de conformidade para embarcadores", summary: null, priority: "media", createdAt: "2026-09-03T12:00:00.000Z" },
    { id: "p3", title: "Custo real de um lote reprovado na fiscalização", summary: null, priority: "baixa", createdAt: "2026-09-05T12:00:00.000Z" },
  ],
};

let reprovou = 0;
const passos = [];

/** Registra o que foi medido; o valor esperado fica ao lado, sempre. */
function confere(rotulo, obtido, esperado) {
  // `innerText` de container flex traz quebra entre os filhos — o ponto e a
  // frase do sinal são dois spans. Compara o texto como se lê, numa linha.
  const limpa = (v) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : v);
  obtido = limpa(obtido);
  const ok = String(obtido) === String(limpa(esperado));
  if (!ok) reprovou++;
  passos.push({ ok, rotulo, obtido, esperado });
  console.log(
    `  ${ok ? "\x1b[32mok  \x1b[0m" : "\x1b[31mFALHA\x1b[0m"} ${rotulo}: ${JSON.stringify(obtido)}` +
      (ok ? "" : ` — esperava ${JSON.stringify(esperado)}`),
  );
}

await aquecer(["/", "/esteira/custos", "/esteira/fatos"]);

const navegador = await abrirNavegador();

// ══ 1 ══ a frente é global: trocar no masthead muda a tela e atravessa rota
{
  console.log("\n══ frente ativa atravessa a navegação ══");
  const { pagina } = await novaPagina(navegador, { publish: FILA });
  await pagina.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(500);

  confere(
    "prova da home nasce na frente semeada",
    await pagina.locator("main div.font-mono > span").first().innerText(),
    "SITUAÇÃO · RESIBAG",
  );

  await pagina.locator("header").getByRole("button", { name: "Sanwey" }).click();
  await pagina.waitForTimeout(300);
  confere(
    "trocar a frente muda a linha de prova",
    await pagina.locator("main div.font-mono > span").first().innerText(),
    "SITUAÇÃO · SANWEY",
  );
  confere(
    "o botão da frente nova é o marcado",
    await pagina.locator('header button[aria-pressed="true"]').innerText(),
    "SANWEY",
  );

  // A rota seguinte é outra tela inteira: se a frente morasse no estado da
  // página, ela voltaria para o padrão aqui.
  await pagina.goto(`${BASE}/esteira/custos`, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(400);
  confere(
    "a frente sobrevive à troca de tela",
    await pagina.locator('header button[aria-pressed="true"]').innerText(),
    "SANWEY",
  );
  await pagina.close();
}

// ══ 2 ══ tema escolhido persiste, e o atributo manda
{
  console.log("\n══ tema persiste entre telas ══");
  const { pagina } = await novaPagina(navegador, { tema: "claro" });
  await pagina.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(400);
  confere(
    "nasce no tema semeado",
    await pagina.locator("html").getAttribute("data-tema"),
    "claro",
  );

  await pagina.locator("header + div button").click();
  await pagina.waitForTimeout(300);
  const depois = await pagina.locator("html").getAttribute("data-tema");
  confere("um clique sai do tema anterior", depois !== "claro", true);

  await pagina.goto(`${BASE}/esteira/fatos`, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(400);
  confere(
    "o tema escolhido atravessa a navegação",
    await pagina.locator("html").getAttribute("data-tema"),
    depois,
  );
  await pagina.close();
}

// ══ 3 ══ faixa e glifo respondem a MESMA pergunta com a MESMA regra
{
  console.log("\n══ faixa e glifo concordam sobre o que espera decisão ══");
  const { pagina } = await novaPagina(navegador, { publish: FILA });
  await pagina.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(600);

  confere(
    "a faixa conta a fila semeada",
    await pagina.locator('nav > a[href="/"]').innerText(),
    "• 3 ESPERAM · NA FILA DO CRM",
  );
  confere(
    "o glifo mostra o mesmo número",
    (await pagina.locator("main p.leading-\\[0\\.82\\]").innerText()).replace(/\s|\./g, ""),
    "3",
  );
  confere(
    "a célula invertida é a da fila",
    await pagina.locator('main .grid button[aria-pressed="true"] > span:last-child').innerText(),
    "FILA CRM",
  );
  confere(
    "a lista abre os itens da fila",
    await pagina.locator("main ul li").count(),
    3,
  );

  // Escolher outra célula troca o glifo e a lista — é a interação central da home.
  await pagina.locator("main .grid button").nth(1).click();
  await pagina.waitForTimeout(300);
  confere(
    "clicar 'não enviados' inverte aquela célula",
    await pagina.locator('main .grid button[aria-pressed="true"] > span:last-child').innerText(),
    "NÃO ENVIADOS",
  );
  confere(
    "o glifo passa a contar a célula escolhida",
    (await pagina.locator("main p.leading-\\[0\\.82\\]").innerText()).replace(/\s|\./g, ""),
    "0",
  );
  // A faixa NÃO segue o clique: ela responde a prioridade real, não a escolha
  // de leitura. Se seguisse, a casca deixaria de avisar o que espera decisão.
  confere(
    "a faixa continua na prioridade real",
    await pagina.locator('nav > a[href="/"]').innerText(),
    "• 3 ESPERAM · NA FILA DO CRM",
  );
  await pagina.close();
}

// ══ 4 ══ fila vazia diz "em dia" — e fila FORA DO AR não diz
{
  console.log("\n══ fila vazia e fila fora do ar são estados diferentes ══");
  const { pagina } = await novaPagina(navegador, {
    publish: { configured: true, pending: [] },
  });
  await pagina.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(600);
  confere("fila vazia e configurada", await pagina.locator('nav > a[href="/"]').innerText(), "• EM DIA");
  await pagina.close();

  const { pagina: p2 } = await novaPagina(navegador, {
    publish: { configured: true, unreachable: true, pending: [] },
  });
  await p2.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p2.waitForTimeout(600);
  // "Não sei" NÃO pode virar "em dia": seria uma afirmação falsa no lugar mais
  // visível da casca, e falsa justamente sobre o que exige decisão.
  confere("fila fora do ar não vira 'em dia'", await p2.locator('nav > a[href="/"]').innerText(), "• FILA INDISPONÍVEL");
  confere(
    "e a home avisa o erro em cima",
    await p2.getByText("Não foi possível carregar a fila.").isVisible(),
    true,
  );
  await p2.close();
}

// ══ 5 ══ herança da chave antiga do localStorage
{
  console.log("\n══ dado gravado no prefixo antigo continua sendo lido ══");
  // Semeia SÓ a chave antiga, como o navegador de quem usava antes do rename.
  // `front` é string CRUA no store (`raw === "sanwey"`), não JSON. Semear
  // '"sanwey"' com aspas faz o store cair no padrão em silêncio — foi o que
  // fingiu ser um bug de leitura na primeira rodada.
  const { pagina } = await novaPagina(navegador, {
    tema: "claro",
    localStorage: { "carousel-builder:front:v1": "sanwey" },
  });
  // A semente da chave NOVA precisa sair da frente para a herança ser exercida:
  // com as duas presentes a nova vence, que é o combinado.
  await pagina.addInitScript(() => localStorage.removeItem("trackforge:front:v1"));
  await pagina.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(600);

  confere(
    "a frente veio da chave antiga",
    await pagina.locator('header button[aria-pressed="true"]').innerText(),
    "SANWEY",
  );
  confere(
    "e foi promovida para a chave nova",
    await pagina.evaluate(() => localStorage.getItem("trackforge:front:v1")),
    "sanwey",
  );
  confere(
    "a chave antiga continua lá, como retrato",
    await pagina.evaluate(() => localStorage.getItem("carousel-builder:front:v1")),
    "sanwey",
  );
  await pagina.close();
}

await navegador.close();

const total = passos.length;
console.log(
  reprovou === 0
    ? `\n\x1b[32m✓\x1b[0m ${total} verificações, todas com o valor esperado`
    : `\n\x1b[31m✖ ${reprovou} de ${total} falharam\x1b[0m`,
);
process.exit(reprovou === 0 ? 0 : 1);

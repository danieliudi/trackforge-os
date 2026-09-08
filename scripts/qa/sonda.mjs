#!/usr/bin/env node
/**
 * Sonda de descoberta: percorre o DOM e lista TODO texto abaixo do piso.
 *
 * NÃO é gate, e não entra no `npm run qa`. Ela existe porque o `contraste.mjs`
 * só mede o que alguém declarou, e o defeito mais caro que este projeto tinha
 * em 07/09/2026 estava justamente onde não havia alvo: o cartão de KPI urgente
 * da tela de Fatos, a 1,04:1 no tema escuro — o número mais importante da tela,
 * invisível, por uma colisão de classes que passava por typecheck e por lint.
 *
 * O fluxo é: sonda ACHA, pessoa CLASSIFICA (corpo ou rótulo?), `contraste.mjs`
 * DECLARA. Ela nunca julga sozinha — varredura automática erra escolhendo alvo,
 * e três seletores improvisados já produziram três números falsos aqui.
 *
 *   node scripts/qa/sonda.mjs              # todas as telas
 *   node scripts/qa/sonda.mjs /esteira/fatos
 */

import { abrirNavegador, novaPagina, BASE, medirContraste } from "./lib/navegador.mjs";

const TODAS = [
  "/", "/esteira", "/esteira/pecas", "/esteira/avulso", "/esteira/custos",
  "/esteira/fatos", "/esteira/instalacao", "/artigo", "/editor", "/biblioteca",
];
const ROTAS = process.argv.slice(2).length > 0 ? process.argv.slice(2) : TODAS;

/** Piso de corpo: tudo abaixo disso vale um olhar, mesmo o que for rótulo. */
const OLHAR = 4.5;

/**
 * O texto PRÓPRIO do elemento (nó de texto direto), não `innerText`.
 *
 * Com `innerText` cada ancestral reporta o texto dos filhos e a lista vira o
 * mesmo achado repetido cinco vezes, uma por nível da árvore.
 */
function textoProprio(node) {
  const proprio = [...node.childNodes]
    .filter((n) => n.nodeType === 3)
    .map((n) => n.textContent)
    .join("")
    .trim();
  const r = node.getBoundingClientRect();
  const cs = getComputedStyle(node);
  if (!proprio || r.width < 1 || r.height < 1 || cs.visibility === "hidden") return null;
  return {
    px: Math.round(parseFloat(cs.fontSize) * 10) / 10,
    peso: cs.fontWeight,
    classe: (node.getAttribute("class") ?? "").slice(0, 72),
    tag: node.tagName.toLowerCase(),
  };
}

const navegador = await abrirNavegador();

for (const rota of ROTAS) {
  for (const tema of ["claro", "escuro"]) {
    const { pagina } = await novaPagina(navegador, { tema, largura: 1900, altura: 1000 });
    await pagina.goto(`${BASE}${rota}`, { waitUntil: "networkidle", timeout: 40_000 });
    await pagina.waitForTimeout(800);

    // `/editor` tem casca própria e não usa <main> — daí o recuo para body.
    const dentro = await pagina.$$("main *");
    const lista = dentro.length > 0 ? dentro : await pagina.$$("body *");

    const baixos = [];
    let comTexto = 0;
    for (const el of lista) {
      const dados = await el.evaluate(textoProprio);
      if (!dados) continue;
      comTexto++;
      // Mede pelo MESMO medidor do gate: dois medidores é como um passa a mentir.
      const { razao, texto, opacidade } = await el.evaluate(medirContraste);
      if (razao < OLHAR) baixos.push({ ...dados, razao, texto, opacidade });
    }

    baixos.sort((a, b) => a.razao - b.razao);
    console.log(
      `\n══ ${rota} · ${tema} — ${comTexto} textos, ${baixos.length} abaixo de ${OLHAR} ══`,
    );
    for (const b of baixos) {
      const op = b.opacidade < 1 ? ` op.${b.opacidade}` : "";
      console.log(
        `  ${b.razao.toFixed(2)}:1  ${String(b.px).padStart(5)}px/${b.peso}${op}  <${b.tag}> "${b.texto}"`,
      );
      if (b.classe) console.log(`          ${b.classe}`);
    }
    if (baixos.length === 0) console.log("  nada abaixo do piso de corpo");

    await pagina.close();
  }
}

await navegador.close();
console.log(
  "\nA sonda ACHA; quem classifica o papel é você, e quem passa a vigiar é " +
    "`scripts/qa/contraste.mjs`. Ela não reprova nada sozinha.",
);

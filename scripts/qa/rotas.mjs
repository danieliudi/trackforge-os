#!/usr/bin/env node
/**
 * Varredura de rotas: todas as telas, no monitor e no celular.
 *
 * O QUE ELA PROVA, E POR QUE ISSO IMPORTA MAIS QUE "200 OK": cada rota declara
 * um `marca` — um texto que só aparece se a tela CERTA renderizou. Sem isso a
 * varredura passa com o `src/proxy.ts` ligado e sem senha, reportando onze rotas
 * limpas que são onze telas de bloqueio.
 *
 *   varredura que passa sem provar que renderizou a tela certa vale menos que
 *   nada, porque dá sensação de cobertura.
 *
 * As marcas foram COLHIDAS do app rodando em 07/09/2026, não inventadas. Se uma
 * falhar depois de um redesign legítimo, atualize a marca aqui — mas leia a tela
 * antes, porque a mesma falha aparece quando ela quebrou de verdade.
 */

import { abrirNavegador, novaPagina, BASE } from "./lib/navegador.mjs";

const LARGURAS = [
  { nome: "monitor", largura: 1900, altura: 1000 },
  { nome: "celular", largura: 390, altura: 844 },
];

/**
 * `/esteira`, `/esteira/avulso` e `/artigo` renderizam a MESMA bancada hoje —
 * por isso compartilham a marca. Não é engano da suíte; é o estado do app, e
 * está registrado aqui para quem for mexer nessas três não achar que é.
 */
const BANCADA = "ORIGEM";

const ROTAS = [
  { rota: "/", marca: "SITUAÇÃO" },
  { rota: "/esteira", marca: BANCADA },
  { rota: "/esteira/pecas", marca: "O que já foi produzido" },
  { rota: "/esteira/avulso", marca: BANCADA },
  { rota: "/esteira/custos", marca: "O que a API cobrou" },
  { rota: "/esteira/fatos", marca: "O que a ferramenta pode afirmar" },
  { rota: "/esteira/instalacao", marca: "O que está ligado aqui" },
  { rota: "/artigo", marca: BANCADA },
  { rota: "/editor", marca: "Editor" },
  { rota: "/biblioteca", marca: "Imagens da frente" },
  { rota: "/slides-preview", marca: "01 / 05" },
];

/** Texto mínimo para não ser tela em branco com casca por cima. */
const MINIMO_DE_TEXTO = 40;

const navegador = await abrirNavegador();
let reprovou = 0;

for (const { nome, largura, altura } of LARGURAS) {
  console.log(`\n══ ${nome} · ${largura}×${altura} ══`);

  for (const { rota, marca } of ROTAS) {
    const { pagina, problemas } = await novaPagina(navegador, { largura, altura });
    const falhas = [];

    try {
      await pagina.goto(`${BASE}${rota}`, { waitUntil: "networkidle", timeout: 25_000 });
      await pagina.waitForTimeout(500);

      const visto = await pagina.evaluate(
        ([marcaProcurada, minimo]) => {
          const corpo = document.body.innerText ?? "";
          return {
            temMarca: corpo.includes(marcaProcurada),
            comprimento: corpo.replace(/\s+/g, " ").trim().length,
            rolagemH: document.documentElement.scrollWidth > window.innerWidth + 1,
            emBranco: corpo.replace(/\s+/g, " ").trim().length < minimo,
          };
        },
        [marca, MINIMO_DE_TEXTO],
      );

      if (!visto.temMarca) falhas.push(`não achou "${marca}" — tela errada ou bloqueio?`);
      if (visto.emBranco) falhas.push(`tela em branco (${visto.comprimento} caracteres)`);
      if (visto.rolagemH) falhas.push("rolagem horizontal");
      falhas.push(...problemas);
    } catch (e) {
      falhas.push(`não carregou: ${String(e.message).split("\n")[0].slice(0, 90)}`);
    }

    if (falhas.length > 0) reprovou++;
    const sinal = falhas.length === 0 ? "\x1b[32mok  \x1b[0m" : "\x1b[31mFALHA\x1b[0m";
    console.log(`  ${sinal} ${rota}`);
    for (const f of falhas) console.log(`        ${f}`);

    await pagina.close();
  }
}

await navegador.close();

console.log(
  reprovou === 0
    ? `\n\x1b[32m✓\x1b[0m ${ROTAS.length} rotas × ${LARGURAS.length} larguras, todas renderaram a tela certa`
    : `\n\x1b[31m✖ ${reprovou} reprovação(ões)\x1b[0m`,
);
process.exit(reprovou === 0 ? 0 : 1);

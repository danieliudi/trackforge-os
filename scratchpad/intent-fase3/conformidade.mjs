/**
 * O mockup passa no gate da própria ferramenta?
 *
 * Ele exibe alegações da Resibag em tamanho real, e se for aprovado essas
 * strings entram no repositório como referência. Rodar a varredura de termo
 * proibido sobre o texto VISÍVEL do mockup fecha o ciclo: a peça de design se
 * submete à mesma regra que o produto aplica na peça do cliente.
 *
 * Existe porque a primeira versão deste mockup falhou — usou o slogan Nível 03
 * junto do endosso institucional, combinação que os fatos canônicos proíbem.
 */
import { register } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { abrirNavegador } from "../../scripts/qa/lib/navegador.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(AQUI, "..", "..");
register(pathToFileURL(join(ROOT, "scripts", "lib", "resolve-ts.mjs")));

const { findForbidden } = await import(
  pathToFileURL(join(ROOT, "src/knowledge/check.ts")).href
);

const navegador = await abrirNavegador();
const pagina = await navegador.newPage({ viewport: { width: 1900, height: 1100 } });
await pagina.goto(`file://${join(AQUI, "mockup-trabalho.html")}`);

const partes = [];
for (const estado of ["a", "b", "c", "d", "e"]) {
  await pagina.evaluate((e) => (document.documentElement.dataset.estado = e), estado);
  const texto = await pagina.evaluate((e) => {
    const el = document.getElementById(e);
    // O controle do mockup não é conteúdo da peça.
    return [...el.querySelectorAll("*")]
      .filter((n) => n.children.length === 0)
      .map((n) => n.textContent ?? "")
      .join(" ");
  }, estado);
  partes.push({ blockNumber: partes.length + 1, text: texto, estado });
}

const hits = findForbidden(partes, "resibag");
console.log(`${partes.length} estados varridos contra as proibições da Resibag`);
if (hits.length === 0) {
  console.log("limpo — nenhum termo proibido no texto visível");
} else {
  console.log(`\n${hits.length} achado(s):`);
  for (const h of hits) {
    const estado = partes[h.blockNumber - 1]?.estado ?? "?";
    console.log(`  x estado ${estado}: "${h.matched}" — ${h.term}`);
  }
}
await navegador.close();
process.exit(hits.length ? 1 : 0);

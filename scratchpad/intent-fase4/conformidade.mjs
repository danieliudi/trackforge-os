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
await pagina.goto(`file://${join(AQUI, "mockup-vozes.html")}`);

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

// A Fase 4 mostra as DUAS frentes: o estado "c" é Sanwey. Varrer tudo contra
// "resibag" acusaria marco da Sanwey como termo proibido da Resibag — e deixaria
// a Sanwey sem varredura nenhuma. Cada estado vai contra a frente que ele exibe.
const FRENTE = { a: "resibag", b: "resibag", c: "sanwey", d: "resibag", e: "resibag" };
const hits = [];
for (const parte of partes) {
  const frente = FRENTE[parte.estado];
  for (const h of findForbidden([{ ...parte, blockNumber: 1 }], frente)) {
    hits.push({ ...h, estado: parte.estado, frente });
  }
}
console.log(`${partes.length} estados varridos, cada um contra a frente que exibe`);
if (hits.length === 0) {
  console.log("limpo — nenhum termo proibido no texto visível");
} else {
  console.log(`\n${hits.length} achado(s):`);
  for (const h of hits) {
    console.log(`  x estado ${h.estado} (${h.frente}): "${h.matched}" — ${h.term}`);
  }
}
await navegador.close();
process.exit(hits.length ? 1 : 0);

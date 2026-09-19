/**
 * Contraste do mockup da Fase 7, nos cinco estados × dois temas.
 * Usa o MEDIDOR de `scripts/qa/lib/navegador.mjs` — nunca um segundo (CLAUDE.md §4).
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { abrirNavegador, medirContraste } from "../../scripts/qa/lib/navegador.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const CORPO = 4.5, MIUDO = 3;

/** Alvo declarado por PAPEL, com a contagem esperada (seção 12). */
const ALVOS = [
  [".marca", CORPO, "masthead · marca", 1],
  [".fronts .on", CORPO, "masthead · frente ativa", 1],
  [".date span", MIUDO, "dateline", 2],
  [".band .on", CORPO, "faixa · seção ativa", 1],
  [".band .sig", CORPO, "faixa · sinal do teto", 1],
  [".kicker", MIUDO, "cabeçalho · rótulo", 1],
  ["h1", CORPO, "cabeçalho · manchete", 1],
  [".lede", CORPO, "cabeçalho · frase", 1],
  [".cell .n", MIUDO, "célula · número", 4],
  [".cell b", CORPO, "célula · valor", 4],
  [".cell .rot", MIUDO, "célula · rótulo", 4],
  [".cell .sem", CORPO, "célula · ausência", 2],
  [".regua-tit", MIUDO, "régua · título", 1],
  [".regua-val", CORPO, "régua · valor", 1],
  [".regua-pe span", MIUDO, "régua · pé", 2],
  [".nota .t", CORPO, "aviso · manchete", 1],
  [".nota p", CORPO, "aviso · corpo", 1],
  [".nota .gl", MIUDO, "aviso · glifo", 1],
  [".preco-h span", MIUDO, "preço · cabeçalho", 2],
  [".linha span:first-child", CORPO, "preço · rótulo", 4],
  [".linha .v", CORPO, "preço · número", 4],
  [".preco-pe", CORPO, "preço · nota de pé", 1],
  [".botao", CORPO, "botão", 1],
  [".botao-nota", MIUDO, "botão · nota", 1],
  [".campo label", MIUDO, "campo · rótulo", 1],
];

const ESTADOS = ["sem-teto", "dentro", "perto", "estouraria", "no-teto"];
const nav = await abrirNavegador();
const p = await nav.newPage({ viewport: { width: 1900, height: 1300 } });
await p.goto(`file://${join(AQUI, "mockup-teto.html")}`);
await p.waitForFunction(() => document.fonts.ready.then(() => true));

let medidas = 0;
const falhas = [];

for (const tema of ["claro", "escuro"]) {
  for (const estado of ESTADOS) {
    await p.evaluate(([t, e]) => {
      document.documentElement.dataset.tema = t;
      document.documentElement.dataset.estado = e;
    }, [tema, estado]);
    await p.waitForTimeout(120);

    for (const [sel, piso, nome, esperados] of ALVOS) {
      const alvos = p.locator(`${sel}:visible`);
      const n = await alvos.count();
      if (n === 0) continue;                       // alvo que não existe NESTE estado
      if (esperados && n > esperados) {
        falhas.push({ tema, estado, nome, o: `casou ${n}, esperava até ${esperados}` });
        continue;
      }
      for (let i = 0; i < n; i += 1) {
        const m = await alvos.nth(i).evaluate(medirContraste);
        medidas += 1;
        if (m.razao < piso) {
          falhas.push({ tema, estado, nome, o: `${m.razao.toFixed(2)}:1 (piso ${piso}) em "${m.texto}"` });
        }
      }
    }
  }
}
await nav.close();

if (falhas.length) {
  console.log(`\n\x1b[31m✖ ${falhas.length} reprovação(ões)\x1b[0m em ${medidas} medições\n`);
  for (const f of falhas) console.log(`   ${f.tema}/${f.estado} · ${f.nome}: ${f.o}`);
  process.exit(1);
}
console.log(`\n\x1b[32m✓\x1b[0m ${medidas} medições · 5 estados × 2 temas, todas no piso\n`);

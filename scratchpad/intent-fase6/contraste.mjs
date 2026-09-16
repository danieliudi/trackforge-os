/**
 * Contraste das oito lâminas, medido no mockup RENDERIZADO.
 *
 * Mesmo medidor de scripts/qa/lib/navegador.mjs — nunca um segundo, porque
 * medidor novo é como o número sai errado e parece certo (seção 12).
 *
 * O ANTES é medido junto de propósito: é assim que a reprovação que está no ar
 * aparece como número, e não como opinião minha.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { abrirNavegador, medirContraste } from "../../scripts/qa/lib/navegador.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const CORPO = 4.5;
const MIUDO = 3;

/** [seletor dentro da lâmina, piso]. Título e CTA são texto GRANDE na peça. */
const ALVOS = [
  ["h2", CORPO], [".corpo", CORPO], [".kick", MIUDO],
  [".meta span", CORPO], [".cta", MIUDO], [".selo", MIUDO],
];

const navegador = await abrirNavegador();
const pagina = await navegador.newPage({ viewport: { width: 1900, height: 1200 } });
await pagina.goto(`file://${join(AQUI, "mockup-temas.html")}`);
await pagina.waitForFunction(() => document.fonts.ready.then(() => true));

let reprovaDepois = 0;
let reprovaAntes = 0;
let medidos = 0;

for (const [estado, marca] of [["r", "Resibag"], ["s", "Sanwey"]]) {
  await pagina.evaluate((e) => { document.documentElement.dataset.e = e; }, estado);
  await pagina.waitForTimeout(150);
  console.log(`\n══════ ${marca} ══════`);

  const blocos = pagina.locator(`#${estado} .bloco`);
  for (let i = 0; i < (await blocos.count()); i += 1) {
    const bloco = blocos.nth(i);
    const nome = (await bloco.locator("h3").innerText()).trim();
    console.log(`\n  ${nome}`);

    for (const [lado, rotulo] of [[0, "antes "], [1, "depois"]]) {
      const lamina = bloco.locator(".lado").nth(lado);
      const linha = [];
      for (const [sel, piso] of ALVOS) {
        const alvo = lamina.locator(`.slide ${sel}`);
        if ((await alvo.count()) === 0) continue;
        const { razao } = await alvo.first().evaluate(medirContraste);
        medidos += 1;
        const ok = razao >= piso;
        if (!ok) { if (lado === 1) reprovaDepois += 1; else reprovaAntes += 1; }
        const cor = ok ? "\x1b[32m" : "\x1b[31m";
        linha.push(`${sel.replace(".", "")} ${cor}${razao.toFixed(2)}\x1b[0m`);
      }
      const m = lado === 1 ? "\x1b[1m" : "\x1b[2m";
      console.log(`    ${m}${rotulo}\x1b[0m  ${linha.join("  ")}`);
    }
  }
}

await navegador.close();
console.log(`\n${medidos} medições · antes: \x1b[31m${reprovaAntes} reprovação(ões)\x1b[0m · depois: ${reprovaDepois === 0 ? "\x1b[32m0\x1b[0m" : `\x1b[31m${reprovaDepois}\x1b[0m`}`);
if (reprovaDepois > 0) {
  console.log("\x1b[31m✖ o DEPOIS tem reprovação — o mockup não pode ir assim\x1b[0m");
  process.exit(1);
}
console.log("\x1b[32m✓\x1b[0m nenhuma reprovação no depois\n");

/** Capturas do mockup da Fase 5, na largura real do monitor do Daniel. */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";
import { abrirNavegador } from "../../scripts/qa/lib/navegador.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const SAIDA = join(AQUI, "capturas");
mkdirSync(SAIDA, { recursive: true });

const navegador = await abrirNavegador();
const pagina = await navegador.newPage({ viewport: { width: 1900, height: 1080 } });
await pagina.goto(`file://${join(AQUI, "mockup-contador.html")}`);
await pagina.waitForFunction(() => document.fonts.ready.then(() => true));

for (const tema of ["claro", "escuro"]) {
  for (const estado of ["a", "b", "c", "d"]) {
    await pagina.evaluate(([e, t]) => {
      document.documentElement.dataset.estado = e;
      document.documentElement.dataset.tema = t;
      for (const d of document.querySelectorAll(".band .dir")) d.textContent = `tema · ${t}`;
    }, [estado, tema]);
    await pagina.waitForTimeout(150);
    const arq = join(SAIDA, `${estado}-${tema}.png`);
    await pagina.screenshot({ path: arq, fullPage: true });
    console.log(`  ${estado} · ${tema} → ${arq.replace(AQUI + "/", "")}`);
  }
}

// Recorte só do contador, que é a peça nova — lido de perto.
for (const tema of ["claro", "escuro"]) {
  await pagina.evaluate((t) => {
    document.documentElement.dataset.estado = "c";
    document.documentElement.dataset.tema = t;
  }, tema);
  await pagina.waitForTimeout(150);
  await pagina.locator("#c .peca").screenshot({ path: join(SAIDA, `contador-${tema}.png`) });
  console.log(`  recorte do cartão · ${tema}`);
}

await navegador.close();
console.log("\n10 capturas a 1900px.");

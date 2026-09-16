import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";
import { abrirNavegador } from "../../scripts/qa/lib/navegador.mjs";
const AQUI = dirname(fileURLToPath(import.meta.url));
const SAIDA = join(AQUI, "capturas"); mkdirSync(SAIDA, { recursive: true });
const nav = await abrirNavegador();
const p = await nav.newPage({ viewport: { width: 1900, height: 1200 } });
await p.goto(`file://${join(AQUI, "mockup-temas.html")}`);
await p.waitForFunction(() => document.fonts.ready.then(() => true));
for (const [e, nome] of [["r", "resibag"], ["s", "sanwey"]]) {
  await p.evaluate((x) => { document.documentElement.dataset.e = x; }, e);
  await p.waitForTimeout(200);
  await p.screenshot({ path: join(SAIDA, `${nome}.png`), fullPage: true });
  // recorte de um bloco, para ler de perto
  await p.locator(`#${e} .bloco`).first().screenshot({ path: join(SAIDA, `${nome}-detalhe.png`) });
  console.log("capturado:", nome);
}
await nav.close();

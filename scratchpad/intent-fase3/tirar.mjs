import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { abrirNavegador } from "../../scripts/qa/lib/navegador.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const OUT = join(AQUI, "depois");
mkdirSync(OUT, { recursive: true });

const ESTADOS = [
  ["a", "bancada — origem escolhida"],
  ["b", "bancada — artigo escrito"],
  ["c", "bancada — peças, uma falhou"],
  ["d", "editor — composer"],
  ["e", "editor — slides"],
];

const navegador = await abrirNavegador();
const pagina = await navegador.newPage({ viewport: { width: 1900, height: 1100 } });
await pagina.goto(`file://${join(AQUI, "mockup-trabalho.html")}`);
await pagina.waitForFunction(() => document.fonts.ready.then(() => true));
await pagina.waitForTimeout(500);

for (const tema of ["claro", "escuro"]) {
  for (const [e, rotulo] of ESTADOS) {
    await pagina.evaluate(([e, t]) => {
      document.documentElement.dataset.estado = e;
      document.documentElement.dataset.tema = t;
      document.querySelectorAll(".tm").forEach((n) => { n.textContent = t; });
    }, [e, tema]);
    await pagina.waitForTimeout(180);
    await pagina.screenshot({ path: join(OUT, `${e}-${tema}.png`) });
    if (tema === "claro") console.log(`${e}: ${rotulo}`);
  }
}

// A medida de leitura, medida — não estimada.
const m = await pagina.evaluate(() => {
  document.documentElement.dataset.estado = "b";
  const p = document.querySelector("#b .leitura p");
  const r = p.getBoundingClientRect();
  const cs = getComputedStyle(p);
  // largura média de caractere, medida no canvas com a fonte real
  const cv = document.createElement("canvas").getContext("2d");
  cv.font = `${cs.fontSize} ${cs.fontFamily}`;
  const amostra = "abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const larguraMedia = cv.measureText(amostra).width / amostra.length;
  return { largura: Math.round(r.width), fonte: cs.fontSize, cpl: Math.round(r.width / larguraMedia) };
});
console.log(`\nmedida de leitura: ${m.largura}px · corpo ${m.fonte} · ~${m.cpl} caracteres por linha`);

await navegador.close();
console.log(`capturas em ${OUT}`);

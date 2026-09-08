/**
 * O ANTES da Fase 3: bancada e editor na largura real do monitor do Daniel.
 *
 * Além da captura, MEDE a costura. A queixa da Fase 2 ("está muito largo") era
 * um número, não uma impressão — e aqui há um número equivalente: a casca está
 * travada em `medidaClass` (1280px) e a superfície de trabalho renderiza de
 * ponta a ponta. Se isso for verdade, o relatório imprime as duas larguras.
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { abrirNavegador, BASE, aquecer, novaPagina } from "../../scripts/qa/lib/navegador.mjs";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "antes");
mkdirSync(OUT, { recursive: true });

const TELAS = [
  ["bancada", "/esteira"],
  ["editor", "/editor"],
];

const navegador = await abrirNavegador();
await aquecer(TELAS.map(([, rota]) => rota));

for (const tema of ["claro", "escuro"]) {
  for (const [nome, rota] of TELAS) {
    const { pagina, problemas } = await novaPagina(navegador, { tema, largura: 1900, altura: 1100 });
    await pagina.goto(`${BASE}${rota}`, { waitUntil: "networkidle" });
    await pagina.waitForTimeout(400);

    if (tema === "claro") {
      // A medida da casca contra a medida do corpo, no mesmo documento.
      const larguras = await pagina.evaluate(() => {
        const larg = (el) => (el ? Math.round(el.getBoundingClientRect().width) : null);
        const grade = document.querySelector('[class*="grid-cols-"]');
        // O masthead é o primeiro filho com a medida da casca.
        const casca = [...document.querySelectorAll("div")].find((d) =>
          d.className?.includes?.("max-w-[1280px]"),
        );
        return { casca: larg(casca), corpo: larg(grade), janela: window.innerWidth };
      });
      console.log(
        `${nome}: casca ${larguras.casca}px · corpo ${larguras.corpo}px · janela ${larguras.janela}px` +
          (larguras.casca && larguras.corpo && larguras.casca !== larguras.corpo
            ? `  ← desalinhadas em ${Math.abs(larguras.corpo - larguras.casca)}px`
            : ""),
      );
    }

    if (problemas.length > 0) console.log(`  ! ${nome}/${tema}: ${problemas.join(" · ")}`);
    await pagina.screenshot({ path: join(OUT, `${nome}-${tema}.png`), fullPage: false });
    await pagina.close();
  }
}

await navegador.close();
console.log(`\ncapturas em ${OUT}`);

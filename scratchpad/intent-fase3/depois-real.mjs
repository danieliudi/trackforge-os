/**
 * O DEPOIS da Fase 3 — o app implementado, não o mockup.
 *
 * O `antes.mjs` ao lado capturou a bancada e o editor antes da fase e mediu a
 * costura: a casca travada em 1280px sobre um corpo de ponta a ponta, com a
 * borda esquerda da faixa preta caindo a 8px do divisor da primeira coluna.
 * Perto o bastante para parecer erro de alinhamento, longe o bastante para não
 * ser alinhamento.
 *
 * Este roteiro mede A MESMA COISA depois, para que a entrega da fase seja um
 * número e não uma impressão. Duas medidas por tela:
 *
 * 1. **A costura** — borda esquerda da faixa preta contra a borda esquerda do
 *    corpo de trabalho. Se a fase fez o que prometeu, a diferença é zero.
 * 2. **A medida de leitura** — largura da coluna de prosa e quantos caracteres
 *    cabem numa linha, medidos no canvas com a fonte real. O alvo declarado no
 *    `DESIGN-fase3-locked.md` é a faixa de 60 a 75.
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { abrirNavegador, BASE, aquecer, novaPagina } from "../../scripts/qa/lib/navegador.mjs";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "depois-real");
mkdirSync(OUT, { recursive: true });

const TELAS = [
  ["bancada", "/esteira"],
  ["editor", "/editor"],
];

const navegador = await abrirNavegador();
await aquecer(TELAS.map(([, rota]) => rota));

let reprovou = false;

for (const tema of ["claro", "escuro"]) {
  for (const [nome, rota] of TELAS) {
    const { pagina, problemas } = await novaPagina(navegador, { tema, largura: 1900, altura: 1100 });
    await pagina.goto(`${BASE}${rota}`, { waitUntil: "networkidle" });
    await pagina.waitForTimeout(400);

    if (tema === "claro") {
      const m = await pagina.evaluate(() => {
        /**
         * CAIXA DE CONTEÚDO, não a de fora. A folha inteira é `w-full px-10`:
         * toda ela nasce em 0 e morre em 1885, e comparar isso diria
         * "alinhadas" mesmo com paddings diferentes dos dois lados. O que o
         * olho vê é onde a TINTA começa — `left + paddingLeft`.
         */
        const caixa = (el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return {
            esq: Math.round(r.left + parseFloat(cs.paddingLeft)),
            dir: Math.round(r.right - parseFloat(cs.paddingRight)),
          };
        };
        // A faixa preta é o <nav> da casca; o que carrega a medida é o filho.
        const faixa = caixa(document.querySelector("nav > div"));
        // O corpo de trabalho: a grade de colunas da bancada, ou — no editor,
        // que abre no composer — a barra de ferramentas que carrega a medida.
        const main = document.querySelector("main");
        const corpo = caixa(
          main?.querySelector('[class*="grid-cols-"]') ?? main?.querySelector('[class*="px-10"]'),
        );

        // A coluna de prosa: o parágrafo mais largo dentro de `leituraClass`.
        const leitura = document.querySelector('[class*="max-w-[680px]"]');
        let prosa = null;
        if (leitura) {
          const cs = getComputedStyle(leitura);
          const cv = document.createElement("canvas").getContext("2d");
          cv.font = `${cs.fontSize} ${cs.fontFamily}`;
          const amostra = "abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ";
          const media = cv.measureText(amostra).width / amostra.length;
          const larg = leitura.getBoundingClientRect().width;
          prosa = { larg: Math.round(larg), fonte: cs.fontSize, cpl: Math.round(larg / media) };
        }
        return { faixa, corpo, prosa };
      });

      const { faixa, corpo, prosa } = m;
      const fora = faixa && corpo ? Math.abs(faixa.esq - corpo.esq) : null;
      console.log(`\n── ${nome} ──`);
      if (faixa) console.log(`  faixa preta:  tinta de ${faixa.esq}px a ${faixa.dir}px`);
      if (corpo) console.log(`  corpo:        tinta de ${corpo.esq}px a ${corpo.dir}px`);
      if (fora !== null) {
        const veredito = fora === 0 ? "alinhadas" : `DESALINHADAS em ${fora}px`;
        console.log(`  costura:      ${veredito}`);
        if (fora !== 0) reprovou = true;
      }
      if (prosa) {
        const dentro = prosa.cpl >= 60 && prosa.cpl <= 75;
        console.log(
          `  leitura:      ${prosa.larg}px · corpo ${prosa.fonte} · ~${prosa.cpl} caracteres por linha` +
            (dentro ? "  (dentro de 60–75)" : "  ← FORA da faixa 60–75"),
        );
        if (!dentro) reprovou = true;
      }
    }

    if (problemas.length > 0) {
      console.log(`  ! ${nome}/${tema}: ${problemas.join(" · ")}`);
      reprovou = true;
    }
    await pagina.screenshot({ path: join(OUT, `${nome}-${tema}.png`), fullPage: false });
    await pagina.close();
  }
}

await navegador.close();
console.log(`\ncapturas em ${OUT}`);
if (reprovou) {
  console.log("\nREPROVOU — a costura ou a medida de leitura saiu do alvo declarado.");
  process.exit(1);
}

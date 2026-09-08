/**
 * Contraste do mockup da Fase 3 — os dois temas, alvo DECLARADO.
 *
 * Mesmo medidor de scripts/qa/lib/navegador.mjs: resolve a cor pelo canvas
 * (o Tailwind emite oklab para alpha) e multiplica o opacity dos ancestrais.
 * Sem as duas coisas o número sai errado e parece certo.
 *
 * Alvo é declarado, nunca improvisado: seletor que deixa de casar é
 * REPROVAÇÃO, não silêncio — foi assim que uma reprovação de 1,17:1 se
 * escondeu atrás de um seletor que casava com o elemento errado.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { abrirNavegador, medirContraste } from "../../scripts/qa/lib/navegador.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const CORPO = 4.5;
const MIUDO = 3;

/** Alvos comuns à casca — aparecem nos cinco estados. */
const CASCA = [
  [".marca", CORPO], [".edicao span", MIUDO], [".edicao b", MIUDO],
  [".date span", MIUDO], [".date .mono", MIUDO],
  [".band .sig", MIUDO], [".band a", MIUDO], [".band a.on", MIUDO],
  [".band .dir", MIUDO],
];

const ESTADOS = {
  a: [...CASCA,
    [".rot", MIUDO], [".abas button", CORPO], [".abas button.on", CORPO],
    [".campo", CORPO], [".opt", CORPO], [".opt span span", CORPO],
    [".btn", CORPO], [".aguarda", CORPO], [".aguarda b", CORPO],
    [".espera .slug span", MIUDO], [".espera .slug em", MIUDO],
    [".espera .mat", CORPO], [".espera .diz", CORPO],
    [".custo .cab b", MIUDO], [".custo .cab em", CORPO],
    [".custo .li span", CORPO], [".custo .li .v", CORPO],
    [".custo .rod", CORPO], [".custo .rod b", CORPO],
    [".cel .t", CORPO], [".cel .p", MIUDO],
  ],
  b: [...CASCA,
    [".leitura h1", CORPO], [".leitura .sub", CORPO], [".leitura p", CORPO],
    [".leitura h2", MIUDO], [".leitura .fonte", CORPO], [".leitura .fonte b", MIUDO],
    [".cel.on .t", CORPO], [".cel.on .p", MIUDO],
    [".recibo .l span", CORPO], [".recibo .l b", CORPO], [".recibo .l.tot span", CORPO],
    [".aud", CORPO], [".aud b", MIUDO],
    [".btn.ghost", CORPO],
  ],
  c: [...CASCA,
    [".peca .idx", MIUDO], [".peca .t", CORPO], [".peca .m", CORPO],
    [".peca .est.ok", MIUDO], [".peca .est.mau", MIUDO],
    [".cel.falhou .t", CORPO], [".cel.falhou .p", MIUDO],
  ],
  d: [...CASCA,
    [".leitura h1", CORPO], [".leitura .sub", CORPO],
    [".custo .rod b", CORPO],
  ],
  e: [...CASCA,
    [".tabs button", CORPO], [".tabs button.on", CORPO],
    [".slide .n", MIUDO], [".slide .tt", CORPO], [".slide .bd", CORPO],
    [".mesa .aviso", MIUDO],
    [".canvas .kk", MIUDO], [".canvas .hh", CORPO], [".canvas .ff", CORPO],
  ],
};

const navegador = await abrirNavegador();
const pagina = await navegador.newPage({ viewport: { width: 1900, height: 1100 } });
await pagina.goto(`file://${join(AQUI, "mockup-trabalho.html")}`);
await pagina.waitForFunction(() => document.fonts.ready.then(() => true));

let medicoes = 0;
const falhas = [];
const vazios = [];

for (const tema of ["claro", "escuro"]) {
  for (const [estado, alvos] of Object.entries(ESTADOS)) {
    await pagina.evaluate(([e, t]) => {
      document.documentElement.dataset.estado = e;
      document.documentElement.dataset.tema = t;
    }, [estado, tema]);
    await pagina.waitForTimeout(120);

    for (const [sel, piso] of alvos) {
      const lidos = await pagina.evaluate(
        ([sel, estado, medirSrc]) => {
          const medir = new Function(`return (${medirSrc})`)();
          const els = [...document.querySelectorAll(`#${estado} ${sel}`)];
          return els.map((el) => medir(el));
        },
        [sel, estado, medirContraste.toString()],
      );

      if (lidos.length === 0) { vazios.push(`${tema}/${estado} ${sel}`); continue; }

      for (const r of lidos) {
        medicoes += 1;
        if (r.razao < piso) {
          falhas.push(
            `${tema}/${estado} ${sel} — ${r.razao.toFixed(2)}:1 (piso ${piso}) — “${(r.texto ?? "").slice(0, 46)}”`,
          );
        }
      }
    }
  }
}

console.log(`${medicoes} medições · 5 telas × 2 temas`);
if (vazios.length) {
  console.log(`\n${vazios.length} seletor(es) sem casar — cobertura que evaporou:`);
  for (const v of vazios) console.log(`  · ${v}`);
}
if (falhas.length) {
  console.log(`\n${falhas.length} abaixo do piso:`);
  for (const f of falhas) console.log(`  ✗ ${f}`);
} else if (!vazios.length) {
  console.log("todas acima do piso — corpo ≥ 4,5:1, rótulo e ornamento ≥ 3:1");
}
await navegador.close();
process.exit(falhas.length || vazios.length ? 1 : 0);

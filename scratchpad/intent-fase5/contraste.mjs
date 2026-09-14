/**
 * Contraste do mockup da Fase 5 — os dois temas, alvo DECLARADO.
 *
 * Mesmo medidor de scripts/qa/lib/navegador.mjs. Não existe um segundo: é assim
 * que o número sai errado e parece certo (seção 12).
 *
 * O alvo que mais precisa disto é o `.selo` "SEM LASTRO" — warn sobre warn-bg,
 * e o par troca de lado entre os temas. É também o elemento mais importante da
 * fase: ele é a diferença entre a ferramenta dizer "não sei" e fingir que sabe.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { abrirNavegador, medirContraste } from "../../scripts/qa/lib/navegador.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const CORPO = 4.5;
const MIUDO = 3;

/** A casca, presente nos quatro estados. */
const CASCA = [
  [".marca", CORPO], [".edicao span", MIUDO], [".edicao b", MIUDO],
  [".date span", MIUDO], [".date .mono", MIUDO],
  [".band .sig", MIUDO], [".band a", MIUDO], [".band .dir", MIUDO],
  [".rot", MIUDO],
];

/** O cartão de peça, que já existe hoje em OutputPieces.tsx. */
const CARTAO = [
  [".peca .cab .t", CORPO], [".peca .cab .m", MIUDO],
  [".corpo .gancho", CORPO], [".corpo p", CORPO],
  [".fantasma", CORPO], [".fantasma b", CORPO],
  [".bt", CORPO], [".ok", CORPO],
  [".nota", CORPO], [".nota b", CORPO],
];

/** O CONTADOR — os alvos novos. É por eles que este roteiro existe. */
const NUMERO = [[".conta .n", CORPO], [".conta .un", MIUDO]];
const FONTE = [
  [".fonte > span.mono", MIUDO],
  [".fonte > span:not(.mono)", CORPO],
];

const ESTADOS = {
  a: [...CASCA, ...CARTAO, ...NUMERO, ...FONTE,
    // O selo é o alvo mais frágil e o mais importante da fase.
    [".selo", MIUDO],
  ],
  b: [...CASCA, ...CARTAO, ...NUMERO, ...FONTE, [".conta .de", CORPO]],
  c: [...CASCA, ...CARTAO, ...NUMERO, ...FONTE, [".conta .de", CORPO],
    [".corte", CORPO], [".corte b", CORPO],
  ],
  d: [...CASCA, ...CARTAO, ...FONTE],
};

const navegador = await abrirNavegador();
const pagina = await navegador.newPage({ viewport: { width: 1900, height: 1100 } });
await pagina.goto(`file://${join(AQUI, "mockup-contador.html")}`);
await pagina.waitForFunction(() => document.fonts.ready.then(() => true));

let medidos = 0;
let reprovou = 0;

for (const tema of ["claro", "escuro"]) {
  for (const [estado, alvos] of Object.entries(ESTADOS)) {
    await pagina.evaluate(([e, t]) => {
      document.documentElement.dataset.estado = e;
      document.documentElement.dataset.tema = t;
    }, [estado, tema]);
    await pagina.waitForTimeout(120);

    console.log(`\n══ estado ${estado} · tema ${tema} ══`);

    for (const [seletor, piso] of alvos) {
      const local = pagina.locator(`#${estado} ${seletor}`);
      const quantos = await local.count();

      // Seletor que deixa de casar é REPROVAÇÃO, não silêncio (seção 12).
      if (quantos === 0) {
        console.log(`  \x1b[31mALVO\x1b[0m    ${seletor}: casou com 0 elementos`);
        reprovou += 1;
        continue;
      }

      for (let i = 0; i < quantos; i += 1) {
        const { razao, texto } = await local.nth(i).evaluate(medirContraste);
        medidos += 1;
        const ok = razao >= piso;
        if (!ok) reprovou += 1;
        const marca = ok ? "\x1b[32mpassa\x1b[0m" : "\x1b[31mREPROVA\x1b[0m";
        const onde = quantos > 1 ? ` [${i + 1}/${quantos}]` : "";
        console.log(
          `  ${marca}   ${seletor}${onde}: ${razao.toFixed(2)}:1 (piso ${piso}) — "${(texto ?? "").slice(0, 34)}"`,
        );
      }
    }
  }
}

await navegador.close();

if (reprovou === 0) {
  console.log(`\n\x1b[32m✓\x1b[0m ${medidos} medições em 4 estados, nos dois temas, todas acima do piso`);
  process.exit(0);
}
console.log(`\n\x1b[31m✖ ${reprovou} reprovação(ões)\x1b[0m em ${medidos} medições`);
process.exit(1);

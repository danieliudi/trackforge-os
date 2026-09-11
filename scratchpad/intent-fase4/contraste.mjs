/**
 * Contraste do mockup da Fase 4 — os dois temas, alvo DECLARADO.
 *
 * Mesmo medidor de scripts/qa/lib/navegador.mjs: resolve a cor pelo canvas e
 * multiplica o opacity dos ancestrais. Sem as duas coisas o número sai errado e
 * parece certo.
 *
 * Alvo é declarado, nunca improvisado: seletor que deixa de casar é REPROVAÇÃO,
 * não silêncio. E os alvos novos desta fase são os que mais precisam disso — a
 * etiqueta de voz vive DENTRO da célula invertida, onde o fundo troca de lado
 * entre os temas e uma cor que passa num reprova no outro.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { abrirNavegador, medirContraste } from "../../scripts/qa/lib/navegador.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const CORPO = 4.5;
const MIUDO = 3;

/** A casca, presente nos cinco estados. */
const CASCA = [
  [".marca", CORPO], [".edicao span", MIUDO], [".edicao b", MIUDO],
  [".date span", MIUDO], [".date .mono", MIUDO],
  [".band .sig", MIUDO], [".band a", MIUDO],
  [".rot", MIUDO], [".btn", CORPO],
];

/** Os controles NOVOS da fase. É por eles que este roteiro existe. */
const TRABALHO = [
  [".trab .cl .t", CORPO], [".trab .cl .p", MIUDO],
  [".trab .cl.on .t", CORPO], [".trab .cl.on .p", MIUDO],
];
const VOZ = [
  [".vozes .vz .t", CORPO], [".vozes .vz .p", MIUDO],
  [".vozes .vz.on .t", CORPO], [".vozes .vz.on .p", MIUDO],
  [".regra", CORPO], [".regra b", CORPO],
];
const FORMATO = [
  [".cel .t", CORPO], [".cel .p", MIUDO],
  [".cel.on .t", CORPO], [".cel.on .p", MIUDO],
  // A etiqueta de voz dentro da célula invertida — o alvo mais frágil da fase.
  [".cel.on .vq", MIUDO],
];
const PRECO = [
  [".preco .l span", CORPO], [".preco .l b", CORPO], [".preco .l.tot span", CORPO],
];

const ESTADOS = {
  a: [...CASCA, ...TRABALHO, ...VOZ, ...FORMATO, ...PRECO,
    [".abas button", CORPO], [".abas button.on", CORPO],
    [".campo.preenchido", CORPO], [".sinal .t", CORPO], [".sinal .m", MIUDO],
    [".aviso", CORPO], [".aviso b", CORPO],
    [".leitura h2", CORPO], [".leitura h3", MIUDO], [".leitura p", CORPO],
  ],
  b: [...CASCA, ...TRABALHO, ...VOZ, ...FORMATO,
    [".cel.on .vq.mudou", MIUDO],
    [".troca b", MIUDO], [".troca button", CORPO], [".troca button i", MIUDO],
    [".troca button.on", CORPO], [".troca button.on i", MIUDO],
    [".leitura h2", CORPO], [".leitura p", CORPO],
  ],
  c: [...CASCA, ...TRABALHO, ...VOZ, ...FORMATO,
    [".aviso", CORPO], [".aviso b", CORPO],
    [".campo.preenchido", CORPO], [".campo", CORPO],
    [".leitura h2", CORPO], [".leitura h3", MIUDO], [".leitura p", CORPO],
  ],
  d: [...CASCA, ...VOZ, ...FORMATO,
    [".arco .et .q", CORPO], [".arco .et .l", MIUDO],
    [".arco .et.on .q", CORPO], [".arco .et.on .l", MIUDO],
    [".aviso", CORPO], [".aviso b", CORPO],
    [".campo.preenchido", CORPO],
    [".leitura h2", CORPO], [".leitura h3", MIUDO], [".leitura p", CORPO],
  ],
  e: [...CASCA, ...TRABALHO, ...VOZ, ...FORMATO, ...PRECO,
    [".avulso h2", CORPO], [".avulso .sub", CORPO], [".avulso .ta", CORPO],
  ],
};

const navegador = await abrirNavegador();
const pagina = await navegador.newPage({ viewport: { width: 1900, height: 1100 } });
await pagina.goto(`file://${join(AQUI, "mockup-vozes.html")}`);
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
      // `medirContraste` roda DENTRO da página — é passada ao evaluate, não
      // chamada aqui. Ela não pode fechar sobre nada deste módulo.
      const local = pagina.locator(`#${estado} ${seletor}`);
      const quantos = await local.count();

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
        console.log(`  ${marca}   ${seletor}${onde}: ${razao.toFixed(2)}:1 (piso ${piso}) — "${(texto ?? "").slice(0, 32)}"`);
      }
    }
  }
}

await navegador.close();

if (reprovou === 0) {
  console.log(`\n\x1b[32m✓\x1b[0m ${medidos} medições em 5 estados, nos dois temas, todas acima do piso`);
  process.exit(0);
}
console.log(`\n\x1b[31m✖ ${reprovou} reprovação(ões)\x1b[0m em ${medidos} medições`);
process.exit(1);

#!/usr/bin/env node
/**
 * Nenhum tema de marca usa cor que o manual aposentou.
 *
 * POR QUE ESTE GATE EXISTE. Em 16/09/2026 os quatro temas Resibag da ferramenta
 * estavam na paleta **v9** — duas gerações antes do v10.x, que já tinha sido
 * substituído inteiro. Sete dos nove hexes apareciam na v11 numa linha rotulada
 * "Versões v9 — já eliminadas antes desta versão", e o `resibag-selo` usava
 * `#B8973A`, o Certification Gold, como acento: a ferramenta gerava selo de
 * certificação exatamente na cor que o manual tinha matado por ser a cor de
 * certificação.
 *
 * Ninguém tinha errado nada. A paleta foi escrita quando estava certa, o manual
 * andou cinco versões, e nada olhava para os dois ao mesmo tempo. É o Padrão de
 * Falha 1 que a própria `resibag-brand-guidelines` descreve no topo — a skill
 * ficou 4 gerações à frente da conta "por meses sem ninguém notar".
 *
 * POR QUE A LISTA É CURADA NO REPO e não lida da skill instalada: gate que só
 * roda na máquina onde a skill está sincronizada não é gate — mesma lição do
 * medidor de contraste, que apontava para `/opt/pw-browsers` e só funcionava num
 * sandbox. Quem avisa que a fonte mudou é o `check-knowledge`.
 *
 * O QUE ELE NÃO OLHA: `src/app/globals.css`. Aquela é a paleta da FERRAMENTA
 * (o híbrido), não da marca. Peça que sai para o cliente usa `themes.ts`;
 * a tela onde o Daniel trabalha usa o globals. São coisas diferentes.
 */

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ALVO = join("src", "constants", "themes.ts");

const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const vermelho = (s) => `\x1b[31m${s}\x1b[0m`;
const amarelo = (s) => `\x1b[33m${s}\x1b[0m`;
const verde = (s) => `\x1b[32m${s}\x1b[0m`;

/**
 * DÍVIDA DECLARADA — o que o gate deixa passar, com motivo e data.
 *
 * Mesmo padrão do `AUSENTES_DE_PROPOSITO` do check-docs: exceção que alguém
 * escreveu, com o porquê, some quando o motivo some. Sem isto o gate reprovaria
 * no primeiro dia por dívida já conhecida e reportada — e gate que nasce
 * vermelho é gate que alguém desliga na sexta-feira.
 *
 * COMO SE APAGA: quando os temas forem redesenhados contra a paleta v11
 * (precisa de mockup aprovado, seção 4), apague a linha correspondente. O gate
 * aperta sozinho.
 */
const DIVIDA_DECLARADA = [
  {
    tema: "resibag",
    porque: "paleta v9 — aguarda mockup dos quatro temas contra a v11",
    desde: "2026-09-16",
  },
  {
    tema: "resibag-escuro",
    porque: "paleta v9 — aguarda mockup dos quatro temas contra a v11",
    desde: "2026-09-16",
  },
  {
    tema: "resibag-ativo",
    porque: "paleta v9 — aguarda mockup dos quatro temas contra a v11",
    desde: "2026-09-16",
  },
  {
    tema: "resibag-selo",
    porque:
      "paleta v9, e o acento é o Certification Gold que a v11 aposentou — aguarda mockup",
    desde: "2026-09-16",
  },
];

const paleta = JSON.parse(readFileSync(join(RAIZ, "src/knowledge/paleta-resibag.json"), "utf8"));
const fonte = readFileSync(join(RAIZ, ALVO), "utf8");

const MORTAS = new Map(paleta.mortas.map((c) => [c.hex.toUpperCase(), c]));
const AUTORIZADAS = new Set(paleta.autorizadas.map((c) => c.hex.toUpperCase()));

/**
 * Fatia `themes.ts` por tema.
 *
 * Um hex sem o tema ao lado é um achado que ninguém consegue agir: `#B8973A`
 * sozinho não diz onde mexer. O gate só é útil se aponta o lugar.
 */
function fatiarTemas(texto) {
  const temas = [];
  const re = /\n {2}"?([a-z0-9-]+)"?:\s*\{/g;
  let m;
  const marcas = [];
  while ((m = re.exec(texto)) !== null) marcas.push({ id: m[1], inicio: m.index });
  for (let i = 0; i < marcas.length; i += 1) {
    const fim = i + 1 < marcas.length ? marcas[i + 1].inicio : texto.length;
    temas.push({ id: marcas[i].id, corpo: texto.slice(marcas[i].inicio, fim) });
  }
  return temas;
}

const temas = fatiarTemas(fonte);
if (temas.length === 0) {
  console.error(vermelho("✖") + ` não consegui fatiar ${ALVO} em temas.`);
  console.error("  O formato do arquivo mudou e o gate passou a medir nada — conserte o fatiador.");
  process.exit(1);
}

const achados = [];
const foraDaPaleta = [];

for (const { id, corpo } of temas) {
  // Só tema de MARCA. Os genéricos (dark-modern, editorial…) não respondem a
  // manual nenhum, e reprovar cor deles seria inventar regra que não existe.
  const marca = id.startsWith("resibag") ? "resibag" : id.startsWith("sanwey") ? "sanwey" : null;
  if (marca !== "resibag") continue;

  for (const hex of new Set(corpo.match(/#[0-9A-Fa-f]{6}/g) ?? [])) {
    const H = hex.toUpperCase();
    if (MORTAS.has(H)) achados.push({ tema: id, hex: H, ...MORTAS.get(H) });
    else if (!AUTORIZADAS.has(H)) foraDaPaleta.push({ tema: id, hex: H });
  }
}

const declarados = new Set(DIVIDA_DECLARADA.map((d) => d.tema));
const novos = achados.filter((a) => !declarados.has(a.tema));
const conhecidos = achados.filter((a) => declarados.has(a.tema));

console.log(bold("\nCor morta em tema de marca") + dim(`  — ${ALVO} × ${paleta.fonte.skill} ${paleta.fonte.versao}`));

if (conhecidos.length > 0) {
  console.log(amarelo(`\n  ${conhecidos.length} ocorrência(s) em dívida DECLARADA:`));
  for (const d of DIVIDA_DECLARADA) {
    const desse = conhecidos.filter((c) => c.tema === d.tema);
    if (desse.length === 0) {
      console.log(
        vermelho(`  ✖ o tema "${d.tema}" está declarado como dívida e não tem mais cor morta.`),
      );
      console.log(`    Apague a linha em DIVIDA_DECLARADA — exceção que sobrevive ao motivo vira mentira.`);
      process.exitCode = 1;
      continue;
    }
    console.log(`\n    ${bold(d.tema)}  ${dim(`(${d.porque}, desde ${d.desde})`)}`);
    for (const c of desse) console.log(`      ${c.hex}  ${dim(c.nome)} → usar ${c.usar}`);
  }
}

if (foraDaPaleta.length > 0) {
  console.log(dim(`\n  ${foraDaPaleta.length} cor(es) fora da paleta — nem morta, nem autorizada:`));
  for (const f of foraDaPaleta) console.log(dim(`      ${f.tema}: ${f.hex}`));
}

if (novos.length > 0) {
  console.log(vermelho(`\n  ✖ ${novos.length} cor MORTA em tema não declarado:`));
  for (const a of novos) {
    console.log(`      ${bold(a.tema)}: ${a.hex} ${dim(`(${a.nome})`)} → usar ${a.usar}`);
  }
  console.log(
    `\n  Troque pela cor indicada, ou declare a dívida em DIVIDA_DECLARADA com o motivo.\n`,
  );
  process.exit(1);
}

if (process.exitCode === 1) {
  console.log("");
  process.exit(1);
}

const total = temas.filter((t) => t.id.startsWith("resibag")).length;
console.log(
  `\n${verde("✓")} nenhuma cor morta nova em ${total} tema(s) Resibag ` +
    dim(`(${conhecidos.length} em dívida declarada, ${paleta.mortas.length} cores na lista)`) +
    "\n",
);

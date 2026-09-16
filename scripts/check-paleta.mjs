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
 * DESDE 16/09/2026 OLHA AS DUAS MARCAS. A Sanwey entrou junto com a Fase 6, e
 * trouxe uma regra que a Resibag não tem: a rampa neutra dela é PURO K, e cinza
 * composto reprova por si — `#8A8680` e `#E5E0DA` estavam em três temas.
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
  // Vazio desde 16/09/2026, quando os quatro temas Resibag foram redesenhados
  // contra a v11 (Fase 6). Estava com quatro linhas, todas "paleta v9 — aguarda
  // mockup". Declaração aqui é exceção COM data de morte: some junto com o
  // motivo, e o gate acusa se ficar para trás.
];

const PALETAS = {
  resibag: JSON.parse(readFileSync(join(RAIZ, "src/knowledge/paleta-resibag.json"), "utf8")),
  sanwey: JSON.parse(readFileSync(join(RAIZ, "src/knowledge/paleta-sanwey.json"), "utf8")),
};
const fonte = readFileSync(join(RAIZ, ALVO), "utf8");

const curada = (marca) => ({
  mortas: new Map(PALETAS[marca].mortas.map((c) => [c.hex.toUpperCase(), c])),
  autorizadas: new Set(PALETAS[marca].autorizadas.map((c) => c.hex.toUpperCase())),
  regraPuroK: PALETAS[marca].regraPuroK?.vale === true,
});

/**
 * Cinza composto — R, G e B diferentes entre si.
 *
 * O manual da Sanwey proíbe explicitamente: "Nunca introduzir cinza azulado
 * (slate). A rampa é puro K e reproduz idêntico em qualquer gráfica." Cinza
 * composto muda entre telas e entre gráficas, e três temas da ferramenta usavam
 * `#8A8680` e `#E5E0DA` até 16/09/2026. A regra é mecânica, então o gate a faz
 * valer; o manual da Resibag não tem equivalente, e por isso o campo é opcional.
 */
function cinzaComposto(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  if (r === g && g === b) return false;
  // Só acusa o que é PERCEBIDO como cinza: canais próximos entre si. Vermelho e
  // ouro têm R≠G≠B de propósito e não são cinza nenhum.
  return Math.max(r, g, b) - Math.min(r, g, b) <= 40;
}

/**
 * Fatia `themes.ts` por tema.
 *
 * Um hex sem o tema ao lado é um achado que ninguém consegue agir: `#B8973A`
 * sozinho não diz onde mexer. O gate só é útil se aponta o lugar.
 */
/**
 * Comentário fora antes de varrer — e isto é a mesma decisão do `notes` na
 * checagem de coerência da base (CLAUDE.md seção 9).
 *
 * O gate existe para achar cor morta que o navegador PINTA. Hex dentro de
 * comentário não pinta nada: é o registro de por que aquela cor saiu, que é
 * justamente o que se quer escrito ao lado do conserto. Sem isto, documentar
 * "o acento era #8B1419 e dava 1,66:1" reprova o gate — e um gate que apita
 * por prosa é um gate que alguém desliga.
 *
 * Varre o que CHEGA à tela, não o arquivo inteiro. Conferido plantando nos dois
 * lugares: no valor de um token reprova, na explicação ao lado passa.
 */
const semComentario = (texto) =>
  texto.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

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
  if (!marca) continue;
  const { mortas, autorizadas, regraPuroK } = curada(marca);

  for (const hex of new Set(semComentario(corpo).match(/#[0-9A-Fa-f]{6}/g) ?? [])) {
    const H = hex.toUpperCase();
    if (mortas.has(H)) achados.push({ tema: id, hex: H, marca, ...mortas.get(H) });
    else if (regraPuroK && cinzaComposto(H) && !autorizadas.has(H)) {
      achados.push({
        tema: id, hex: H, marca, nome: "cinza composto",
        usar: "um token da rampa neutra — o manual da Sanwey exige puro K (R=G=B)",
      });
    } else if (!autorizadas.has(H)) foraDaPaleta.push({ tema: id, hex: H });
  }
}

const declarados = new Set(DIVIDA_DECLARADA.map((d) => d.tema));
const novos = achados.filter((a) => !declarados.has(a.tema));
const conhecidos = achados.filter((a) => declarados.has(a.tema));

console.log(
  bold("\nCor morta em tema de marca") +
    dim(
      `  — ${ALVO} × ${PALETAS.resibag.fonte.skill} ${PALETAS.resibag.fonte.versao}` +
        ` · ${PALETAS.sanwey.fonte.skill} ${PALETAS.sanwey.fonte.versao}`,
    ),
);

if (conhecidos.length > 0) {
  console.log(amarelo(`\n  ${conhecidos.length} ocorrência(s) em dívida DECLARADA:`));
}

// FORA do `if` acima, de propósito, e isto foi um defeito real: enquanto a
// checagem morava lá dentro, uma dívida declarada que deixou de existir só era
// acusada se AINDA HOUVESSE outra dívida viva. Consertando todos os temas de
// uma vez — que é o caso normal —, as declarações mortas passariam batido, e a
// exceção sobreviveria ao motivo em silêncio. Achado em 16/09/2026 ao aplicar a
// Fase 6, quando os quatro temas foram corrigidos juntos.
{
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

const total = temas.filter((t) => t.id.startsWith("resibag") || t.id.startsWith("sanwey")).length;
console.log(
  `\n${verde("✓")} nenhuma cor morta nova em ${total} tema(s) de marca ` +
    dim(
      `(${conhecidos.length} em dívida declarada, ` +
        `${PALETAS.resibag.mortas.length + PALETAS.sanwey.mortas.length} cores nas duas listas)`,
    ) +
    "\n",
);

#!/usr/bin/env node
/**
 * Confere se os documentos de regra descrevem o repositório que existe.
 *
 * POR QUE EXISTE: em 03/09/2026, três documentos diferentes apontaram para
 * arquivos que não estão no repo — `scratchpad/contraste.mjs` (o medidor que a
 * regra manda rodar antes de fechar mudança visual), o componente `Steps` como
 * exemplo de extração, e a abreviação `lib/crm.ts` em três lugares. Cada um foi
 * escrito por um agente diferente, e todos passaram porque a conferência era
 * manual. Regra que manda abrir arquivo inexistente é pior que regra nenhuma:
 * quem segue ao pé da letra não acha, conclui que a regra está velha, e pula.
 *
 * FICA FORA DO `prebuild` DE PROPÓSITO (seção 0 do CLAUDE.md): documento
 * defasado não deve travar deploy. Roda por `npm run doc:check`.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const RAIZ = process.cwd();
const REGRAS = ".cursor/rules";
const problemas = [];
const erro = (arquivo, o_que, conserto) => problemas.push({ arquivo, o_que, conserto });

/* ── utilidades ─────────────────────────────────────────────────────────── */

function acha(dir, filtro, achados = []) {
  if (!existsSync(dir)) return achados;
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) acha(caminho, filtro, achados);
    else if (filtro(nome)) achados.push(relative(RAIZ, caminho));
  }
  return achados;
}

const mdcs = existsSync(REGRAS)
  ? readdirSync(REGRAS).filter((n) => n.endsWith(".mdc")).sort()
  : [];
const documentos = ["CLAUDE.md", ...mdcs.map((n) => join(REGRAS, n))];
const texto = (f) => readFileSync(join(RAIZ, f), "utf8");

/* ── 1. todo caminho citado existe ──────────────────────────────────────── */

/**
 * Caminhos que os documentos declaram, no próprio texto, como ainda
 * inexistentes. A lista é curta de propósito: cada entrada é dívida registrada.
 *
 * Se um deles passar a existir, o check FALHA pedindo para tirá-lo daqui — a
 * lista não pode virar o próximo lugar onde a verdade envelhece em silêncio.
 */
const AINDA_NAO_EXISTEM = ["docs/mapa-funcional.md", "scripts/qa/"];

const CITACAO = /`([A-Za-z0-9_@./-]+\/[A-Za-z0-9_@./-]+\.(?:ts|tsx|mjs|css|json|md|mdc))`/g;

for (const doc of documentos) {
  const vistos = new Set();
  for (const [, caminho] of texto(doc).matchAll(CITACAO)) {
    if (vistos.has(caminho)) continue;
    vistos.add(caminho);
    if (AINDA_NAO_EXISTEM.includes(caminho)) continue;
    // `node_modules/...` é citado como orientação de leitura, não como arquivo
    // versionado; pode não estar instalado na máquina que roda o check.
    if (caminho.startsWith("node_modules/")) continue;
    if (!existsSync(join(RAIZ, caminho))) {
      erro(doc, `cita \`${caminho}\`, que não existe`, "corrija o caminho ou crie o arquivo");
    }
  }
}

for (const caminho of AINDA_NAO_EXISTEM) {
  if (existsSync(join(RAIZ, caminho))) {
    erro(
      "scripts/check-docs.mjs",
      `\`${caminho}\` passou a existir`,
      "tire de AINDA_NAO_EXISTEM e ajuste o texto que o declara ausente",
    );
  }
}

/* ── 2. o mapa CLAUDE.md ↔ .cursor/rules bate nos dois sentidos ─────────── */

if (mdcs.length > 0) {
  const claude = texto("CLAUDE.md");
  const citadas = new Set([...claude.matchAll(/`(\d\d-[a-z-]+)`/g)].map((m) => m[1]));
  const noDisco = new Set(mdcs.map((n) => n.replace(/\.mdc$/, "")));

  for (const regra of citadas) {
    if (!noDisco.has(regra)) {
      erro("CLAUDE.md", `o mapa cita a regra \`${regra}\`, que não existe`, "crie o .mdc ou tire do mapa");
    }
  }
  for (const regra of noDisco) {
    if (!citadas.has(regra)) {
      erro(
        join(REGRAS, `${regra}.mdc`),
        "existe mas não aparece no mapa do CLAUDE.md",
        "cite no bloco de espelho, ou declare por que não tem contraparte",
      );
    }
  }
}

/* ── 3. frontmatter e globs de cada regra ───────────────────────────────── */

for (const nome of mdcs) {
  const doc = join(REGRAS, nome);
  const cabecalho = /^---\n([\s\S]*?)\n---\n/.exec(texto(doc));
  if (!cabecalho) {
    erro(doc, "sem frontmatter", "abra o arquivo com um bloco --- ... --- (senão o Cursor ignora)");
    continue;
  }
  const globs = /^globs:\s*(.+)$/m.exec(cabecalho[1]);
  if (!globs) continue;
  for (const padrao of globs[1].split(",").map((s) => s.trim()).filter(Boolean)) {
    // glob simples: só precisamos saber se ALGUM arquivo casa
    const partes = padrao.split("/");
    const base = partes.slice(0, partes.findIndex((p) => p.includes("*"))).join("/") || ".";
    const ext = padrao.slice(padrao.lastIndexOf("."));
    const casa = padrao.includes("*")
      ? acha(join(RAIZ, base), (n) => n.endsWith(ext)).length > 0
      : existsSync(join(RAIZ, padrao));
    if (!casa) {
      erro(doc, `o glob \`${padrao}\` não casa com arquivo nenhum`, "regra com glob morto nunca dispara");
    }
  }
}

/* ── 4. contagens que o CLAUDE.md afirma ────────────────────────────────── */

const paginas = acha(join(RAIZ, "src/app"), (n) => n === "page.tsx").length;
const rotas = acha(join(RAIZ, "src/app/api"), (n) => n === "route.ts").length;
const claude = texto("CLAUDE.md");

for (const [rotulo, real, padrao] of [
  ["páginas", paginas, /(\d+)\s+páginas/g],
  ["rotas de API", rotas, /(\d+)\s+rotas de API/g],
]) {
  for (const [trecho, afirmado] of claude.matchAll(padrao)) {
    if (Number(afirmado) !== real) {
      erro("CLAUDE.md", `diz "${trecho.trim()}", mas são ${real}`, `atualize para ${real} ${rotulo}`);
    }
  }
}

/* ── relatório ──────────────────────────────────────────────────────────── */

const conferidos = `${documentos.length} documento(s), ${paginas} páginas, ${rotas} rotas`;

if (problemas.length === 0) {
  console.log(`\x1b[32m✓\x1b[0m documentos de regra batem com o código  \x1b[2m(${conferidos})\x1b[0m`);
  process.exit(0);
}

console.error(`\n\x1b[31m✖ ${problemas.length} divergência(s)\x1b[0m entre documento e código:\n`);
for (const { arquivo, o_que, conserto } of problemas) {
  console.error(`  \x1b[1m${arquivo}\x1b[0m`);
  console.error(`    ${o_que}`);
  console.error(`    \x1b[2m→ ${conserto}\x1b[0m\n`);
}
console.error(`\x1b[2mconferido: ${conferidos}\x1b[0m`);
process.exit(1);

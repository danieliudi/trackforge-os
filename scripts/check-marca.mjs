#!/usr/bin/env node
/**
 * A base autorizada nao pode conter o que ela mesma proibe.
 *
 * `buildKnowledgeBlock` monta o prompt em duas partes: o bloco `facts`, que se
 * apresenta ao modelo como "a unica fonte de fatos autorizada", e o bloco
 * PROIBICOES, montado da lista `forbidden`. As duas tem papeis opostos, e a
 * linha entre elas e facil de borrar — porque escrever "nunca diga X" no meio
 * dos fatos parece cuidado, e e o contrario: poe X dentro da fonte que o modelo
 * foi mandado tratar como autorizada.
 *
 * EXISTE POR UM CASO REAL, 10/09/2026. Ao trazer a curadoria da Resibag da v2.3
 * para a v2.9 — a correcao que reduziu a contagem de homologacoes de "dupla"
 * para UMA — a primeira versao desta sessao escreveu as proibicoes dentro do
 * bloco de fatos. O texto ficou correto para um leitor humano e errado para o
 * uso: os dois termos proibidos passaram a existir na fonte autorizada, em
 * forma negada. Este roteiro pegou os dois.
 *
 * Nao substitui `check-knowledge.mjs`, que compara a curadoria com a skill de
 * origem. Este olha so para dentro: a base e coerente com ela mesma?
 *
 * Uso: npm run knowledge:coerencia
 */
import { register } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// O bundler do Next resolve import sem extensao e importa JSON sem atributo; o
// Node cru nao faz nenhuma das duas. Mesma necessidade de
// `scratchpad/ts-resolve.mjs`, mais o atributo de JSON, que a cadeia de
// `knowledge/index.ts` exige.
register(pathToFileURL(join(ROOT, "scripts", "lib", "resolve-ts.mjs")));

const bold = (s) => `[1m${s}[0m`;
const dim = (s) => `[2m${s}[0m`;
const red = (s) => `[31m${s}[0m`;
const green = (s) => `[32m${s}[0m`;

const { getBrandKnowledge } = await import(
  pathToFileURL(join(ROOT, "src/knowledge/index.ts")).href
);
const { brands } = await import(
  pathToFileURL(join(ROOT, "src/constants/brands.ts")).href
);
const { findForbidden } = await import(
  pathToFileURL(join(ROOT, "src/knowledge/check.ts")).href
);

let violacoes = 0;
let marcas = 0;

for (const brandId of Object.keys(brands)) {
  const knowledge = getBrandKnowledge(brandId);
  if (!knowledge) continue;
  marcas += 1;

  const hits = findForbidden([{ blockNumber: 0, text: knowledge.facts }], brandId);
  if (hits.length === 0) continue;

  violacoes += hits.length;
  console.log(
    `\n  ${bold(brandId)}  ${red(`${hits.length} termo(s) proibido(s) dentro do bloco de fatos`)}`,
  );
  for (const hit of hits) {
    console.log(`    - "${hit.matched}"  ${dim(`regra: ${hit.term}`)}`);
  }
}

if (violacoes === 0) {
  console.log(
    `${green("ok")} base de marca coerente com as proprias proibicoes  ${dim(`(${marcas} frente(s))`)}`,
  );
  process.exit(0);
}

console.log(`\n  A proibicao mora em ${bold("forbidden")}, que vira a secao PROIBICOES do prompt.`);
console.log(`  O bloco ${bold("facts")} e a fonte autorizada e se escreve no positivo.\n`);
process.exit(1);

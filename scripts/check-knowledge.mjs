#!/usr/bin/env node
/**
 * Avisa quando uma skill de origem mudou desde a curadoria de src/knowledge/.
 *
 * Por que detector e não sincronizador: o que entrou nos arquivos curados foi
 * escolha editorial — fato verificável entra, design system e faixa de preço de
 * concorrente não. Um script que reescrevesse sozinho ou colaria a skill inteira
 * (inflando o prompt com changelog e protocolo de versionamento) ou tentaria
 * adivinhar a curadoria por título de seção, quebrando na primeira renomeação.
 * O risco real nunca foi "copiar errado", foi "não saber que a fonte mudou".
 *
 * Roda no `predev`, então nunca sai com código de erro: quebrar o `npm run dev`
 * por causa de um aviso seria pior que o aviso.
 *
 * Uso:
 *   node scripts/check-knowledge.mjs           confere e reporta
 *   node scripts/check-knowledge.mjs --sync    grava os hashes atuais
 */

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES = join(ROOT, "src", "knowledge", "sources.json");
const SKILLS_ROOT = join(homedir(), ".claude", "skills");

/** Profundidade suficiente para `skills/synced/<uuid>/<skill>/SKILL.md`. */
const MAX_DEPTH = 6;

const bold = (s) => `[1m${s}[0m`;
const dim = (s) => `[2m${s}[0m`;
const red = (s) => `[31m${s}[0m`;
const yellow = (s) => `[33m${s}[0m`;
const green = (s) => `[32m${s}[0m`;

/** Procura `<nome>/SKILL.md` em qualquer lugar sob a pasta de skills. */
function findSkill(name, dir = SKILLS_ROOT, depth = 0) {
  if (depth > MAX_DEPTH || !existsSync(dir)) return null;

  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return null; // pasta sem permissão de leitura não é motivo pra falhar
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const path = join(dir, entry.name);

    if (entry.name === name) {
      const skillFile = join(path, "SKILL.md");
      if (existsSync(skillFile) && statSync(skillFile).isFile()) return skillFile;
    }

    const found = findSkill(name, path, depth + 1);
    if (found) return found;
  }

  return null;
}

const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

/** A versão declarada no cabeçalho, para o aviso citar de/para. */
function readVersion(path) {
  const header = readFileSync(path, "utf8").slice(0, 2000);
  return header.match(/^#\s.*?(v\d+\.\d+)/m)?.[1] ?? "?";
}

function main() {
  const sync = process.argv.includes("--sync");
  const config = JSON.parse(readFileSync(SOURCES, "utf8"));

  const missing = [];
  const changed = [];

  for (const source of config.sources) {
    const path = findSkill(source.skill);
    if (!path) {
      missing.push(source);
      continue;
    }

    const hash = sha256(path);
    if (hash === source.sha256) continue;

    changed.push({ ...source, path, hash, current: readVersion(path) });
    if (sync) {
      source.sha256 = hash;
      source.version = readVersion(path);
    }
  }

  if (sync) {
    writeFileSync(SOURCES, `${JSON.stringify(config, null, 2)}\n`);
    console.log(
      changed.length
        ? green(`✓ sources.json atualizado (${changed.length} fonte(s)).`)
        : green("✓ sources.json já estava em dia."),
    );
    return;
  }

  // Skills ausentes é o caso normal fora da máquina do autor (CI, deploy,
  // outro dev). Não é problema — só significa que não dá pra conferir aqui.
  if (missing.length === config.sources.length) {
    console.log(dim("· base de conhecimento: skills de origem não encontradas, checagem pulada"));
    return;
  }

  for (const source of missing) {
    console.log(yellow(`· skill "${source.skill}" não encontrada em ${SKILLS_ROOT} — não dá pra conferir`));
  }

  if (!changed.length) {
    console.log(dim("· base de conhecimento em dia com as skills de origem"));
    return;
  }

  console.log("");
  console.log(red(bold("  A base de conhecimento do gerador está desatualizada.")));
  console.log("");
  for (const source of changed) {
    const version =
      source.current === source.version
        ? `${source.version} (conteúdo mudou sem bump de versão)`
        : `${source.version} → ${source.current}`;
    console.log(`  ${bold(source.skill)}  ${version}`);
    console.log(dim(`    curada em ${source.curatedInto}`));
    console.log(dim(`    fonte:     ${source.path}`));
  }
  console.log("");
  console.log("  Revise o arquivo curado à mão e depois rode:");
  console.log(bold("    npm run knowledge:sync"));
  console.log("");
  console.log(dim("  O gerador continua rodando com a versão antiga até você atualizar."));
  console.log("");
}

main();

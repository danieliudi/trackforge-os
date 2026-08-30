#!/usr/bin/env node
/**
 * Lista o que na base ainda não foi conferido contra a fonte original.
 *
 * O detector de drift (check-knowledge.mjs) pega uma fonte que mudou. Este pega
 * um problema diferente e mais perigoso: uma fonte que já estava errada. Foi o
 * caso da ANTT 6.078/2026, descrita por meses como atualização da 5.998 sem que
 * ninguém tivesse aberto o site da ANTT.
 *
 * Não verifica nada sozinho — decidir que uma resolução trata de outro assunto é
 * leitura humana. O que ele faz é transformar a dívida de verificação em uma
 * lista ordenada por risco, com o link para conferir quando existe.
 *
 * Uso:
 *   npm run knowledge:audit            fatos pendentes, por risco
 *   npm run knowledge:audit -- --all   inclui os já verificados
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FACTS_DIR = join(ROOT, "src", "knowledge", "facts");

const bold = (s) => `[1m${s}[0m`;
const dim = (s) => `[2m${s}[0m`;
const red = (s) => `[31m${s}[0m`;
const yellow = (s) => `[33m${s}[0m`;
const green = (s) => `[32m${s}[0m`;
const cyan = (s) => `[36m${s}[0m`;

/**
 * Um fato que vira número numa peça é mais perigoso que um que orienta o tom:
 * quem lê confere o número, não a intenção. Por isso a lista é ordenada por
 * presença de dado duro, não por ordem de arquivo.
 */
const HARD_DATA = /R\$|\d{4}|\d+%|art\.|n[ºo°]\s*\d|\d+\/\d{4}|\bIBC-|\b\d+:\d+\b/i;

const TIER_LABEL = {
  primaria: green("primária"),
  secundaria: yellow("secundária"),
  interna: dim("interna"),
  "nao-verificado": red("não verificado"),
};

function loadFacts() {
  return readdirSync(FACTS_DIR)
    .filter((name) => name.endsWith(".json"))
    .flatMap((name) => {
      const data = JSON.parse(readFileSync(join(FACTS_DIR, name), "utf8"));
      const brand = name.replace(/-normas\.json$/, "");
      return (data.facts ?? []).map((fact) => ({ ...fact, brand }));
    });
}

function main() {
  const showAll = process.argv.includes("--all");
  const facts = loadFacts();
  const today = new Date();

  const expired = (f) => f.revalidateBy && new Date(f.revalidateBy) < today;
  const pending = facts.filter((f) => f.tier !== "primaria" || expired(f));

  const byTier = facts.reduce((acc, f) => {
    const key = expired(f) ? "vencido" : f.tier;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  console.log("");
  console.log(bold("  Procedência dos fatos normativos"));
  console.log("");
  for (const [tier, n] of Object.entries(byTier).sort((a, b) => b[1] - a[1])) {
    const share = Math.round((n / facts.length) * 100);
    console.log(`  ${String(n).padStart(3)} ${(TIER_LABEL[tier] ?? tier).padEnd(24)} ${dim(share + "%")}`);
  }
  console.log("");
  console.log(
    dim(`  Só fonte primária dentro da validade pode virar número numa peça.`),
  );
  console.log(
    dim(`  ${pending.length} de ${facts.length} ainda não podem.`),
  );

  const shown = showAll ? facts : pending;
  if (shown.length === 0) {
    console.log("");
    console.log(green("  Nada pendente."));
    console.log("");
    return;
  }

  // Dado duro primeiro: é o que alguém confere na peça publicada.
  const ranked = [...shown].sort((a, b) => {
    const risk = (f) => (expired(f) ? 3 : 0) + (HARD_DATA.test(f.claim) ? 2 : 0) + (f.url ? 0 : 1);
    return risk(b) - risk(a);
  });

  console.log("");
  console.log(bold("  Para conferir, em ordem de risco"));
  console.log("");

  for (const fact of ranked) {
    const tier = expired(fact) ? red("VENCIDO") : TIER_LABEL[fact.tier] ?? fact.tier;
    const hard = HARD_DATA.test(fact.claim) ? yellow(" ·dado duro") : "";
    console.log(`  ${cyan(fact.brand)}/${bold(fact.id)}  [${tier}]${hard}`);
    console.log(`    ${fact.claim.length > 120 ? fact.claim.slice(0, 117) + "..." : fact.claim}`);
    console.log(dim(`    fonte atual: ${fact.source}`));
    if (fact.url) console.log(dim(`    conferir em: ${fact.url}`));
    if (fact.notes) console.log(dim(`    nota: ${fact.notes}`));
    console.log("");
  }

  console.log(dim("  Depois de conferir, edite o registro em src/knowledge/facts/:"));
  console.log(dim('  tier: "primaria", source e url da fonte oficial, checkedAt, checkedBy.'));
  console.log("");
}

main();

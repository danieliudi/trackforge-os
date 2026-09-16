/**
 * Puxa a `main` e deixa as dependências batendo com o lock. Nada mais.
 *
 * POR QUE EXISTE, SE JÁ TEM O `rodar-local`. São coisas diferentes, e misturar
 * as duas foi o que motivou separar:
 *
 * - `scripts/rodar-local.ps1` / `.sh` é a PRIMEIRA vez. Ele acha ou clona a
 *   pasta, confere a versão do Node, explica o login do GitHub quando o clone
 *   falha, e só então sobe o app. Precisa rodar de fora do projeto, porque o
 *   projeto pode nem existir ainda.
 * - Este aqui é TODO DIA DEPOIS. A pasta já existe, o Node já serve, e o que
 *   se quer é uma linha: `npm run rodar`.
 *
 * Ele não duplica o bootstrap — faz o pedaço que o bootstrap faz no meio, e não
 * faz nenhum dos pedaços que só importam na primeira vez.
 *
 * DUAS REGRAS DE COMPORTAMENTO, e as duas vêm do bootstrap:
 *
 * 1. NÃO CONSEGUIR ATUALIZAR NÃO IMPEDE DE RODAR. Sem rede, com alteração
 *    local, ou com a branch divergida, ele avisa e SAI COM 0 — o app que já
 *    está na pasta continua subindo. Travar o `npm run rodar` porque o Wi-Fi
 *    caiu seria trocar um incômodo por um bloqueio.
 * 2. DEPENDÊNCIA QUEBRADA IMPEDE. Se o `npm ci` falhar, sai com 1: app que sobe
 *    com `node_modules` pela metade quebra numa tela qualquer, longe da causa.
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOCK = join(RAIZ, "package-lock.json");
const CARIMBO = join(RAIZ, "node_modules", ".trackforge-lock");

const verde = (s) => `\x1b[32m${s}\x1b[0m`;
const amarelo = (s) => `\x1b[33m${s}\x1b[0m`;
const vermelho = (s) => `\x1b[31m${s}\x1b[0m`;
const passo = (s) => console.log(`\n${s}`);

/** Comando externo com a saída à vista. Devolve se deu certo, sem estourar. */
function rodar(cmd, args) {
  try {
    execFileSync(cmd, args, { cwd: RAIZ, stdio: "inherit", shell: process.platform === "win32" });
    return true;
  } catch {
    return false;
  }
}

/** Idem, mas capturando a saída — para perguntar coisas ao git sem poluir. */
function perguntar(args) {
  try {
    return execFileSync("git", args, { cwd: RAIZ, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

// ── 1. Puxar ────────────────────────────────────────────────────────────────
passo("Buscando novidades");

if (!existsSync(join(RAIZ, ".git"))) {
  console.log(`  ${amarelo("!")} esta cópia não é um clone git — nada para atualizar.`);
} else if (perguntar(["status", "--porcelain"]) !== "") {
  // Alteração local não se descarta em silêncio. O bootstrap tem a mesma regra,
  // e ela existe porque a pasta do Daniel pode ter um `.env.local` ou um teste
  // no meio — puxar por cima disso é perder trabalho sem perguntar.
  console.log(`  ${amarelo("!")} você tem alteração local não commitada — não vou puxar por cima.`);
  console.log("    Para ver o que é:  git status");
} else {
  const antes = perguntar(["rev-parse", "HEAD"]);
  if (rodar("git", ["pull", "--ff-only", "origin", "main"])) {
    const agora = perguntar(["log", "--oneline", "-1"]);
    const mudou = perguntar(["rev-parse", "HEAD"]) !== antes;
    console.log(`  ${verde("OK")}  ${mudou ? "atualizado até" : "já estava em"} ${agora}`);
  } else {
    console.log(`  ${amarelo("!")} não consegui puxar — sigo com o que já está aqui.`);
    console.log("    Sem rede, ou sua branch divergiu da main. O app sobe do mesmo jeito.");
  }
}

// ── 2. Dependências, só quando o lock mudou ─────────────────────────────────
//
// `npm ci` APAGA o `node_modules` e reinstala tudo do lock. É o certo quando a
// lista de dependências mudou, e é meio minuto de espera quando não mudou —
// toda vez, por nada. `npm install` seria rápido, mas ele pode reescrever o
// próprio lock, e aí a pasta amanhece "suja" no `git status` sem ninguém ter
// mexido em nada. O carimbo resolve os dois: guarda o hash do lock instalado, e
// o `ci` roda exatamente quando esse hash muda.
passo("Conferindo dependências");

if (!existsSync(LOCK)) {
  console.log(`  ${amarelo("!")} sem package-lock.json — pulei, e isso não deveria acontecer.`);
} else {
  const hash = createHash("sha256").update(readFileSync(LOCK)).digest("hex");
  const instalado = existsSync(CARIMBO) ? readFileSync(CARIMBO, "utf8").trim() : null;
  const temPasta = existsSync(join(RAIZ, "node_modules"));

  if (temPasta && instalado === hash) {
    console.log(`  ${verde("OK")}  já batem com o lock — nada a instalar`);
  } else {
    console.log(temPasta ? "  o lock mudou, reinstalando…" : "  primeira instalação nesta pasta…");
    if (!rodar("npm", ["ci"])) {
      console.log(`\n  ${vermelho("X")}  o npm ci falhou. NÃO vou subir o app com dependência pela metade.`);
      console.log("    App que sobe assim quebra numa tela qualquer, longe da causa.");
      process.exit(1);
    }
    writeFileSync(CARIMBO, hash);
    console.log(`  ${verde("OK")}  dependências instaladas`);
  }
}

// ── 3. A chave que faz o app servir para alguma coisa ───────────────────────
//
// POR QUE ISTO ESTÁ AQUI, E É CORREÇÃO DE UM BURACO MEU. O bootstrap
// (`rodar-local.ps1`) confere a chave da Anthropic e se RECUSA a subir sem ela
// — certo, porque na primeira vez não há nada para olhar sem gerar. Quando o
// `npm run rodar` nasceu, ele herdou o `git pull` e o `npm ci` do bootstrap e
// NÃO herdou esta conferência. O resultado é o pior tipo de silêncio: o app
// sobe inteiro, a tela pinta certo, e a descoberta só acontece no clique que
// deveria custar dinheiro — com a mensagem crua da API, "API key is invalid",
// que não diz onde fica o arquivo nem o que fazer.
//
// AVISA, NÃO BLOQUEIA — e a diferença para o bootstrap é deliberada. Ali é a
// primeira vez e não existe nada para ver. Aqui o app já funciona: Custos,
// Fatos, Instalação e o editor abrem e são úteis sem gerar nada. Travar tudo
// porque a chave venceu seria a mesma troca que este arquivo já recusa uma vez
// acima — um incômodo virando bloqueio.
//
// O VALOR NUNCA É IMPRESSO (CLAUDE.md seção 3). Só o nome da variável, e se
// está preenchida.
const ENV = join(RAIZ, ".env.local");
passo("Conferindo a chave da Anthropic");

if (!existsSync(ENV)) {
  console.log(`  ${amarelo("!")} não existe .env.local — o app sobe, mas não gera nada.`);
  console.log("    Crie a partir do exemplo:  cp .env.example .env.local");
} else {
  const linha = readFileSync(ENV, "utf8")
    .split(/\r?\n/)
    .find((l) => l.startsWith("ANTHROPIC_API_KEY="));
  // `sk-ant-...` é o texto literal do `.env.example`, e o bootstrap copia o
  // exemplo quando o `.env.local` não existe. Placeholder esquecido é
  // indistinguível de chave errada para a API: os dois voltam 401.
  const valor = (linha ?? "").split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");

  if (!valor || valor === "sk-ant-...") {
    console.log(`  ${amarelo("!")} ANTHROPIC_API_KEY ${valor ? "ainda é o exemplo" : "está vazia"} — nada vai gerar.`);
    console.log("    1. Pegue a chave em https://console.anthropic.com/settings/keys");
    console.log(`    2. Abra ${ENV}`);
    console.log("    3. Troque o valor e rode de novo");
  } else {
    console.log(`  ${verde("OK")}  ANTHROPIC_API_KEY está preenchida`);
    // Não vale a pena chamar a API para validar: gastaria dinheiro a cada
    // `npm run rodar` para responder uma pergunta que o primeiro clique
    // responde de graça. Preenchida != válida, e a tela diz o resto.
  }
}

console.log(`\n${verde("✓")} pasta local em dia\n`);

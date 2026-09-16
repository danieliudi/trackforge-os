#!/usr/bin/env bash
#
# Baixa o trackforge-os e sobe ele na sua máquina.
#
# Serve para as duas coisas: a PRIMEIRA vez (clona) e todas as outras
# (atualiza). Pode rodar quantas vezes quiser — ele nunca apaga o seu
# `.env.local` nem descarta alteração sua sem avisar.
#
# COMO USAR
#   1. Salve este arquivo onde quiser guardar o projeto (ex.: a Área de Trabalho)
#   2. Abra o Terminal naquela pasta
#   3. bash rodar-local.sh
#
# Funciona em macOS, Linux, WSL e no Git Bash do Windows.

set -euo pipefail

# O repositório foi RENOMEADO para `trackforge-os` em 16/09/2026. O GitHub
# redireciona o nome antigo, então clone com a URL velha ainda funciona — até
# alguém criar um repo novo com aquele nome, e aí para de funcionar sem aviso.
# Por isso a URL aqui é a nova. Quem já tem clone antigo não precisa fazer nada:
# o `origin` dele continua sendo redirecionado.
REPO="https://github.com/danieliudi/trackforge-os.git"
PASTA="trackforge-os"
NODE_MINIMO="20.9.0"   # exigência do Next 16 (node_modules/next/package.json)

# Cores só quando a saída é um terminal de verdade — em log elas viram lixo.
if [ -t 1 ]; then
  N=$'\033[0m'; B=$'\033[1m'; VERDE=$'\033[32m'; VERM=$'\033[31m'; AMAR=$'\033[33m'
else
  N=""; B=""; VERDE=""; VERM=""; AMAR=""
fi
passo() { printf '\n%s▸ %s%s\n' "$B" "$1" "$N"; }
erro()  { printf '\n%s✖ %s%s\n' "$VERM" "$1" "$N" >&2; }
ok()    { printf '%s✓%s %s\n' "$VERDE" "$N" "$1"; }
aviso() { printf '%s!%s %s\n' "$AMAR" "$N" "$1"; }

# ── 1. As três ferramentas que precisam existir ─────────────────────────────
passo "Conferindo o que precisa estar instalado"

faltando=()
for cmd in git node npm; do
  command -v "$cmd" >/dev/null 2>&1 || faltando+=("$cmd")
done

if [ ${#faltando[@]} -gt 0 ]; then
  erro "Falta instalar: ${faltando[*]}"
  cat <<'AJUDA'

  git   → https://git-scm.com/downloads
  node  → https://nodejs.org  (a versão LTS; o npm vem junto)

  Instale e rode este script de novo.
AJUDA
  exit 1
fi

# Comparação de versão que funciona com 20.9.0 vs 20.10.0 — `sort -V` entende
# número, e `[[ "20.9" < "20.10" ]]` (texto) responderia errado.
node_atual="$(node -v | sed 's/^v//')"
menor="$(printf '%s\n%s\n' "$NODE_MINIMO" "$node_atual" | sort -V | head -1)"
if [ "$menor" != "$NODE_MINIMO" ]; then
  erro "Node $node_atual é antigo demais — o Next 16 precisa de $NODE_MINIMO ou mais."
  echo "  Baixe a versão LTS em https://nodejs.org e rode de novo."
  exit 1
fi
ok "git $(git --version | awk '{print $3}') · node v$node_atual · npm $(npm -v)"

# ── 2. Onde estou? ──────────────────────────────────────────────────────────
#
# Três situações reais, e o script não pode adivinhar errado nenhuma:
#   · rodando DE DENTRO de uma cópia que já existe  → trabalha aqui
#   · rodando AO LADO dela (a pasta-mãe)            → entra nela
#   · rodando numa pasta qualquer                   → clona
#
# A primeira é a que quebrava: sem este teste, rodar de dentro de
# C:\dev\trackforge-os criava C:\dev\trackforge-os\trackforge-os.
eh_este_repo() {
  git -C "$1" rev-parse --git-dir >/dev/null 2>&1 || return 1
  local url; url="$(git -C "$1" remote get-url origin 2>/dev/null || echo "")"
  # Aceita com e sem `.git` no fim, e ignora caixa: no Windows o mesmo
  # repositório aparece escrito das duas formas conforme quem clonou.
  case "$(printf '%s' "${url%.git}" | tr 'A-Z' 'a-z')" in
    *danieliudi/carousel-builder|*danieliudi/trackforge-os) return 0 ;;
    *) return 1 ;;
  esac
}

if eh_este_repo "."; then
  passo "Você já está dentro da cópia local"
  ok "$(pwd)"
elif [ -d "$PASTA" ] && eh_este_repo "$PASTA"; then
  passo "Achei a cópia local aqui do lado"
  cd "$PASTA"
  ok "$(pwd)"
elif [ -d "$PASTA" ] && [ -n "$(ls -A "$PASTA" 2>/dev/null)" ]; then
  erro "Existe uma pasta '$PASTA' aqui que NÃO é uma cópia deste projeto."
  echo "  Não vou mexer nela. Renomeie, apague, ou rode este script de outro lugar."
  exit 1
else
  passo "Baixando o projeto"
  echo "  O repositório é privado — o git vai pedir seu login do GitHub."
  if ! git clone "$REPO" "$PASTA"; then
    erro "Não consegui baixar."
    cat <<'AJUDA'

  Quase sempre é autenticação. Duas saídas:

  · Instale o GitHub CLI (https://cli.github.com) e rode:  gh auth login
  · Ou crie um token em https://github.com/settings/tokens
    e use-o como SENHA quando o git pedir (o usuário é seu login).
AJUDA
    exit 1
  fi
  cd "$PASTA"
  ok "baixado em $(pwd)"
fi

# ── 2b. Atualizar ───────────────────────────────────────────────────────────
passo "Buscando novidades"
# Alteração local não commitada é sua; o script não decide por você.
if [ -n "$(git status --porcelain)" ]; then
  aviso "Você tem alterações não salvas nesta pasta. Não vou puxar nada por cima."
  git status --short
  echo "  (rode 'git stash' para guardá-las, ou 'git checkout .' para descartar)"
elif ! git pull --ff-only origin main 2>/dev/null; then
  aviso "Não consegui atualizar — seguindo com o que já está aqui."
else
  ok "atualizado até $(git log --oneline -1)"
fi

# ── 3. Dependências ─────────────────────────────────────────────────────────
passo "Instalando as dependências (demora na primeira vez)"
# `npm ci` e não `npm install`: instala EXATAMENTE o que está no
# package-lock.json. `install` pode subir versão sozinho e fazer a sua cópia
# rodar um código diferente do que foi testado.
npm ci
ok "dependências instaladas"

# ── 4. As chaves ────────────────────────────────────────────────────────────
passo "Conferindo as chaves"

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  ok "criei o .env.local a partir do exemplo"
else
  ok ".env.local já existe — não toquei nele"
fi

# Lê a chave SÓ para saber se está preenchida. O valor nunca é impresso:
# segredo não vai para a tela nem para log, nem para depurar (CLAUDE.md §3).
chave="$(grep -E '^ANTHROPIC_API_KEY=' .env.local | head -1 | cut -d= -f2- | tr -d '"'"'"' \r' || true)"

if [ -z "$chave" ] || [ "$chave" = "sk-ant-..." ]; then
  erro "Falta a chave da Anthropic — sem ela o app abre, mas não gera nada."
  cat <<AJUDA

  1. Pegue a chave em https://console.anthropic.com/settings/keys
  2. Abra o arquivo:  $(pwd)/.env.local
  3. Na primeira linha útil, troque  sk-ant-...  pela sua chave
  4. Rode este script de novo

  As outras variáveis do arquivo são OPCIONAIS — sem elas, as seções
  correspondentes simplesmente não aparecem. O que cada uma liga está
  explicado dentro do próprio .env.local.
AJUDA
  exit 1
fi
ok "ANTHROPIC_API_KEY está preenchida"

# ── 5. Subir ────────────────────────────────────────────────────────────────
passo "Subindo o app em http://localhost:3000"
echo "  (Ctrl+C aqui no Terminal para parar)"
echo

# Abre o navegador sozinho, depois que o servidor responder. Em subshell com
# `&` para não segurar o terminal; se falhar, o app continua de pé do mesmo
# jeito — abrir navegador é conveniência, não parte de "rodou".
(
  for _ in $(seq 1 60); do
    if curl -sf -o /dev/null --max-time 2 http://localhost:3000 2>/dev/null; then
      if command -v open >/dev/null 2>&1; then open http://localhost:3000
      elif command -v xdg-open >/dev/null 2>&1; then xdg-open http://localhost:3000
      elif command -v start >/dev/null 2>&1; then start http://localhost:3000
      fi
      break
    fi
    sleep 1
  done
) >/dev/null 2>&1 &

npm run dev

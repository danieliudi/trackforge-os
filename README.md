# trackforge-os

Ferramenta de conteúdo para as frentes **Resibag** e **Sanwey**. Ela escreve
carrossel, post, legenda, roteiro de Reels e sequência de Stories a partir de um
artigo, de um material colado, de um sinal do CRM ou de um evento — e a razão de
ela existir não é escrever rápido, é **não publicar número que ninguém sustenta**.

Todo dado que sai numa peça tem procedência declarada, toda chamada de modelo
vira uma linha de custo em reais na tela, e o que a marca proíbe dizer é varrido
antes de a peça chegar em você.

**O que cada tela faz:** [`docs/mapa-funcional.md`](docs/mapa-funcional.md).
**Como se constrói aqui:** [`CLAUDE.md`](CLAUDE.md).

---

## Rodar na sua máquina

### Já tem a pasta? Uma linha

```bash
npm run rodar
```

Puxa a `main`, acerta as dependências e sobe em http://localhost:3000. É o
comando do dia a dia — rode de dentro da pasta do projeto.

Se quiser só atualizar sem subir: `npm run atualizar`.

Ele não atropela nada. Alteração sua não commitada faz ele avisar em vez de
puxar por cima, e **não conseguir atualizar não impede de rodar**: sem rede ou
com a branch divergida ele segue com o que já está na pasta. Só dependência
quebrada interrompe, porque app com `node_modules` pela metade quebra numa tela
qualquer, longe da causa.

`npm ci` só roda quando o `package-lock.json` muda de verdade — o hash do lock
instalado fica carimbado dentro do `node_modules`. Nas outras vezes é instantâneo.

### Primeira vez, ou não tem a pasta ainda

Estes clonam, conferem a versão do Node e explicam o login do GitHub se o clone
falhar — coisas que um script npm não pode fazer, porque para rodar `npm` você
já precisa estar dentro do projeto.

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\rodar-local.ps1
```

O `-ExecutionPolicy Bypass` é necessário porque o Windows bloqueia script não
assinado por padrão, e vale **só para esta execução** — não muda a configuração
da máquina.

**macOS, Linux, WSL ou Git Bash:**

```bash
bash scripts/rodar-local.sh
```

Os dois fazem o mesmo: baixam (ou atualizam), instalam, criam o `.env.local` e
sobem o app em http://localhost:3000, abrindo o navegador. Pode rodar quantas
vezes quiser — nunca sobrescrevem o seu `.env.local` nem descartam alteração sua
sem avisar. Depois da primeira vez, `npm run rodar` acima faz o mesmo em menos
digitação.

**Rodam de qualquer um dos dois lugares:** de dentro da pasta do projeto, ou da
pasta-mãe (aí eles entram nela). E se você ainda não tem o repositório, salve só
o script numa pasta qualquer e rode de lá — ele clona sozinho.

Precisa de **git** e **Node 20.9 ou mais** ([nodejs.org](https://nodejs.org), a
versão LTS). Os dois conferem antes de começar e dizem o que falta.

### À mão, se preferir

```bash
git clone https://github.com/danieliudi/trackforge-os.git trackforge-os
cd trackforge-os
npm ci                      # `ci`, não `install`: instala o que está no lock
cp .env.example .env.local  # e preencha ANTHROPIC_API_KEY
npm run dev
```

## As chaves

Só uma é obrigatória: **`ANTHROPIC_API_KEY`**
([console.anthropic.com](https://console.anthropic.com/settings/keys)). Sem ela
o app abre e não gera nada.

O resto é opcional, e cada uma liga uma parte — sem ela, aquela parte
simplesmente não aparece na tela. O `.env.example` explica uma por uma.

**Duas coisas que não são detalhe de configuração:**

- **`SUPABASE_SERVICE_ROLE_KEY` ignora RLS.** Nunca pode ganhar o prefixo
  `NEXT_PUBLIC_`: no navegador, entregaria o banco inteiro a qualquer visitante.
- **`APP_PASSWORD` é obrigatória ao publicar.** Sem ela o `src/proxy.ts` não pede
  senha nenhuma — certo em `localhost`, inaceitável numa URL pública, porque as
  rotas gastam a chave da Anthropic, leem o CRM e escrevem na fila de aprovação.
  Quem souber o endereço faz tudo isso.

## Conferir

```bash
npm run build       # o gate: aviso de drift + ESLint bloqueante
npm run qa          # varredura de navegador — precisa do app de pé
npm run doc:check   # documentos de regra × código
```

O `qa` usa Playwright, que fica **fora** das dependências de propósito (baixa
navegador). Instale sob demanda: `npm i -g playwright && npx playwright install chromium`.
O porquê está em [`scripts/qa/README.md`](scripts/qa/README.md).

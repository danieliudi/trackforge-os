<#
    Baixa o trackforge-os e sobe ele na sua máquina. Versão para Windows.

    Serve para a PRIMEIRA vez (clona) e para todas as outras (atualiza). Pode
    rodar quantas vezes quiser — nunca apaga o seu `.env.local` nem descarta
    alteração sua sem avisar.

    COMO USAR
      1. Salve este arquivo (ex.: C:\dev\rodar-local.ps1)
      2. Abra o PowerShell na pasta
      3. powershell -ExecutionPolicy Bypass -File .\rodar-local.ps1

    O `-ExecutionPolicy Bypass` é necessário porque o Windows bloqueia script
    não assinado por padrão. Ele vale SÓ para esta execução.

    Roda de DENTRO da pasta do projeto ou da pasta-mãe.
#>

# ═══════════════════════════════════════════════════════════════════════════
# NÃO PONHA $ErrorActionPreference = 'Stop' AQUI. Sério.
#
# No PowerShell 5.1 — o que vem no Windows — um comando NATIVO (git.exe,
# npm.cmd) que escreve em stderr COM o stderr redirecionado vira um
# `NativeCommandError`. Com 'Stop', isso MATA o script na hora, antes de
# qualquer teste de `$LASTEXITCODE`.
#
# Foi exatamente assim que a primeira versão morreu na máquina do Daniel:
# `git remote get-url origin` respondeu "No such remote 'origin'" — que é uma
# RESPOSTA ESPERADA, tratada duas linhas abaixo — e o script caiu ali mesmo,
# com `FullyQualifiedErrorId : NativeCommandError` no terminal dele.
#
# NÃO REPRODUZÍVEL NO POWERSHELL 7: lá o comportamento mudou e o mesmo código
# passa. Foi medido — os dois, 'Stop' e 'Continue', rodam limpos no 7.4.6. Ou
# seja: testar um script Windows só no 7 NÃO prova que ele roda no 5.1, que é o
# que vem na máquina. A defesa aqui é não depender da diferença.
#
# Aqui o controle de erro é explícito: todo comando nativo passa por
# `Invoke-Git` ou tem o `$LASTEXITCODE` conferido logo depois.
# ═══════════════════════════════════════════════════════════════════════════
$ErrorActionPreference = 'Continue'

$REPO        = 'https://github.com/danieliudi/carousel-builder.git'
$PASTA       = 'trackforge-os'
$NODE_MINIMO = [version]'20.9.0'   # exigência do Next 16

function Passo($t) { Write-Host ""; Write-Host "> $t" -ForegroundColor White }
function Ok($t)    { Write-Host "  OK  " -ForegroundColor Green  -NoNewline; Write-Host $t }
function Aviso($t) { Write-Host "  !   " -ForegroundColor Yellow -NoNewline; Write-Host $t }
function Erro($t)  { Write-Host ""; Write-Host "  X   $t" -ForegroundColor Red }

# git com stderr capturado em vez de explodido. Devolve o código E o texto.
function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments = $true)]$Argumentos)
    $texto = & git @Argumentos 2>&1 | ForEach-Object { "$_" }
    return [pscustomobject]@{
        Ok    = ($LASTEXITCODE -eq 0)
        Texto = ($texto -join [Environment]::NewLine)
    }
}

# ── 1. O que precisa estar instalado ────────────────────────────────────────
Passo "Conferindo o que precisa estar instalado"

$faltando = @()
foreach ($c in 'git', 'node', 'npm') {
    if (-not (Get-Command $c -ErrorAction SilentlyContinue)) { $faltando += $c }
}
if ($faltando.Count -gt 0) {
    Erro "Falta instalar: $($faltando -join ', ')"
    Write-Host ""
    Write-Host "  git   -> https://git-scm.com/downloads"
    Write-Host "  node  -> https://nodejs.org  (a versao LTS; o npm vem junto)"
    Write-Host ""
    Write-Host "  Instale, FECHE E ABRA o PowerShell de novo, e rode este script."
    exit 1
}

# `node -v` devolve "v24.15.0". Corta o "v" e qualquer sufixo de pre-lancamento.
$nodeTxt = (node -v) -replace '^v', '' -replace '-.*$', ''
$nodeVer = [version]$nodeTxt
if ($nodeVer -lt $NODE_MINIMO) {
    Erro "Node $nodeTxt e antigo demais - o Next 16 precisa de $NODE_MINIMO ou mais."
    Write-Host "  Baixe a versao LTS em https://nodejs.org e rode de novo."
    exit 1
}
$gitTxt = (Invoke-Git '--version').Texto -replace '^git version ', ''
Ok "git $gitTxt - node v$nodeTxt - npm $(npm -v)"

# ── 2. Onde estou? ──────────────────────────────────────────────────────────
#
# O QUE IDENTIFICA O PROJETO É O `package.json`, NAO O REMOTE DO GIT.
# A primeira versao perguntava ao git qual era o `origin` — e a pasta do Daniel
# nao tinha remote nenhum. Uma pasta pode ser o projeto e nao ser um clone:
# ZIP baixado, `git init` na mao, copia de outra maquina. O arquivo do projeto
# responde nos tres casos; o remote so responde num.
function EhOProjeto($caminho) {
    $pkg = Join-Path $caminho 'package.json'
    if (-not (Test-Path $pkg)) { return $false }
    try { return ((Get-Content $pkg -Raw | ConvertFrom-Json).name -eq 'carousel-builder') }
    catch { return $false }
}

if (EhOProjeto '.') {
    Passo "Voce ja esta dentro da copia local"
    Ok (Get-Location).Path
}
elseif ((Test-Path $PASTA) -and (EhOProjeto $PASTA)) {
    Passo "Achei a copia local aqui do lado"
    Set-Location $PASTA
    Ok (Get-Location).Path
}
elseif ((Test-Path $PASTA) -and (Get-ChildItem $PASTA -Force | Select-Object -First 1)) {
    Erro "Existe uma pasta '$PASTA' aqui que NAO e uma copia deste projeto."
    Write-Host "  (nao achei um package.json com name = carousel-builder dentro dela)"
    Write-Host "  Nao vou mexer nela. Renomeie, apague, ou rode este script de outro lugar."
    exit 1
}
else {
    Passo "Baixando o projeto"
    Write-Host "  O repositorio e privado - o git vai pedir seu login do GitHub."
    & git clone $REPO $PASTA
    if ($LASTEXITCODE -ne 0) {
        Erro "Nao consegui baixar."
        Write-Host ""
        Write-Host "  Quase sempre e autenticacao. Duas saidas:"
        Write-Host "  - Instale o GitHub CLI (https://cli.github.com) e rode:  gh auth login"
        Write-Host "  - Ou crie um token em https://github.com/settings/tokens"
        Write-Host "    e use-o como SENHA quando o git pedir (o usuario e seu login)."
        exit 1
    }
    Set-Location $PASTA
    Ok (Get-Location).Path
}

# ── 2b. Atualizar, quando der ───────────────────────────────────────────────
#
# Tres estados possiveis, e nenhum deles impede o app de subir. Atualizar e
# bom; nao conseguir atualizar nao e motivo para nao rodar o que ja esta aqui.
Passo "Buscando novidades"

$ehGit  = (Invoke-Git 'rev-parse' '--git-dir').Ok
$remote = if ($ehGit) { (Invoke-Git 'remote' 'get-url' 'origin') } else { $null }

if (-not $ehGit) {
    Aviso "Esta pasta nao e um repositorio git - seguindo sem atualizar."
    Write-Host "  (para passar a receber atualizacoes: git init && git remote add origin $REPO)"
}
elseif (-not $remote.Ok) {
    Aviso "E um repositorio git, mas sem 'origin' - nao tenho de onde atualizar."
    Write-Host "  Para ligar:  git remote add origin $REPO"
    Write-Host "  Depois:      git fetch origin && git branch --set-upstream-to=origin/main main"
}
else {
    $sujo = (Invoke-Git 'status' '--porcelain').Texto
    if ($sujo) {
        Aviso "Voce tem alteracoes nao salvas nesta pasta. Nao vou puxar nada por cima."
        Write-Host $sujo
        Write-Host "  (rode 'git stash' para guarda-las, ou 'git checkout .' para descartar)"
    }
    else {
        $pull = Invoke-Git 'pull' '--ff-only' 'origin' 'main'
        if ($pull.Ok) { Ok "atualizado ate $((Invoke-Git 'log' '--oneline' '-1').Texto)" }
        else {
            Aviso "Nao consegui atualizar - seguindo com o que ja esta aqui."
            Write-Host $pull.Texto
        }
    }
}

# ── 3. Dependências ─────────────────────────────────────────────────────────
Passo "Instalando as dependencias (demora na primeira vez)"
# `npm ci` exige package-lock.json e instala EXATAMENTE o que esta nele. Numa
# copia sem lock (ZIP incompleto), cai para `npm install`, que ao menos sobe.
if (Test-Path 'package-lock.json') { & npm ci }
else {
    Aviso "Sem package-lock.json - usando 'npm install' (pode subir versao sozinho)."
    & npm install
}
if ($LASTEXITCODE -ne 0) {
    Erro "A instalacao falhou. O erro do npm esta logo acima."
    exit 1
}
Ok "dependencias instaladas"

# ── 4. As chaves ────────────────────────────────────────────────────────────
Passo "Conferindo as chaves"

if (-not (Test-Path '.env.local')) {
    if (-not (Test-Path '.env.example')) {
        Erro "Nao achei nem .env.local nem .env.example nesta pasta."
        Write-Host "  A copia parece incompleta. O caminho mais curto e apagar a pasta"
        Write-Host "  e deixar este script clonar do zero."
        exit 1
    }
    Copy-Item '.env.example' '.env.local'
    Ok "criei o .env.local a partir do exemplo"
}
else { Ok ".env.local ja existe - nao toquei nele" }

# Le a chave SO para saber se esta preenchida. O valor nunca e impresso:
# segredo nao vai para a tela nem para log, nem para depurar.
$chave = ''
$linha = Select-String -Path '.env.local' -Pattern '^ANTHROPIC_API_KEY=' | Select-Object -First 1
if ($linha) { $chave = ($linha.Line -split '=', 2)[1].Trim().Trim('"').Trim("'") }

if (-not $chave -or $chave -eq 'sk-ant-...') {
    Erro "Falta a chave da Anthropic - sem ela o app abre, mas nao gera nada."
    Write-Host ""
    Write-Host "  1. Pegue a chave em https://console.anthropic.com/settings/keys"
    Write-Host "  2. Abra o arquivo:  $((Get-Location).Path)\.env.local"
    Write-Host "  3. Troque  sk-ant-...  pela sua chave"
    Write-Host "  4. Rode este script de novo"
    Write-Host ""
    Write-Host "  As outras variaveis sao OPCIONAIS - sem elas, as secoes"
    Write-Host "  correspondentes simplesmente nao aparecem na tela."
    exit 1
}
Ok "ANTHROPIC_API_KEY esta preenchida"

# ── 5. Subir ────────────────────────────────────────────────────────────────
Passo "Subindo o app em http://localhost:3000"
Write-Host "  (Ctrl+C nesta janela para parar)"
Write-Host ""

# Abrir o navegador e conveniencia, nao parte de "rodou": se falhar, o app
# continua de pe e o endereco esta escrito acima.
try {
    Start-Job -ScriptBlock {
        for ($i = 0; $i -lt 60; $i++) {
            try {
                Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2 | Out-Null
                Start-Process 'http://localhost:3000'
                break
            } catch { Start-Sleep -Seconds 1 }
        }
    } | Out-Null
} catch { }

& npm run dev

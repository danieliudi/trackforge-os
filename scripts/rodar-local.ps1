<#
    Baixa o trackforge-os e sobe ele na sua máquina. Versão para Windows.

    Serve para as duas coisas: a PRIMEIRA vez (clona) e todas as outras
    (atualiza). Pode rodar quantas vezes quiser — nunca apaga o seu
    `.env.local` nem descarta alteração sua sem avisar.

    COMO USAR
      1. Salve este arquivo (ex.: C:\dev\rodar-local.ps1)
      2. Abra o PowerShell na pasta
      3. powershell -ExecutionPolicy Bypass -File .\rodar-local.ps1

    O `-ExecutionPolicy Bypass` é necessário porque o Windows bloqueia script
    não assinado por padrão. Ele vale SÓ para esta execução — não muda a
    configuração da sua máquina.

    Roda tanto de DENTRO da pasta do projeto quanto da pasta-mãe.
#>

$ErrorActionPreference = 'Stop'

$REPO        = 'https://github.com/danieliudi/carousel-builder.git'
$PASTA       = 'trackforge-os'
$NODE_MINIMO = [version]'20.9.0'   # exigência do Next 16

function Passo($t) { Write-Host ""; Write-Host "> $t" -ForegroundColor White }
function Ok($t)    { Write-Host "  OK  " -ForegroundColor Green -NoNewline; Write-Host $t }
function Aviso($t) { Write-Host "  !   " -ForegroundColor Yellow -NoNewline; Write-Host $t }
function Erro($t)  { Write-Host ""; Write-Host "  X   $t" -ForegroundColor Red }

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
    Write-Host "  (o PowerShell so enxerga o programa novo numa janela nova)"
    exit 1
}

# `node -v` devolve "v22.22.2". Corta o "v" e qualquer sufixo de pré-lançamento
# ("-nightly"), que faria o cast para [version] estourar.
$nodeTxt = (node -v) -replace '^v', '' -replace '-.*$', ''
$nodeVer = [version]$nodeTxt
if ($nodeVer -lt $NODE_MINIMO) {
    Erro "Node $nodeTxt e antigo demais - o Next 16 precisa de $NODE_MINIMO ou mais."
    Write-Host "  Baixe a versao LTS em https://nodejs.org e rode de novo."
    exit 1
}
Ok "node v$nodeTxt - npm $(npm -v)"

# ── 2. Onde estou? ──────────────────────────────────────────────────────────
#
# Três situações, e o script não pode errar nenhuma:
#   · rodando DE DENTRO de uma cópia que já existe  -> trabalha aqui
#   · rodando AO LADO dela (a pasta-mãe)            -> entra nela
#   · rodando numa pasta qualquer                   -> clona
function EhEsteRepo($caminho) {
    if (-not (Test-Path (Join-Path $caminho '.git'))) { return $false }
    $url = & git -C $caminho remote get-url origin 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $url) { return $false }
    # Aceita com e sem `.git`, https e ssh, e ignora caixa.
    $u = ($url -replace '\.git$', '').ToLower()
    return ($u -like '*danieliudi/carousel-builder') -or ($u -like '*danieliudi/trackforge-os')
}

if (EhEsteRepo '.') {
    Passo "Voce ja esta dentro da copia local"
    Ok (Get-Location).Path
}
elseif ((Test-Path $PASTA) -and (EhEsteRepo $PASTA)) {
    Passo "Achei a copia local aqui do lado"
    Set-Location $PASTA
    Ok (Get-Location).Path
}
elseif ((Test-Path $PASTA) -and (Get-ChildItem $PASTA -Force | Select-Object -First 1)) {
    Erro "Existe uma pasta '$PASTA' aqui que NAO e uma copia deste projeto."
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
        Write-Host ""
        Write-Host "  - Instale o GitHub CLI (https://cli.github.com) e rode:  gh auth login"
        Write-Host "  - Ou crie um token em https://github.com/settings/tokens"
        Write-Host "    e use-o como SENHA quando o git pedir (o usuario e seu login)."
        exit 1
    }
    Set-Location $PASTA
    Ok (Get-Location).Path
}

# ── 2b. Atualizar ───────────────────────────────────────────────────────────
Passo "Buscando novidades"
$sujo = & git status --porcelain
if ($sujo) {
    Aviso "Voce tem alteracoes nao salvas nesta pasta. Nao vou puxar nada por cima."
    & git status --short
    Write-Host "  (rode 'git stash' para guarda-las, ou 'git checkout .' para descartar)"
}
else {
    & git pull --ff-only origin main
    if ($LASTEXITCODE -ne 0) { Aviso "Nao consegui atualizar - seguindo com o que ja esta aqui." }
    else { Ok "atualizado ate $(git log --oneline -1)" }
}

# ── 3. Dependências ─────────────────────────────────────────────────────────
Passo "Instalando as dependencias (demora na primeira vez)"
# `npm ci` e nao `npm install`: instala EXATAMENTE o que esta no
# package-lock.json. `install` pode subir versao sozinho e fazer a sua copia
# rodar um codigo diferente do que foi testado.
& npm ci
if ($LASTEXITCODE -ne 0) {
    Erro "A instalacao falhou. O erro do npm esta logo acima."
    exit 1
}
Ok "dependencias instaladas"

# ── 4. As chaves ────────────────────────────────────────────────────────────
Passo "Conferindo as chaves"

if (-not (Test-Path '.env.local')) {
    Copy-Item '.env.example' '.env.local'
    Ok "criei o .env.local a partir do exemplo"
}
else {
    Ok ".env.local ja existe - nao toquei nele"
}

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
    Write-Host "  As outras variaveis do arquivo sao OPCIONAIS - sem elas, as secoes"
    Write-Host "  correspondentes simplesmente nao aparecem. O que cada uma liga esta"
    Write-Host "  explicado dentro do proprio .env.local."
    exit 1
}
Ok "ANTHROPIC_API_KEY esta preenchida"

# ── 5. Subir ────────────────────────────────────────────────────────────────
Passo "Subindo o app em http://localhost:3000"
Write-Host "  (Ctrl+C aqui nesta janela para parar)"
Write-Host ""

# Abre o navegador depois que o servidor responder. Em job separado para nao
# segurar o terminal; dentro de try/catch porque abrir navegador e conveniencia,
# nao parte de "rodou" - se falhar, o app continua de pe do mesmo jeito.
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

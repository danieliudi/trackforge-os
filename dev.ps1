# dev.ps1 - inicia o Carousel Builder localmente (Windows PowerShell)
#
# Uso: a partir da pasta do projeto, rode:
#   .\dev.ps1
#
# Detecta node_modules desatualizado (ex.: depois de um git pull que trouxe
# uma dependencia nova, tipo o pptxgenjs) e roda "npm install" sozinho antes
# de subir o servidor - pra nao repetir o erro "Module not found".

$ErrorActionPreference = "Stop"

$lockFile = Join-Path $PSScriptRoot "package-lock.json"
$modulesDir = Join-Path $PSScriptRoot "node_modules"

$needsInstall = -not (Test-Path $modulesDir)
if (-not $needsInstall -and (Test-Path $lockFile)) {
    $needsInstall = (Get-Item $lockFile).LastWriteTime -gt (Get-Item $modulesDir).LastWriteTime
}

if ($needsInstall) {
    Write-Host "package-lock.json mudou desde a ultima instalacao -- rodando npm install..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "npm install falhou (codigo $LASTEXITCODE). Corrija o erro acima antes de continuar." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

Write-Host "Iniciando o servidor de desenvolvimento em http://localhost:3000 ..." -ForegroundColor Cyan
npm run dev

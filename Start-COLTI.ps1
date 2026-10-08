[CmdletBinding()]
param([switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
Set-Location $root

function Refresh-CommandPath {
  $extra = @((Join-Path $env:ProgramFiles 'nodejs'), (Join-Path $env:APPDATA 'npm'))
  foreach ($path in $extra) {
    if ((Test-Path $path) -and ($env:Path -notlike "*$path*")) { $env:Path = "$path;$env:Path" }
  }
}

function Get-CommandPath([string]$name) {
  $command = Get-Command $name -ErrorAction SilentlyContinue
  if ($command) { return $command.Source }
  return $null
}

function Install-NodeLts([string]$operation) {
  $winget = Get-CommandPath 'winget.exe'
  if (-not $winget) { throw 'No encontré Node.js ni winget. Instala Node.js LTS 22.12 o posterior y vuelve a ejecutar Start-COLTI.cmd.' }
  Write-Host 'Preparando Node.js LTS...' -ForegroundColor Cyan
  & $winget $operation --id OpenJS.NodeJS.LTS --exact --accept-source-agreements --accept-package-agreements
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo instalar/actualizar Node.js LTS. Revisa el mensaje de winget y vuelve a ejecutar el lanzador.' }
  Refresh-CommandPath
}

$nodePath = Get-CommandPath 'node.exe'
if (-not $nodePath) {
  Install-NodeLts 'install'
  $nodePath = Get-CommandPath 'node.exe'
}
if (-not $nodePath) { throw 'Node.js se instaló, pero esta sesión no detecta node.exe. Cierra esta ventana y vuelve a ejecutar Start-COLTI.cmd.' }

$nodeVersionText = & $nodePath -p 'process.versions.node'
$nodeVersion = [version]$nodeVersionText
if ($nodeVersion -lt [version]'22.12.0') {
  Install-NodeLts 'upgrade'
  $nodePath = Get-CommandPath 'node.exe'
  if (-not $nodePath) { throw 'No se detectó Node.js tras actualizar. Cierra esta ventana y vuelve a ejecutar el lanzador.' }
  $nodeVersion = [version](& $nodePath -p 'process.versions.node')
  if ($nodeVersion -lt [version]'22.12.0') { throw "Se requiere Node.js 22.12 o posterior; se detectó $nodeVersion." }
}

$package = Get-Content (Join-Path $root 'package.json') -Raw | ConvertFrom-Json
$requiredPnpm = ($package.packageManager -replace '^pnpm@', '')
$pnpmPath = Get-CommandPath 'pnpm.cmd'
if (-not $pnpmPath) { $pnpmPath = Get-CommandPath 'pnpm' }
$npmPath = Get-CommandPath 'npm.cmd'
if (-not $npmPath) { $npmPath = Get-CommandPath 'npm' }

if (-not $pnpmPath -or ((& $pnpmPath --version).Trim() -ne $requiredPnpm)) {
  if ($npmPath) {
    Write-Host "Preparando pnpm $requiredPnpm..." -ForegroundColor Cyan
    & $npmPath install --global "pnpm@$requiredPnpm"
    if ($LASTEXITCODE -ne 0) { throw "No se pudo instalar pnpm $requiredPnpm." }
    Refresh-CommandPath
    $pnpmPath = Get-CommandPath 'pnpm.cmd'
    if (-not $pnpmPath) { $pnpmPath = Get-CommandPath 'pnpm' }
  } elseif (-not $pnpmPath) {
    throw 'No encontré pnpm ni npm. Instala Node.js LTS completo (incluye npm) y vuelve a ejecutar Start-COLTI.cmd.'
  } else {
    Write-Warning "Se usará el pnpm disponible ($(& $pnpmPath --version)); npm/corepack no está disponible para fijar $requiredPnpm."
  }
}
if (-not $pnpmPath) { throw 'pnpm no quedó disponible en esta sesión. Cierra la ventana y vuelve a ejecutar Start-COLTI.cmd.' }

Write-Host 'Instalando dependencias del proyecto...' -ForegroundColor Cyan
& $pnpmPath install --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Falló la instalación de dependencias; revisa la conexión y vuelve a ejecutar Start-COLTI.cmd.' }

if (-not (Test-Path (Join-Path $root '.env.production.local'))) {
  Write-Warning 'No existe .env.production.local. Store podrá abrir, pero no tendrá conexión Supabase hasta que configures ese archivo local.'
}

$runtime = Join-Path $root '.colti-runtime'
New-Item -ItemType Directory -Path $runtime -Force | Out-Null
$viteCli = Join-Path $root 'node_modules/vite/bin/vite.js'
if (-not (Test-Path $viteCli)) { throw 'No se encontró Vite después de instalar dependencias.' }

function Test-Listening([int]$port) {
  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    $task = $client.ConnectAsync('127.0.0.1', $port)
    return $task.Wait(700) -and $client.Connected
  } catch { return $false } finally { $client.Dispose() }
}

function Test-Ready([string]$url) {
  try {
    $response = Invoke-WebRequest -Uri $url -TimeoutSec 3 -UseBasicParsing
    return [int]$response.StatusCode -ge 200 -and [int]$response.StatusCode -lt 400
  } catch { return $false }
}

$storeUrl = 'http://127.0.0.1:4176/'
$adminUrl = 'http://127.0.0.1:4174/admin/orders'
$storeReady = Test-Ready $storeUrl
$adminReady = Test-Ready $adminUrl
if ((Test-Listening 4176) -and -not $storeReady) { throw 'El puerto 4176 ya está ocupado por un servicio que no respondió como Store. No lo detuve.' }
if ((Test-Listening 4174) -and -not $adminReady) { throw 'El puerto 4174 ya está ocupado por un servicio que no respondió como Admin local. No lo detuve.' }

$statePath = Join-Path $runtime 'pids.json'
$previous = $null
if (Test-Path $statePath) {
  try { $previous = Get-Content $statePath -Raw | ConvertFrom-Json } catch { $previous = $null }
}
$storeProcess = $null
$adminProcess = $null

if (-not $storeReady) {
  Write-Host 'Levantando Store en 127.0.0.1:4176...' -ForegroundColor Cyan
  $arguments = '"{0}" --mode production --host 127.0.0.1 --port 4176 --strictPort' -f $viteCli
  $storeProcess = Start-Process -FilePath $nodePath -ArgumentList $arguments -WorkingDirectory $root -RedirectStandardOutput (Join-Path $runtime 'store.log') -RedirectStandardError (Join-Path $runtime 'store-error.log') -WindowStyle Hidden -PassThru
}
if (-not $adminReady) {
  Write-Host 'Levantando Admin local en 127.0.0.1:4174...' -ForegroundColor Cyan
  $arguments = '"{0}" --mode admin-preview --host 127.0.0.1 --port 4174 --strictPort' -f $viteCli
  $adminProcess = Start-Process -FilePath $nodePath -ArgumentList $arguments -WorkingDirectory $root -RedirectStandardOutput (Join-Path $runtime 'admin.log') -RedirectStandardError (Join-Path $runtime 'admin-error.log') -WindowStyle Hidden -PassThru
}

$deadline = [DateTime]::UtcNow.AddSeconds(60)
do {
  $storeReady = Test-Ready $storeUrl
  $adminReady = Test-Ready $adminUrl
  if ($storeReady -and $adminReady) { break }
  if ($storeProcess -and $storeProcess.HasExited) { throw "Store se cerró al iniciar. Revisa $runtime\store-error.log." }
  if ($adminProcess -and $adminProcess.HasExited) { throw "Admin se cerró al iniciar. Revisa $runtime\admin-error.log." }
  Start-Sleep -Seconds 1
} while ([DateTime]::UtcNow -lt $deadline)

if (-not ($storeReady -and $adminReady)) { throw "Los servidores no respondieron a tiempo. Revisa los registros de $runtime." }

$storePid = if ($storeProcess) { $storeProcess.Id } elseif ($previous) { $previous.storePid } else { $null }
$adminPid = if ($adminProcess) { $adminProcess.Id } elseif ($previous) { $previous.adminPid } else { $null }
[ordered]@{ root = $root; storePid = $storePid; adminPid = $adminPid } | ConvertTo-Json | Set-Content -Path $statePath -Encoding UTF8

Write-Host 'COLTI está disponible:' -ForegroundColor Green
Write-Host "Store: $storeUrl"
Write-Host "Admin local: $adminUrl"
Write-Host "Registros: $runtime"
if (-not $NoBrowser) {
  Start-Process $storeUrl
  Start-Process $adminUrl
}

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$statePath = Join-Path $root '.colti-runtime/pids.json'
if (-not (Test-Path $statePath)) {
  Write-Host 'No hay procesos registrados por Start-COLTI.cmd.'
  exit 0
}

$state = Get-Content $statePath -Raw | ConvertFrom-Json
$targets = @(
  @{ name = 'Store'; pid = $state.storePid; port = 4176 },
  @{ name = 'Admin local'; pid = $state.adminPid; port = 4174 }
)
foreach ($target in $targets) {
  if (-not $target.pid) { continue }
  $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($target.pid)" -ErrorAction SilentlyContinue
  if (-not $process) { continue }
  $expectedScript = [IO.Path]::GetFullPath((Join-Path $root 'node_modules/vite/bin/vite.js'))
  if ($process.Name -eq 'node.exe' -and $process.CommandLine.Contains($expectedScript) -and $process.CommandLine.Contains("--port $($target.port)")) {
    Stop-Process -Id $target.pid -Force
    Write-Host "$($target.name) detenido."
  } else {
    Write-Warning "No detuve el PID $($target.pid): ya no coincide con el servidor esperado."
  }
}
Remove-Item -LiteralPath $statePath -Force

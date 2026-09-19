#requires -Version 7
[CmdletBinding()]
param(
  [ValidateSet('start', 'stop', 'status')]
  [string]$Action = 'start',
  [switch]$Clear
)

$ErrorActionPreference = 'Stop'

$Root = Split-Path $PSScriptRoot -Parent
$EnvFile = Join-Path $Root '.env'
$RunDir = Join-Path $env:LOCALAPPDATA 'chronicle\app'

$Apps = [ordered]@{
  director = @{ Port = 3000; Dir = $Root; Command = 'bun run dev:director' }
  crew     = @{ Port = 0; Dir = $Root; Command = 'bun run dev:crew' }
  stage    = @{ Port = 8082; Dir = (Join-Path $Root 'apps\stage'); Command = if ($Clear) { 'bun run dev:clear' } else { 'bun run dev' } }
}

function Test-Port([int]$Port) {
  if ($Port -eq 0) { return $false }
  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    return $client.ConnectAsync('127.0.0.1', $Port).Wait(700) -and $client.Connected
  } catch {
    return $false
  } finally {
    $client.Dispose()
  }
}

function Show-Status {
  foreach ($name in $Apps.Keys) {
    $port = $Apps[$name].Port
    if ($port -eq 0) {
      '{0}  {1,-9} {2}' -f '  ??', $name, 'no port to probe'
      continue
    }
    '{0}  {1,-9} {2}' -f $(if (Test-Port $port) { 'UP  ' } else { 'DOWN' }), $name, $port
  }
}

function Stop-Apps {
  foreach ($name in $Apps.Keys) {
    $port = $Apps[$name].Port
    if ($port -eq 0) { continue }
    foreach ($line in (netstat -ano | Select-String ":$port\s.*LISTENING")) {
      $target = ($line -split '\s+')[-1]
      if ($target -match '^\d+$') { Stop-Process -Id $target -Force -ErrorAction SilentlyContinue }
    }
  }
  Get-Process bun -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

function Start-Apps {
  if (-not (Test-Path $EnvFile)) { throw "Missing .env at $EnvFile" }
  Stop-Apps
  Start-Sleep -Milliseconds 800
  New-Item -ItemType Directory -Force -Path $RunDir | Out-Null

  $names = @($Apps.Keys)
  $runners = @{}
  foreach ($name in $names) {
    $app = $Apps[$name]
    $runner = Join-Path $RunDir "run-$name.ps1"
    Set-Content -Path $runner -Encoding utf8 -Value @(
      "`$Host.UI.RawUI.WindowTitle = '$name'"
      "Set-Location -LiteralPath '$($app.Dir)'"
      $app.Command
    )
    $runners[$name] = $runner
  }

  $pane = { param($file) @('pwsh', '-NoExit', '-NoProfile', '-File', $file) }

  $paneArgs = @('-w', 'Chronicle', 'new-tab', '--title', 'App') + (& $pane $runners[$names[0]])
  $paneArgs += @(';', 'split-pane', '-V', '-s', '0.5') + (& $pane $runners[$names[1]])
  for ($i = 2; $i -lt $names.Count; $i += 1) {
    $size = [math]::Round(1 - 1 / ($names.Count - $i + 1), 3)
    $paneArgs += @(';', 'focus-pane', '-t', "$($i - 1)")
    $paneArgs += @(';', 'split-pane', '-H', '-s', "$size") + (& $pane $runners[$names[$i]])
  }
  $paneArgs += @(';', 'focus-pane', '-t', '0')

  Start-Process wt -ArgumentList $paneArgs

  "Started: $($names -join ', ')"
  'director 3000, crew has no port, stage 8082 (Metro moved off 8081 to clear the embed server).'
  'Stage serves Android and web from the one Metro instance. -Clear resets the Metro cache.'
  'Panes are interactive. Ctrl+C in a pane stops that app.'
}

switch ($Action) {
  'start' { Start-Apps }
  'stop' { Stop-Apps; 'Stopped app processes.' }
  'status' { Show-Status }
}

#requires -Version 7
[CmdletBinding()]
param(
  [ValidateSet('start', 'stop', 'restart', 'status', 'logs')]
  [string]$Action = 'start',
  [string]$Model = 'G:\AI\MODELS\Qwen3.5_9B\Qwen3.5-9B-The-Defiant-Fable-Uncnr-Heretic-NEO-MAX-Q6_K.gguf',
  [switch]$WithEmbeddings,
  [int]$Tail = 20
)

$ErrorActionPreference = 'Stop'

$Eidolon = 'G:\AI\EIDOLON'
$EmbedModel = "$Eidolon\MODELS\nomic-embed-text-v1.5.Q5_K_M.gguf"
$RunDir = Join-Path $env:LOCALAPPDATA 'chronicle\ai'
$LogDir = Join-Path $RunDir 'logs'

$Services = @(
  @{ Name = 'llm'; Port = 8080; Path = "$Eidolon\LLAMA_CPP"; Managed = $true }
  @{ Name = 'embed'; Port = 8081; Path = "$Eidolon\LLAMA_CPP"; Managed = $true }
  @{ Name = 'comfy'; Port = 8188; Path = "$Eidolon\COMFY_UI"; Managed = $true }
  @{ Name = 'tts'; Port = 8880; Path = "$Eidolon\KOKORO_TTS"; Managed = $true }
  @{ Name = 'redis'; Port = 6379; Path = $null; Managed = $false }
  @{ Name = 'store'; Port = 9000; Path = $null; Managed = $false }
)

function Get-Wanted {
  $Services | Where-Object { $_.Managed -and ($WithEmbeddings -or $_.Name -ne 'embed') }
}

function Test-Port([int]$Port) {
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
  foreach ($service in $Services) {
    $mark = if (Test-Port $service.Port) { 'UP  ' } else { 'DOWN' }
    $kind = if ($service.Managed) { 'managed' } else { 'external' }
    '{0}  {1,-6} {2,-5} {3}' -f $mark, $service.Name, $service.Port, $kind
  }
}

function Show-Logs {
  foreach ($service in $Services | Where-Object { $_.Managed }) {
    "===== $($service.Name) ====="
    foreach ($suffix in '.log', '.log.err') {
      $path = Join-Path $LogDir "$($service.Name)$suffix"
      if ((Test-Path $path) -and (Get-Item $path).Length -gt 0) { Get-Content $path -Tail $Tail }
    }
    ''
  }
}

function Stop-Port([int]$Port) {
  foreach ($line in (netstat -ano | Select-String ":$Port\s.*LISTENING")) {
    $processId = ($line -split '\s+')[-1]
    if ($processId -match '^\d+$') { Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue }
  }
}

function Stop-Servers {
  Get-Process llama-server -ErrorAction SilentlyContinue | Stop-Process -Force
  foreach ($service in $Services | Where-Object { $_.Managed }) { Stop-Port $service.Port }
  foreach ($attempt in 1..12) {
    if (-not ($Services | Where-Object { $_.Managed -and (Test-Port $_.Port) })) { return }
    Start-Sleep -Milliseconds 500
  }
}

function Write-Launcher([string]$Name, [string[]]$Lines) {
  $path = Join-Path $RunDir "$Name.cmd"
  Set-Content -Path $path -Value (@('@echo off') + $Lines) -Encoding ascii
  return $path
}

function Build-Launchers {
  New-Item -ItemType Directory -Force -Path $RunDir, $LogDir | Out-Null
  return @{
    llm   = Write-Launcher 'llm' @(
      "cd /d `"$Eidolon\LLAMA_CPP`""
      "`"$Eidolon\LLAMA_CPP\llama-server.exe`" -m `"$Model`" --host 127.0.0.1 --port 8080 -ngl 99 -c 16384 -fa on -ctk q8_0 -ctv q8_0 --jinja -a chronicle-llm"
    )
    embed = Write-Launcher 'embed' @(
      "cd /d `"$Eidolon\LLAMA_CPP`""
      "`"$Eidolon\LLAMA_CPP\llama-server.exe`" -m `"$EmbedModel`" --host 127.0.0.1 --port 8081 --embeddings -ngl 99 -a chronicle-embed"
    )
    comfy = Write-Launcher 'comfy' @(
      "cd /d `"$Eidolon\COMFY_UI`""
      "`"$Eidolon\COMFY_UI\python_embeded\python.exe`" -s ComfyUI\main.py --windows-standalone-build --port 8188 --fp8_e4m3fn-unet --preview-method taesd --fast fp16_accumulation cublas_ops --reserve-vram 0.8"
    )
    tts   = Write-Launcher 'tts' @(
      "cd /d `"$Eidolon\KOKORO_TTS`""
      'set PYTHONUTF8=1'
      'set USE_GPU=true'
      'set PROJECT_ROOT=%CD%'
      'set PYTHONPATH=%CD%;%CD%\api'
      'set MODEL_DIR=src/models'
      'set VOICES_DIR=src/voices/v1_0'
      'set WEB_PLAYER_PATH=%CD%\web'
      "`"$Eidolon\KOKORO_TTS\.venv\Scripts\python.exe`" -m uvicorn api.src.main:app --host 127.0.0.1 --port 8880"
    )
  }
}

function Start-Servers {
  if (-not (Test-Path $Model)) { throw "LLM model not found: $Model" }
  if ($WithEmbeddings -and -not (Test-Path $EmbedModel)) { throw "Embedding model not found: $EmbedModel" }
  foreach ($service in Get-Wanted) {
    if (-not (Test-Path $service.Path)) { throw "Missing service folder: $($service.Path)" }
  }

  if (Get-Wanted | Where-Object { Test-Port $_.Port }) { Stop-Servers }
  $stuck = Get-Wanted | Where-Object { Test-Port $_.Port }
  if ($stuck) { throw "Could not free ports for: $($stuck.Name -join ', ')" }

  $launchers = Build-Launchers
  foreach ($service in Get-Wanted) {
    $log = Join-Path $LogDir "$($service.Name).log"
    Remove-Item $log, "$log.err" -ErrorAction SilentlyContinue
    Start-Process cmd -ArgumentList '/c', $launchers[$service.Name] `
      -RedirectStandardOutput $log -RedirectStandardError "$log.err" `
      -WindowStyle Hidden | Out-Null
  }

  "Started headless: $((Get-Wanted).Name -join ', ')"
  "Model: $(Split-Path $Model -Leaf)"
  "Logs:  $LogDir"
  'Poll with -Action status, read output with -Action logs.'
}

switch ($Action) {
  'start' { Start-Servers }
  'stop' { Stop-Servers; 'Stopped managed AI services. Dragonfly and storage left running.' }
  'restart' { Stop-Servers; Start-Servers }
  'status' { Show-Status }
  'logs' { Show-Logs }
}

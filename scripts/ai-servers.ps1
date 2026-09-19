#requires -Version 7
[CmdletBinding()]
param(
  [ValidateSet('start', 'stop', 'status')]
  [string]$Action = 'start',
  [string]$Model = 'G:\AI\MODELS\Qwen3.5_9B\Qwen3.5-9B-The-Defiant-Fable-Uncnr-Heretic-NEO-MAX-Q6_K.gguf',
  [switch]$WithEmbeddings
)

$ErrorActionPreference = 'Stop'

$Eidolon = 'G:\AI\EIDOLON'
$EmbedModel = "$Eidolon\MODELS\nomic-embed-text-v1.5.Q5_K_M.gguf"
$LaunchDir = Join-Path $env:TEMP 'chronicle-ai'

$Services = @(
  @{ Name = 'llm'; Port = 8080; Path = "$Eidolon\LLAMA_CPP"; Managed = $true }
  @{ Name = 'comfy'; Port = 8188; Path = "$Eidolon\COMFY_UI"; Managed = $true }
  @{ Name = 'tts'; Port = 8880; Path = "$Eidolon\KOKORO_TTS"; Managed = $true }
  @{ Name = 'redis'; Port = 6379; Path = $null; Managed = $false }
  @{ Name = 'store'; Port = 9000; Path = $null; Managed = $false }
)

function Test-Port([int]$Port) {
  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    $task = $client.ConnectAsync('127.0.0.1', $Port)
    return $task.Wait(700) -and $client.Connected
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

function Stop-Port([int]$Port) {
  foreach ($line in (netstat -ano | Select-String ":$Port\s.*LISTENING")) {
    $processId = ($line -split '\s+')[-1]
    if ($processId -match '^\d+$') { Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue }
  }
}

function Stop-Servers {
  Get-Process llama-server -ErrorAction SilentlyContinue | Stop-Process -Force
  Stop-Port 8188
  Stop-Port 8880
  'Stopped llama.cpp, ComfyUI and Kokoro. Dragonfly and storage were left running.'
}

function Write-Launcher([string]$Name, [string[]]$Lines) {
  $path = Join-Path $LaunchDir "$Name.cmd"
  $body = @('@echo off', "title Chronicle - $Name") + $Lines
  Set-Content -Path $path -Value $body -Encoding ascii
  return $path
}

function Build-Launchers {
  New-Item -ItemType Directory -Force -Path $LaunchDir | Out-Null

  $launchers = [ordered]@{}
  $launchers.status = Write-Launcher 'status' @(
    'echo Chronicle AI stack'
    'echo   llm    8080'
    'echo   embed  8081'
    'echo   comfy  8188'
    'echo   tts    8880'
    'echo.'
    'echo A service pane that exits left something in its log. Scroll that pane.'
  )
  $launchers.llm = Write-Launcher 'llm' @(
    "cd /d `"$Eidolon\LLAMA_CPP`""
    "`"$Eidolon\LLAMA_CPP\llama-server.exe`" -m `"$Model`" --host 127.0.0.1 --port 8080 -ngl 99 -c 16384 -fa on -ctk q8_0 -ctv q8_0 --jinja -a chronicle-llm"
    'pause'
  )
  $launchers.comfy = Write-Launcher 'comfy' @(
    "cd /d `"$Eidolon\COMFY_UI`""
    "`"$Eidolon\COMFY_UI\python_embeded\python.exe`" -s ComfyUI\main.py --windows-standalone-build --port 8188 --fp8_e4m3fn-unet --preview-method taesd --fast fp16_accumulation cublas_ops --reserve-vram 0.8"
    'pause'
  )
  $launchers.tts = Write-Launcher 'tts' @(
    "cd /d `"$Eidolon\KOKORO_TTS`""
    'set PYTHONUTF8=1'
    'set USE_GPU=true'
    'set PROJECT_ROOT=%CD%'
    'set PYTHONPATH=%CD%;%CD%\api'
    'set MODEL_DIR=src/models'
    'set VOICES_DIR=src/voices/v1_0'
    'set WEB_PLAYER_PATH=%CD%\web'
    "`"$Eidolon\KOKORO_TTS\.venv\Scripts\python.exe`" -m uvicorn api.src.main:app --host 127.0.0.1 --port 8880"
    'pause'
  )
  if ($WithEmbeddings) {
    $launchers.embed = Write-Launcher 'embed' @(
      "cd /d `"$Eidolon\LLAMA_CPP`""
      "`"$Eidolon\LLAMA_CPP\llama-server.exe`" -m `"$EmbedModel`" --host 127.0.0.1 --port 8081 --embeddings -ngl 99 -a chronicle-embed"
      'pause'
    )
  }
  return $launchers
}

function Start-Servers {
  if (-not (Test-Path $Model)) { throw "LLM model not found: $Model" }
  foreach ($service in $Services | Where-Object { $_.Path }) {
    if (-not (Test-Path $service.Path)) { throw "Missing service folder: $($service.Path)" }
  }
  if ($WithEmbeddings -and -not (Test-Path $EmbedModel)) {
    throw "Embedding model not found: $EmbedModel"
  }

  $busy = $Services | Where-Object { $_.Managed -and (Test-Port $_.Port) }
  if ($busy) { throw "Already listening: $($busy.Name -join ', '). Run -Action stop first." }

  $launchers = Build-Launchers

  $paneArgs = @('-w', '0', 'new-tab', '--title', 'Chronicle AI', 'cmd', '/k', $launchers.status)
  $paneArgs += @(';', 'split-pane', '-V', 'cmd', '/k', $launchers.llm)
  $paneArgs += @(';', 'split-pane', '-H', 'cmd', '/k', $launchers.comfy)
  $paneArgs += @(';', 'split-pane', '-H', 'cmd', '/k', $launchers.tts)
  if ($WithEmbeddings) { $paneArgs += @(';', 'split-pane', '-H', 'cmd', '/k', $launchers.embed) }

  Start-Process wt -ArgumentList $paneArgs

  $extra = if ($WithEmbeddings) { ', embeddings (8081)' } else { '' }
  "Launched llama.cpp (8080), ComfyUI (8188), Kokoro (8880)$extra."
  "Model: $(Split-Path $Model -Leaf)"
  "Launchers written to $LaunchDir"
  'The LLM takes a minute or two to load. Poll: scripts\ai-servers.ps1 -Action status'
}

switch ($Action) {
  'start' { Start-Servers }
  'stop' { Stop-Servers }
  'status' { Show-Status }
}

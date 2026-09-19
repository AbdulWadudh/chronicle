#requires -Version 7
[CmdletBinding()]
param(
  [ValidateSet('start', 'stop', 'status', 'logs')]
  [string]$Action = 'start',
  [string]$Model = 'G:\AI\MODELS\Qwen3.5_9B\Qwen3.5-9B-The-Defiant-Fable-Uncnr-Heretic-NEO-MAX-Q6_K.gguf',
  [switch]$WithEmbeddings,
  [switch]$NoWindow,
  [int]$Tail = 30,
  [string]$AiRoot = 'G:\AI\EIDOLON',
  [int]$Context = 32768,
  [string]$CacheKey = 'q8_0',
  [string]$CacheValue = 'q8_0'
)

$ErrorActionPreference = 'Stop'

$RunDir = Join-Path $env:LOCALAPPDATA 'chronicle\ai'
$LogDir = Join-Path $RunDir 'logs'
$Llama = "$AiRoot\LLAMA_CPP\llama-server.exe"
$EmbedModel = "$AiRoot\MODELS\nomic-embed-text-v1.5.Q5_K_M.gguf"

$Services = [ordered]@{
  llm   = @{
    Port    = 8080
    Command = "`"$Llama`" -m `"$Model`" --host 127.0.0.1 --port 8080 -ngl 99 -c $Context -fa on -ctk $CacheKey -ctv $CacheValue --jinja -a chronicle-llm"
  }
  embed = @{
    Port    = 8081
    Command = "`"$Llama`" -m `"$EmbedModel`" --host 127.0.0.1 --port 8081 --embeddings -ngl 99 -a chronicle-embed"
  }
  comfy = @{
    Port    = 8188
    Command = "cd /d `"$AiRoot\COMFY_UI`" && `"$AiRoot\COMFY_UI\python_embeded\python.exe`" -s ComfyUI\main.py --windows-standalone-build --disable-auto-launch --port 8188 --fp8_e4m3fn-unet --preview-method taesd --fast fp16_accumulation cublas_ops --reserve-vram 0.8"
  }
  tts   = @{
    Port    = 8880
    Command = "cd /d `"$AiRoot\KOKORO_TTS`" && set PYTHONUTF8=1&& set USE_GPU=true&& set PROJECT_ROOT=%CD%&& set PYTHONPATH=%CD%;%CD%\api&& set MODEL_DIR=src/models&& set VOICES_DIR=src/voices/v1_0&& set WEB_PLAYER_PATH=%CD%\web&& `"$AiRoot\KOKORO_TTS\.venv\Scripts\python.exe`" -m uvicorn api.src.main:app --host 127.0.0.1 --port 8880"
  }
}

function Get-Names {
  $Services.Keys | Where-Object { $WithEmbeddings -or $_ -ne 'embed' }
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
  foreach ($name in $Services.Keys) {
    $mark = if (Test-Port $Services[$name].Port) { 'UP  ' } else { 'DOWN' }
    '{0}  {1,-6} {2}' -f $mark, $name, $Services[$name].Port
  }
}

function Show-Logs {
  foreach ($name in $Services.Keys) {
    $log = Join-Path $LogDir "$name.log"
    "===== $name ====="
    if (Test-Path $log) { Get-Content $log -Tail $Tail } else { '(no log)' }
    ''
  }
}

function Stop-Servers {
  Get-Process llama-server -ErrorAction SilentlyContinue | Stop-Process -Force
  foreach ($round in 1..3) {
    $held = @($Services.Keys | Where-Object { Test-Port $Services[$_].Port })
    if ($held.Count -eq 0) { return }
    foreach ($name in $held) {
      $port = $Services[$name].Port
      foreach ($line in (netstat -ano | Select-String ":$port\s.*LISTENING")) {
        $target = ($line -split '\s+')[-1]
        if ($target -match '^\d+$') { Stop-Process -Id $target -Force -ErrorAction SilentlyContinue }
      }
    }
    foreach ($attempt in 1..20) {
      if (-not ($Services.Keys | Where-Object { Test-Port $Services[$_].Port })) { return }
      Start-Sleep -Milliseconds 500
    }
  }
}

function Open-LogWindow {
  $names = @(Get-Names)
  $tailers = @{}
  foreach ($name in $names) {
    $tailer = Join-Path $RunDir "tail-$name.ps1"
    Set-Content -Path $tailer -Encoding utf8 -Value @(
      "`$Host.UI.RawUI.WindowTitle = '$name'"
      "Get-Content -LiteralPath '$LogDir\$name.log' -Wait -Tail $Tail"
    )
    $tailers[$name] = $tailer
  }

  $stack = @('llm', 'embed', 'tts') | Where-Object { $names -contains $_ }
  $pane = { param($file) @('pwsh', '-NoExit', '-NoProfile', '-File', $file) }

  $paneArgs = @('-w', 'Chronicle', 'new-tab', '--title', 'AI') + (& $pane $tailers['comfy'])
  $paneArgs += @(';', 'split-pane', '-V', '-s', '0.5') + (& $pane $tailers[$stack[0]])
  for ($i = 1; $i -lt $stack.Count; $i += 1) {
    $size = [math]::Round(1 - 1 / ($stack.Count - $i + 1), 3)
    $paneArgs += @(';', 'focus-pane', '-t', "$i")
    $paneArgs += @(';', 'split-pane', '-H', '-s', "$size") + (& $pane $tailers[$stack[$i]])
  }
  $paneArgs += @(';', 'focus-pane', '-t', '0')

  Start-Process wt -ArgumentList $paneArgs
}

function Start-Servers {
  if (-not (Test-Path $Model)) { throw "Model not found: $Model" }
  if ($WithEmbeddings -and -not (Test-Path $EmbedModel)) { throw "Model not found: $EmbedModel" }

  Stop-Servers
  $stuck = @(Get-Names | Where-Object { Test-Port $Services[$_].Port })
  if ($stuck.Count -gt 0) { throw "Port still busy: $($stuck -join ', ')" }

  New-Item -ItemType Directory -Force -Path $RunDir, $LogDir | Out-Null

  foreach ($name in Get-Names) {
    $log = Join-Path $LogDir "$name.log"
    $runner = Join-Path $RunDir "$name.cmd"
    Set-Content -Path $runner -Encoding ascii -Value @(
      '@echo off'
      "$($Services[$name].Command) > `"$log`" 2>&1"
    )
    Set-Content -Path $log -Value '' -NoNewline
    Start-Process cmd -ArgumentList '/c', $runner -WindowStyle Hidden | Out-Null
  }

  if (-not $NoWindow) { Open-LogWindow }

  "Started: $((Get-Names) -join ', ')"
  "Model:   $(Split-Path $Model -Leaf)  ctx=$Context kv=$CacheKey/$CacheValue"
  "Logs:    $LogDir"
}

switch ($Action) {
  'start' { Start-Servers }
  'stop' { Stop-Servers; 'Stopped.' }
  'status' { Show-Status }
  'logs' { Show-Logs }
}

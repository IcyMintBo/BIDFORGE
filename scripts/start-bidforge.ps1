param(
  [switch]$NoOpen
)

$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$FrontendUrl = "http://127.0.0.1:5186"
$RunnerHealthUrl = "http://127.0.0.1:8787/api/health"

function Test-HttpReady {
  param([string]$Url)

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
    return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500)
  } catch {
    return $false
  }
}

function Wait-HttpReady {
  param(
    [string]$Name,
    [string]$Url,
    [int]$TimeoutSeconds = 45
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-HttpReady -Url $Url) {
      Write-Host "$Name ready: $Url" -ForegroundColor Green
      return $true
    }

    Start-Sleep -Milliseconds 700
  }

  Write-Host "$Name not ready after $TimeoutSeconds seconds: $Url" -ForegroundColor Yellow
  return $false
}

function Start-CmdWindow {
  param(
    [string]$Title,
    [string]$Command
  )

  $cmdLine = "start `"$Title`" /D `"$Root`" cmd.exe /k `"$Command`""
  & $env:ComSpec /c $cmdLine
}

function Open-Browser {
  param([string]$Url)

  & $env:ComSpec /c "start `"`" `"$Url`""
}

Write-Host "BIDFORGE local launcher" -ForegroundColor Cyan
Write-Host "Project root: $Root"
Write-Host ""

if (-not (Test-Path (Join-Path $Root "package.json"))) {
  throw "package.json was not found. Make sure this launcher is inside the BIDFORGE project root."
}

if (-not (Test-Path (Join-Path $Root "node_modules"))) {
  Write-Host "node_modules was not found. Run npm install first." -ForegroundColor Yellow
  throw "Dependencies are not installed."
}

if (Test-HttpReady -Url $RunnerHealthUrl) {
  Write-Host "Runner API is already running: $RunnerHealthUrl" -ForegroundColor Green
} else {
  Write-Host "Starting Runner API: npm run server" -ForegroundColor Cyan
  Start-CmdWindow -Title "BIDFORGE Runner API - 8787" -Command "npm run server"
}

if (Test-HttpReady -Url $FrontendUrl) {
  Write-Host "Frontend is already running: $FrontendUrl" -ForegroundColor Green
} else {
  Write-Host "Starting frontend: npm run dev -- --port 5186 --strictPort" -ForegroundColor Cyan
  Start-CmdWindow -Title "BIDFORGE Frontend - 5186" -Command "npm run dev -- --port 5186 --strictPort"
}

$runnerReady = Wait-HttpReady -Name "Runner API" -Url $RunnerHealthUrl -TimeoutSeconds 45
$frontendReady = Wait-HttpReady -Name "Frontend" -Url $FrontendUrl -TimeoutSeconds 45

if (-not $runnerReady -or -not $frontendReady) {
  Write-Host ""
  Write-Host "BIDFORGE did not fully start. Check the two terminal windows for errors." -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "BIDFORGE is ready:" -ForegroundColor Green
Write-Host $FrontendUrl -ForegroundColor Green

if (-not $NoOpen) {
  Open-Browser -Url $FrontendUrl
}

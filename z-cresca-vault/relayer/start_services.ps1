# Start Privacy Cash Card Payment System (Windows)
# This script starts both the Python relayer and Privacy Cash SDK service

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🔐 Privacy Cash Card Payment System" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found. Please install Node.js 24+" -ForegroundColor Red
    exit 1
}

# Check if Python is installed
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python not found. Please install Python 3.10+" -ForegroundColor Red
    exit 1
}

$nodeVersion = (node --version) -replace 'v', '' -split '\.' | Select-Object -First 1
if ([int]$nodeVersion -lt 24) {
    Write-Host "❌ Node.js 24+ required (found: v$nodeVersion)" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js $(node --version)" -ForegroundColor Green
Write-Host "✅ Python $(python --version)" -ForegroundColor Green
Write-Host ""

# Install Node.js dependencies
Write-Host "📦 Installing Privacy Cash SDK..." -ForegroundColor Yellow
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath
npm install privacycash @solana/web3.js express dotenv 2>$null
Write-Host "   ✅ Dependencies ready" -ForegroundColor Green
Write-Host ""

# Start Privacy Cash Service
Write-Host "🚀 Starting Privacy Cash Service (port 8081)..." -ForegroundColor Yellow
$privacyJob = Start-Job -ScriptBlock {
    Set-Location $using:scriptPath
    node privacy_cash_service.mjs
}
Write-Host "   Job ID: $($privacyJob.Id)" -ForegroundColor Gray

# Wait for service to start
Start-Sleep -Seconds 3

# Check if Privacy Cash Service is running
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8081/health" -TimeoutSec 5 -UseBasicParsing
    Write-Host "   ✅ Privacy Cash Service ready" -ForegroundColor Green
} catch {
    Write-Host "❌ Privacy Cash Service failed to start" -ForegroundColor Red
    Stop-Job $privacyJob
    Remove-Job $privacyJob
    exit 1
}
Write-Host ""

# Start Python Relayer
Write-Host "🚀 Starting Python Payment Relayer (port 8080)..." -ForegroundColor Yellow
$relayerJob = Start-Job -ScriptBlock {
    Set-Location $using:scriptPath
    python payment_relayer.py
}
Write-Host "   Job ID: $($relayerJob.Id)" -ForegroundColor Gray
Write-Host ""

# Wait for relayer to start
Start-Sleep -Seconds 3

# Check if relayer is running
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8080/health" -TimeoutSec 5 -UseBasicParsing
    Write-Host "   ✅ Payment Relayer ready" -ForegroundColor Green
} catch {
    Write-Host "❌ Payment Relayer failed to start" -ForegroundColor Red
    Stop-Job $privacyJob, $relayerJob
    Remove-Job $privacyJob, $relayerJob
    exit 1
}
Write-Host ""

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ System Ready!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services running:" -ForegroundColor White
Write-Host "  • Privacy Cash SDK:    http://127.0.0.1:8081" -ForegroundColor Gray
Write-Host "  • Payment Relayer:     http://127.0.0.1:8080" -ForegroundColor Gray
Write-Host ""
Write-Host "API Endpoints:" -ForegroundColor White
Write-Host "  POST /api/v1/payment              - Process card payment" -ForegroundColor Gray
Write-Host "  POST /api/v1/card/register        - Register NFC card" -ForegroundColor Gray
Write-Host "  GET  /health                      - Health check" -ForegroundColor Gray
Write-Host ""
Write-Host "💳 Ready to process private card payments!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop both services" -ForegroundColor Yellow
Write-Host ""

# Monitor jobs
try {
    while ($true) {
        $privacyState = (Get-Job $privacyJob).State
        $relayerState = (Get-Job $relayerJob).State
        
        if ($privacyState -ne "Running" -or $relayerState -ne "Running") {
            Write-Host "⚠️ Service stopped unexpectedly" -ForegroundColor Yellow
            break
        }
        
        Start-Sleep -Seconds 5
    }
} finally {
    Write-Host ""
    Write-Host "🛑 Shutting down services..." -ForegroundColor Yellow
    Stop-Job $privacyJob, $relayerJob -ErrorAction SilentlyContinue
    Remove-Job $privacyJob, $relayerJob -ErrorAction SilentlyContinue
    Write-Host "   ✅ Services stopped" -ForegroundColor Green
}

# Start Backend Server with Firewall Configuration
# Run this as Administrator

Write-Host "🚀 Z-Cresca Backend Startup Script" -ForegroundColor Cyan
Write-Host "=" * 60

# Get local IP
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*"} | Select-Object -First 1).IPAddress
Write-Host "📍 Your PC IP: $localIP" -ForegroundColor Green

# Check if port 8080 is in use
$port8080 = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($port8080) {
    Write-Host "⚠️  Port 8080 is already in use by PID: $($port8080.OwningProcess)" -ForegroundColor Yellow
    $response = Read-Host "Kill this process? (Y/N)"
    if ($response -eq 'Y') {
        Stop-Process -Id $port8080.OwningProcess -Force
        Write-Host "✅ Killed process $($port8080.OwningProcess)" -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
}

# Add firewall rules
Write-Host "`n🔥 Adding Windows Firewall rules..." -ForegroundColor Cyan

try {
    # Remove old rules if they exist
    Remove-NetFirewallRule -DisplayName "Z-Cresca Backend 8080" -ErrorAction SilentlyContinue
    Remove-NetFirewallRule -DisplayName "Z-Cresca Backend 8081" -ErrorAction SilentlyContinue
    
    # Add new rules
    New-NetFirewallRule -DisplayName "Z-Cresca Backend 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow -Profile Any | Out-Null
    New-NetFirewallRule -DisplayName "Z-Cresca Backend 8081" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow -Profile Any | Out-Null
    
    Write-Host "✅ Firewall rules added successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to add firewall rules. Run as Administrator!" -ForegroundColor Red
    Write-Host "   Right-click PowerShell → Run as Administrator" -ForegroundColor Yellow
    exit 1
}

# Check Python
Write-Host "`n🐍 Checking Python..." -ForegroundColor Cyan
$pythonVersion = python --version 2>&1
Write-Host "   $pythonVersion" -ForegroundColor Gray

# Navigate to relayer directory
Set-Location $PSScriptRoot

Write-Host "`n📱 Device Connection Instructions:" -ForegroundColor Cyan
Write-Host "1. Connect your device to the same WiFi network" -ForegroundColor White
Write-Host "2. In Rypon/src/services/api.ts, set:" -ForegroundColor White
Write-Host "   LOCAL_NETWORK_IP = '$localIP'" -ForegroundColor Yellow
Write-Host "3. Test from device browser:" -ForegroundColor White
Write-Host "   http://$localIP:8080/health" -ForegroundColor Yellow
Write-Host "4. Reload React Native app (press 'r' in Metro bundler)" -ForegroundColor White

Write-Host "`n🌐 Starting Backend Server..." -ForegroundColor Cyan
Write-Host "   Server will run on: http://0.0.0.0:8080" -ForegroundColor Green
Write-Host "   Access from device: http://$localIP:8080" -ForegroundColor Green
Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host "=" * 60

# Start the backend
python payment_relayer.py

# Script to start Cloudflare Tunnels
# Starts tunnels for Backend, Mini App and Dashboard

Write-Host "=== Starting Cloudflare Tunnels ===" -ForegroundColor Cyan
Write-Host ""

# Check if cloudflared is installed
$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflared) {
    Write-Host "ERROR: cloudflared not found!" -ForegroundColor Red
    Write-Host "Install cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/" -ForegroundColor Yellow
    exit 1
}

Write-Host "OK: cloudflared found" -ForegroundColor Green
Write-Host ""

# Start tunnels in separate windows
Write-Host "Starting tunnels..." -ForegroundColor Yellow
Write-Host ""

# Backend (port 3002)
Write-Host "Backend Tunnel (port 3002)..." -ForegroundColor Cyan
$backendCmd = "Write-Host '=== Cloudflare Tunnel: Backend (port 3002) ===' -ForegroundColor Cyan; Write-Host ''; Write-Host 'Waiting for backend to start...' -ForegroundColor Yellow; Write-Host 'After backend starts, tunnel will be available at HTTPS URL' -ForegroundColor Gray; Write-Host ''; cloudflared tunnel --url http://localhost:3002"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

Start-Sleep -Seconds 2

# Mini App (port 5173)
Write-Host "Mini App Tunnel (port 5173)..." -ForegroundColor Cyan
$miniAppCmd = "Write-Host '=== Cloudflare Tunnel: Mini App (port 5173) ===' -ForegroundColor Cyan; Write-Host ''; Write-Host 'Waiting for Mini App to start...' -ForegroundColor Yellow; Write-Host 'After Mini App starts, tunnel will be available at HTTPS URL' -ForegroundColor Gray; Write-Host ''; cloudflared tunnel --url http://localhost:5173"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $miniAppCmd

Start-Sleep -Seconds 2

# Dashboard (port 3000)
Write-Host "Dashboard Tunnel (port 3000)..." -ForegroundColor Cyan
$dashboardCmd = "Write-Host '=== Cloudflare Tunnel: Dashboard (port 3000) ===' -ForegroundColor Cyan; Write-Host ''; Write-Host 'Waiting for Dashboard to start...' -ForegroundColor Yellow; Write-Host 'After Dashboard starts, tunnel will be available at HTTPS URL' -ForegroundColor Gray; Write-Host ''; cloudflared tunnel --url http://localhost:3000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $dashboardCmd

Write-Host ""
Write-Host "OK: Tunnels started in separate windows" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy HTTPS URL from each tunnel window" -ForegroundColor White
Write-Host "2. Update .env files:" -ForegroundColor White
Write-Host "   - apps/telegram-bot/.env: API_URL=https://backend-tunnel-url/api" -ForegroundColor Gray
Write-Host "   - apps/telegram-bot/.env: MINI_APP_URL=https://mini-app-tunnel-url" -ForegroundColor Gray
Write-Host "   - apps/mini-app/.env: VITE_API_URL=https://backend-tunnel-url/api" -ForegroundColor Gray
Write-Host "   - apps/web-dashboard/.env.local: NEXT_PUBLIC_API_URL=https://backend-tunnel-url/api" -ForegroundColor Gray
Write-Host ""
Write-Host "Or use script: .\scripts\update-env-from-tunnels.ps1" -ForegroundColor Cyan

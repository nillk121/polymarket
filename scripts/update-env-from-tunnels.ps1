# Script to update .env files with Cloudflare Tunnel URLs
# Prompts user for tunnel URLs and updates the relevant .env files

Write-Host "=== Update .env files with Cloudflare Tunnel URLs ===" -ForegroundColor Cyan
Write-Host ""

# Prompt for Backend tunnel URL
Write-Host "Enter Backend Tunnel URL (for port 3002):" -ForegroundColor Yellow
Write-Host "Example: https://example.trycloudflare.com" -ForegroundColor Gray
$backendUrl = Read-Host "Backend URL"
if ($backendUrl -and -not $backendUrl.StartsWith("http")) {
    $backendUrl = "https://$backendUrl"
}
$backendApiUrl = "$backendUrl/api"

# Prompt for Mini App tunnel URL
Write-Host ""
Write-Host "Enter Mini App Tunnel URL (for port 5173):" -ForegroundColor Yellow
Write-Host "Example: https://example.trycloudflare.com" -ForegroundColor Gray
$miniAppUrl = Read-Host "Mini App URL"
if ($miniAppUrl -and -not $miniAppUrl.StartsWith("http")) {
    $miniAppUrl = "https://$miniAppUrl"
}

# Prompt for Dashboard tunnel URL (optional)
Write-Host ""
Write-Host "Enter Dashboard Tunnel URL (for port 3000, optional):" -ForegroundColor Yellow
Write-Host "Example: https://example.trycloudflare.com" -ForegroundColor Gray
$dashboardUrl = Read-Host "Dashboard URL (press Enter to skip)"
if ($dashboardUrl -and -not $dashboardUrl.StartsWith("http")) {
    $dashboardUrl = "https://$dashboardUrl"
}
$dashboardApiUrl = "$dashboardUrl/api"

Write-Host ""
Write-Host "Updating .env files..." -ForegroundColor Yellow

# Update telegram-bot/.env
$telegramBotEnv = "apps/telegram-bot/.env"
if (Test-Path $telegramBotEnv) {
    $content = Get-Content $telegramBotEnv -Raw
    if ($content -match "API_URL=") {
        $content = $content -replace "API_URL=.*", "API_URL=$backendApiUrl"
    } else {
        $content += "`nAPI_URL=$backendApiUrl`n"
    }
    if ($content -match "MINI_APP_URL=") {
        $content = $content -replace "MINI_APP_URL=.*", "MINI_APP_URL=$miniAppUrl"
    } else {
        $content += "MINI_APP_URL=$miniAppUrl`n"
    }
    Set-Content -Path $telegramBotEnv -Value $content -NoNewline
    Write-Host "  Updated: $telegramBotEnv" -ForegroundColor Green
} else {
    $content = "API_URL=$backendApiUrl`nMINI_APP_URL=$miniAppUrl`n"
    Set-Content -Path $telegramBotEnv -Value $content
    Write-Host "  Created: $telegramBotEnv" -ForegroundColor Green
}

# Update mini-app/.env
$miniAppEnv = "apps/mini-app/.env"
if (Test-Path $miniAppEnv) {
    $content = Get-Content $miniAppEnv -Raw
    if ($content -match "VITE_API_URL=") {
        $content = $content -replace "VITE_API_URL=.*", "VITE_API_URL=$backendApiUrl"
    } else {
        $content += "`nVITE_API_URL=$backendApiUrl`n"
    }
    Set-Content -Path $miniAppEnv -Value $content -NoNewline
    Write-Host "  Updated: $miniAppEnv" -ForegroundColor Green
} else {
    $content = "VITE_API_URL=$backendApiUrl`n"
    Set-Content -Path $miniAppEnv -Value $content
    Write-Host "  Created: $miniAppEnv" -ForegroundColor Green
}

# Update web-dashboard/.env.local
if ($dashboardUrl) {
    $dashboardEnv = "apps/web-dashboard/.env.local"
    if (Test-Path $dashboardEnv) {
        $content = Get-Content $dashboardEnv -Raw
        if ($content -match "NEXT_PUBLIC_API_URL=") {
            $content = $content -replace "NEXT_PUBLIC_API_URL=.*", "NEXT_PUBLIC_API_URL=$backendApiUrl"
        } else {
            $content += "`nNEXT_PUBLIC_API_URL=$backendApiUrl`n"
        }
        Set-Content -Path $dashboardEnv -Value $content -NoNewline
        Write-Host "  Updated: $dashboardEnv" -ForegroundColor Green
    } else {
        $content = "NEXT_PUBLIC_API_URL=$backendApiUrl`n"
        Set-Content -Path $dashboardEnv -Value $content
        Write-Host "  Created: $dashboardEnv" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "OK: All .env files updated!" -ForegroundColor Green
Write-Host ""
Write-Host "Updated URLs:" -ForegroundColor Cyan
Write-Host "  Backend API: $backendApiUrl" -ForegroundColor White
Write-Host "  Mini App: $miniAppUrl" -ForegroundColor White
if ($dashboardUrl) {
    Write-Host "  Dashboard: $dashboardUrl" -ForegroundColor White
}
Write-Host ""
Write-Host "Restart your applications to apply changes!" -ForegroundColor Yellow

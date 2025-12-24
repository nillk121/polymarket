# Автоматическое обновление .env файлов с URL туннелей
# URL из вывода cloudflared

$backendUrl = "https://europe-willow-delegation-enjoyed.trycloudflare.com"
$miniAppUrl = "https://speaking-grande-prospective-bookmarks.trycloudflare.com"
$dashboardUrl = "https://bookmark-fell-fitness-trial.trycloudflare.com"

Write-Host "=== Обновление .env файлов ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend: $backendUrl" -ForegroundColor Green
Write-Host "Mini App: $miniAppUrl" -ForegroundColor Green
Write-Host "Dashboard: $dashboardUrl" -ForegroundColor Green
Write-Host ""

# Обновление apps/telegram-bot/.env
$telegramBotEnv = "apps/telegram-bot/.env"
$apiUrl = "$backendUrl/api"

if (-not (Test-Path $telegramBotEnv)) {
    # Создаем из .env.example если есть
    if (Test-Path "apps/telegram-bot/.env.example") {
        Copy-Item "apps/telegram-bot/.env.example" $telegramBotEnv
    } else {
        New-Item -Path $telegramBotEnv -ItemType File -Force | Out-Null
    }
}

$content = if (Test-Path $telegramBotEnv) { Get-Content $telegramBotEnv -Raw } else { "" }

# Обновляем или добавляем API_URL
if ($content -match "(?m)^API_URL=.*") {
    $content = $content -replace "(?m)^API_URL=.*", "API_URL=$apiUrl"
} else {
    if ($content -and -not $content.EndsWith("`n")) { $content += "`n" }
    $content += "API_URL=$apiUrl`n"
}

# Обновляем или добавляем MINI_APP_URL
if ($content -match "(?m)^MINI_APP_URL=.*") {
    $content = $content -replace "(?m)^MINI_APP_URL=.*", "MINI_APP_URL=$miniAppUrl"
} else {
    if ($content -and -not $content.EndsWith("`n")) { $content += "`n" }
    $content += "MINI_APP_URL=$miniAppUrl`n"
}

Set-Content -Path $telegramBotEnv -Value $content -NoNewline
Write-Host "✅ Обновлен $telegramBotEnv" -ForegroundColor Green

# Обновление apps/mini-app/.env
$miniAppEnv = "apps/mini-app/.env"

if (-not (Test-Path $miniAppEnv)) {
    New-Item -Path $miniAppEnv -ItemType File -Force | Out-Null
}

$content = if (Test-Path $miniAppEnv) { Get-Content $miniAppEnv -Raw } else { "" }

if ($content -match "(?m)^VITE_API_URL=.*") {
    $content = $content -replace "(?m)^VITE_API_URL=.*", "VITE_API_URL=$apiUrl"
} else {
    if ($content -and -not $content.EndsWith("`n")) { $content += "`n" }
    $content += "VITE_API_URL=$apiUrl`n"
}

Set-Content -Path $miniAppEnv -Value $content -NoNewline
Write-Host "✅ Обновлен $miniAppEnv" -ForegroundColor Green

# Обновление apps/web-dashboard/.env.local
$dashboardEnv = "apps/web-dashboard/.env.local"

if (-not (Test-Path $dashboardEnv)) {
    New-Item -Path $dashboardEnv -ItemType File -Force | Out-Null
}

$content = if (Test-Path $dashboardEnv) { Get-Content $dashboardEnv -Raw } else { "" }

if ($content -match "(?m)^NEXT_PUBLIC_API_URL=.*") {
    $content = $content -replace "(?m)^NEXT_PUBLIC_API_URL=.*", "NEXT_PUBLIC_API_URL=$apiUrl"
} else {
    if ($content -and -not $content.EndsWith("`n")) { $content += "`n" }
    $content += "NEXT_PUBLIC_API_URL=$apiUrl`n"
}

Set-Content -Path $dashboardEnv -Value $content -NoNewline
Write-Host "✅ Обновлен $dashboardEnv" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Все файлы обновлены!" -ForegroundColor Green
Write-Host ""
Write-Host "Обновленные значения:" -ForegroundColor Yellow
Write-Host "  API_URL=$apiUrl" -ForegroundColor Gray
Write-Host "  MINI_APP_URL=$miniAppUrl" -ForegroundColor Gray
Write-Host "  NEXT_PUBLIC_API_URL=$apiUrl" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Перезапустите приложения для применения изменений" -ForegroundColor Cyan


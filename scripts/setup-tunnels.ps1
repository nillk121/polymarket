# Скрипт для автоматической настройки Cloudflare Tunnels
# Запустите этот скрипт для получения HTTPS URL и обновления .env файлов

Write-Host "🌐 Настройка Cloudflare Tunnels для HTTPS" -ForegroundColor Cyan
Write-Host ""

# Проверка установки cloudflared
Write-Host "Проверка cloudflared..." -ForegroundColor Yellow
$cloudflaredVersion = cloudflared --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ cloudflared не установлен!" -ForegroundColor Red
    Write-Host "Установите: npm install -g cloudflared" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ cloudflared установлен: $cloudflaredVersion" -ForegroundColor Green
Write-Host ""

# Запуск туннелей в фоне
Write-Host "Запуск туннелей..." -ForegroundColor Yellow

# Backend туннель
Write-Host "  → Backend (порт 3002)..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    $process = Start-Process -FilePath "cloudflared" -ArgumentList "tunnel","--url","http://localhost:3002" -NoNewWindow -RedirectStandardOutput "$env:TEMP\cloudflared-backend.log" -RedirectStandardError "$env:TEMP\cloudflared-backend-error.log" -PassThru
    Start-Sleep -Seconds 5
    $log = Get-Content "$env:TEMP\cloudflared-backend.log" -ErrorAction SilentlyContinue
    $url = $log | Select-String -Pattern "https://[^\s]+" | Select-Object -First 1
    if ($url) {
        return $url.Matches[0].Value
    }
    return $null
}

# Mini App туннель
Write-Host "  → Mini App (порт 5173)..." -ForegroundColor Cyan
$miniappJob = Start-Job -ScriptBlock {
    $process = Start-Process -FilePath "cloudflared" -ArgumentList "tunnel","--url","http://localhost:5173" -NoNewWindow -RedirectStandardOutput "$env:TEMP\cloudflared-miniapp.log" -RedirectStandardError "$env:TEMP\cloudflared-miniapp-error.log" -PassThru
    Start-Sleep -Seconds 5
    $log = Get-Content "$env:TEMP\cloudflared-miniapp.log" -ErrorAction SilentlyContinue
    $url = $log | Select-String -Pattern "https://[^\s]+" | Select-Object -First 1
    if ($url) {
        return $url.Matches[0].Value
    }
    return $null
}

# Dashboard туннель
Write-Host "  → Dashboard (порт 3001)..." -ForegroundColor Cyan
$dashboardJob = Start-Job -ScriptBlock {
    $process = Start-Process -FilePath "cloudflared" -ArgumentList "tunnel","--url","http://localhost:3001" -NoNewWindow -RedirectStandardOutput "$env:TEMP\cloudflared-dashboard.log" -RedirectStandardError "$env:TEMP\cloudflared-dashboard-error.log" -PassThru
    Start-Sleep -Seconds 5
    $log = Get-Content "$env:TEMP\cloudflared-dashboard.log" -ErrorAction SilentlyContinue
    $url = $log | Select-String -Pattern "https://[^\s]+" | Select-Object -First 1
    if ($url) {
        return $url.Matches[0].Value
    }
    return $null
}

Write-Host ""
Write-Host "⏳ Ожидание запуска туннелей (10 секунд)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Получение URL из логов
Write-Host ""
Write-Host "Получение URL..." -ForegroundColor Yellow

$backendUrl = $null
$miniappUrl = $null
$dashboardUrl = $null

# Попытка получить URL из логов
$backendLog = Get-Content "$env:TEMP\cloudflared-backend.log" -ErrorAction SilentlyContinue
if ($backendLog) {
    $backendMatch = $backendLog | Select-String -Pattern "https://[^\s]+\.trycloudflare\.com" | Select-Object -First 1
    if ($backendMatch) {
        $backendUrl = $backendMatch.Matches[0].Value
    }
}

$miniappLog = Get-Content "$env:TEMP\cloudflared-miniapp.log" -ErrorAction SilentlyContinue
if ($miniappLog) {
    $miniappMatch = $miniappLog | Select-String -Pattern "https://[^\s]+\.trycloudflare\.com" | Select-Object -First 1
    if ($miniappMatch) {
        $miniappUrl = $miniappMatch.Matches[0].Value
    }
}

$dashboardLog = Get-Content "$env:TEMP\cloudflared-dashboard.log" -ErrorAction SilentlyContinue
if ($dashboardLog) {
    $dashboardMatch = $dashboardLog | Select-String -Pattern "https://[^\s]+\.trycloudflare\.com" | Select-Object -First 1
    if ($dashboardMatch) {
        $dashboardUrl = $dashboardMatch.Matches[0].Value
    }
}

# Если не получилось из логов, попробуем другой способ
if (-not $backendUrl -or -not $miniappUrl) {
    Write-Host ""
    Write-Host "⚠️  Не удалось автоматически получить URL из логов" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Пожалуйста, запустите туннели вручную в отдельных терминалах:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Терминал 1 (Backend):" -ForegroundColor Yellow
    Write-Host "  cloudflared tunnel --url http://localhost:3002" -ForegroundColor White
    Write-Host ""
    Write-Host "Терминал 2 (Mini App):" -ForegroundColor Yellow
    Write-Host "  cloudflared tunnel --url http://localhost:5173" -ForegroundColor White
    Write-Host ""
    Write-Host "Терминал 3 (Dashboard):" -ForegroundColor Yellow
    Write-Host "  cloudflared tunnel --url http://localhost:3001" -ForegroundColor White
    Write-Host ""
    Write-Host "Скопируйте полученные HTTPS URL и вставьте ниже:" -ForegroundColor Cyan
    Write-Host ""
    
    $backendUrl = Read-Host "Backend HTTPS URL (например: https://abc123.trycloudflare.com)"
    $miniappUrl = Read-Host "Mini App HTTPS URL (например: https://def456.trycloudflare.com)"
    $dashboardUrl = Read-Host "Dashboard HTTPS URL (например: https://ghi789.trycloudflare.com) [опционально]"
}

if ($backendUrl -and $miniappUrl) {
    Write-Host ""
    Write-Host "✅ Получены URL:" -ForegroundColor Green
    Write-Host "  Backend:  $backendUrl" -ForegroundColor Cyan
    Write-Host "  Mini App: $miniappUrl" -ForegroundColor Cyan
    if ($dashboardUrl) {
        Write-Host "  Dashboard: $dashboardUrl" -ForegroundColor Cyan
    }
    Write-Host ""
    
    # Обновление .env файлов
    Write-Host "Обновление .env файлов..." -ForegroundColor Yellow
    
    # Backend .env
    $backendEnvPath = "apps\backend\.env"
    if (Test-Path $backendEnvPath) {
        $backendEnv = Get-Content $backendEnvPath -Raw
        if ($dashboardUrl) {
            $corsOrigin = "$miniappUrl,$dashboardUrl"
        } else {
            $corsOrigin = $miniappUrl
        }
        if ($backendEnv -match "CORS_ORIGIN=") {
            $backendEnv = $backendEnv -replace "CORS_ORIGIN=.*", "CORS_ORIGIN=$corsOrigin"
        } else {
            $backendEnv += "`nCORS_ORIGIN=$corsOrigin"
        }
        Set-Content -Path $backendEnvPath -Value $backendEnv -NoNewline
        Write-Host "  ✅ Обновлен $backendEnvPath" -ForegroundColor Green
    }
    
    # Telegram Bot .env
    $botEnvPath = "apps\telegram-bot\.env"
    if (Test-Path $botEnvPath) {
        $botEnv = Get-Content $botEnvPath -Raw
        $botEnv = $botEnv -replace "API_URL=.*", "API_URL=$backendUrl/api"
        $botEnv = $botEnv -replace "MINI_APP_URL=.*", "MINI_APP_URL=$miniappUrl"
        if ($botEnv -notmatch "API_URL=") {
            $botEnv += "`nAPI_URL=$backendUrl/api"
        }
        if ($botEnv -notmatch "MINI_APP_URL=") {
            $botEnv += "`nMINI_APP_URL=$miniappUrl"
        }
        Set-Content -Path $botEnvPath -Value $botEnv -NoNewline
        Write-Host "  ✅ Обновлен $botEnvPath" -ForegroundColor Green
    }
    
    # Mini App .env
    $miniappEnvPath = "apps\mini-app\.env"
    if (Test-Path $miniappEnvPath) {
        $miniappEnv = Get-Content $miniappEnvPath -Raw
        $miniappEnv = $miniappEnv -replace "VITE_API_URL=.*", "VITE_API_URL=$backendUrl/api"
        if ($miniappEnv -notmatch "VITE_API_URL=") {
            $miniappEnv += "`nVITE_API_URL=$backendUrl/api"
        }
        Set-Content -Path $miniappEnvPath -Value $miniappEnv -NoNewline
        Write-Host "  ✅ Обновлен $miniappEnvPath" -ForegroundColor Green
    }
    
    # Web Dashboard .env.local
    $dashboardEnvPath = "apps\web-dashboard\.env.local"
    if (Test-Path $dashboardEnvPath) {
        $dashboardEnv = Get-Content $dashboardEnvPath -Raw
        $dashboardEnv = $dashboardEnv -replace "NEXT_PUBLIC_API_URL=.*", "NEXT_PUBLIC_API_URL=$backendUrl/api"
        if ($dashboardEnv -notmatch "NEXT_PUBLIC_API_URL=") {
            $dashboardEnv += "`nNEXT_PUBLIC_API_URL=$backendUrl/api"
        }
        Set-Content -Path $dashboardEnvPath -Value $dashboardEnv -NoNewline
        Write-Host "  ✅ Обновлен $dashboardEnvPath" -ForegroundColor Green
    } else {
        # Создаем файл если его нет
        Set-Content -Path $dashboardEnvPath -Value "NEXT_PUBLIC_API_URL=$backendUrl/api"
        Write-Host "  ✅ Создан $dashboardEnvPath" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "🎉 Готово! Все .env файлы обновлены!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  ВАЖНО: Туннели должны работать постоянно!" -ForegroundColor Yellow
    Write-Host "   Не закрывайте терминалы с cloudflared!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Теперь перезапустите проект:" -ForegroundColor Cyan
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ Не удалось получить URL. Попробуйте запустить туннели вручную." -ForegroundColor Red
}


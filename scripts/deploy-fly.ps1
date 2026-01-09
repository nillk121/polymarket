# PowerShell скрипт для автоматического деплоя всех сервисов на Fly.io
# Использование: .\scripts\deploy-fly.ps1

$ErrorActionPreference = "Continue"

# Цвета для вывода
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

Write-ColorOutput "🚀 Деплой всех сервисов на Fly.io" "Cyan"
Write-Host ""

# Проверка наличия Fly CLI
if (-not (Get-Command fly -ErrorAction SilentlyContinue)) {
    Write-ColorOutput "⚠️  Fly CLI не установлен. Установите его:" "Yellow"
    Write-ColorOutput "   iwr https://fly.io/install.ps1 -useb | iex" "White"
    exit 1
}

# Переходим в корень репозитория
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptPath
Set-Location $RepoRoot

# Проверяем, что мы в корне репозитория
if (-not (Test-Path "package.json") -or -not (Test-Path "turbo.json")) {
    Write-ColorOutput "⚠️  Скрипт должен запускаться из корня репозитория" "Yellow"
    exit 1
}

# 1. Backend
Write-ColorOutput "1. Деплой Backend..." "Green"
try {
    fly deploy --config apps/backend/fly.toml
} catch {
    Write-ColorOutput "⚠️  Деплой Backend не удался. Продолжаем..." "Yellow"
}

# 2. Mini App
Write-ColorOutput "`n2. Деплой Mini App..." "Green"
try {
    fly deploy --config apps/mini-app/fly.toml
} catch {
    Write-ColorOutput "⚠️  Деплой Mini App не удался. Продолжаем..." "Yellow"
}

# 3. Web Dashboard
Write-ColorOutput "`n3. Деплой Web Dashboard..." "Green"
try {
    fly deploy --config apps/web-dashboard/fly.toml
} catch {
    Write-ColorOutput "⚠️  Деплой Web Dashboard не удался. Продолжаем..." "Yellow"
}

# 4. Telegram Bot
Write-ColorOutput "`n4. Деплой Telegram Bot..." "Green"
try {
    fly deploy --config apps/telegram-bot/fly.toml
} catch {
    Write-ColorOutput "⚠️  Деплой Telegram Bot не удался. Продолжаем..." "Yellow"
}

Write-ColorOutput "`n✅ Деплой завершен!" "Green"
Write-ColorOutput "`n📋 Следующие шаги:" "Cyan"
Write-ColorOutput "1. Проверьте логи: fly logs -a polymarket-backend" "White"
Write-ColorOutput "2. Выполните миграции Prisma в Backend" "White"
Write-ColorOutput "3. Обновите переменные окружения (CORS, URLs)" "White"
Write-ColorOutput "4. Проверьте работу всех сервисов" "White"

# 🐳 Установка Docker для Windows

## Способ 1: Docker Desktop (Рекомендуется)

### Шаг 1: Скачать Docker Desktop

1. Перейдите на официальный сайт: https://www.docker.com/products/docker-desktop/
2. Нажмите "Download for Windows"
3. Скачайте установщик `Docker Desktop Installer.exe`

### Шаг 2: Установка

1. Запустите скачанный установщик `Docker Desktop Installer.exe`
2. Следуйте инструкциям установщика
3. **Важно:** Убедитесь, что включена опция "Use WSL 2 instead of Hyper-V" (если доступна)
4. После установки перезагрузите компьютер (если требуется)

### Шаг 3: Запуск Docker Desktop

1. Найдите "Docker Desktop" в меню Пуск
2. Запустите приложение
3. Дождитесь, пока Docker Desktop полностью запустится (иконка в трее перестанет мигать)

### Шаг 4: Проверка установки

Откройте терминал (Git Bash, PowerShell или CMD) и выполните:

```bash
docker --version
docker-compose --version
```

Должны отобразиться версии Docker.

---

## Способ 2: Альтернатива - Установка PostgreSQL и Redis напрямую

Если Docker не подходит, можно установить PostgreSQL и Redis напрямую:

### PostgreSQL для Windows

1. Скачайте установщик: https://www.postgresql.org/download/windows/
2. Или используйте установщик: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
3. Установите PostgreSQL (по умолчанию порт 5432)
4. Запомните пароль пользователя `postgres`
5. Создайте базу данных:
   ```sql
   CREATE DATABASE polymarket;
   ```

### Redis для Windows

**Вариант A: Использовать WSL2 (рекомендуется)**
```bash
# В WSL2
sudo apt update
sudo apt install redis-server
redis-server
```

**Вариант B: Memurai (Windows-версия Redis)**
1. Скачайте: https://www.memurai.com/
2. Установите Memurai
3. Запустите службу

**Вариант C: Использовать Redis без установки (для разработки)**
- Можно временно отключить кэширование в backend
- Или использовать in-memory кэш вместо Redis

---

## После установки Docker

### Запуск PostgreSQL и Redis

```bash
# PostgreSQL
docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=polymarket -p 5432:5432 postgres:14

# Redis
docker run -d --name redis -p 6379:6379 redis:alpine
```

### Проверка работы

```bash
# Проверить запущенные контейнеры
docker ps

# Проверить логи PostgreSQL
docker logs postgres

# Проверить логи Redis
docker logs redis
```

### Остановка контейнеров

```bash
# Остановить
docker stop postgres redis

# Запустить снова
docker start postgres redis

# Удалить (если нужно)
docker rm postgres redis
```

---

## Troubleshooting

### Проблема: "docker: command not found"

**Решение:**
1. Убедитесь, что Docker Desktop запущен
2. Перезапустите терминал
3. Проверьте, что Docker добавлен в PATH:
   - Откройте "Параметры системы" → "Переменные среды"
   - Проверьте, что `C:\Program Files\Docker\Docker\resources\bin` в PATH

### Проблема: "WSL 2 installation is incomplete"

**Решение:**
1. Установите WSL2: https://docs.microsoft.com/windows/wsl/install
2. Или используйте Hyper-V (если доступен)

### Проблема: Docker Desktop не запускается

**Решение:**
1. Убедитесь, что включена виртуализация в BIOS
2. Проверьте, что Hyper-V или WSL2 включены
3. Запустите Docker Desktop от имени администратора

### Проблема: Порт уже занят

**Решение:**
```bash
# Проверить, что использует порт
netstat -ano | findstr :5432
netstat -ano | findstr :6379

# Остановить процесс или изменить порт в docker run
docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=polymarket -p 5433:5432 postgres:14
```

---

## Быстрая команда для запуска всего

Создайте файл `docker-start.sh`:

```bash
#!/bin/bash
# Запуск PostgreSQL и Redis

docker start postgres 2>/dev/null || docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=polymarket -p 5432:5432 postgres:14
docker start redis 2>/dev/null || docker run -d --name redis -p 6379:6379 redis:alpine

echo "✅ PostgreSQL и Redis запущены!"
docker ps
```

Или используйте `docker-compose.yml` (см. `infra/docker/docker-compose.yml`)

---

## Полезные ссылки

- [Docker Desktop для Windows](https://www.docker.com/products/docker-desktop/)
- [Документация Docker](https://docs.docker.com/)
- [WSL2 установка](https://docs.microsoft.com/windows/wsl/install)
- [PostgreSQL для Windows](https://www.postgresql.org/download/windows/)

---

**После установки Docker вернитесь к [START_HERE.md](../START_HERE.md) для продолжения настройки проекта.**


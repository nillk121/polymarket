# Исправления зависимостей

## Проблема: passport-telegram не существует

Пакет `passport-telegram@^0.0.2` не существует в npm registry.

### Решение

1. Удален `passport-telegram` из зависимостей
2. Обновлена `TelegramStrategy` для использования `passport-custom` вместо несуществующего пакета
3. Валидация Telegram WebApp данных теперь происходит напрямую в стратегии

### Изменения

- `backend/package.json` - удалена зависимость `passport-telegram`
- `backend/src/auth/strategies/telegram.strategy.ts` - обновлена для работы без внешнего пакета

### Альтернативное решение

Для production можно использовать:
- Прямую валидацию hash от Telegram через crypto.createHmac
- Или использовать библиотеку для валидации Telegram WebApp данных

## Установка зависимостей

Теперь можно установить зависимости:

```bash
npm install
```

Или для монорепозитория:

```bash
npm install
```

## Примечание о старой структуре

Старая структура `backend/` и `frontend/` все еще существует. 
Для полной миграции в монорепозиторий нужно:
1. Переместить код из `backend/` в `apps/backend/`
2. Переместить код из `frontend/` в `apps/mini-app/`
3. Удалить старые директории

См. `MIGRATION.md` для подробностей.


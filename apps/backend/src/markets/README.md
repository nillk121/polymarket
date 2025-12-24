# Markets Module

Модуль управления рынками прогнозов.

## Возможности

- ✅ Создание рынков (binary и multiple choice)
- ✅ Жизненный цикл рынков (draft → active → locked → resolved/cancelled)
- ✅ Управление исходами
- ✅ Фильтрация и поиск
- ✅ Защита админскими правами

## Типы рынков

### Binary (Да/Нет)
- Ровно 2 исхода
- Автоматическое создание исходов "Yes" и "No"
- Вероятность по умолчанию: 0.5 для каждого

### Multiple Choice (Множественный выбор)
- Минимум 2 исхода
- Вероятность по умолчанию: 1 / количество исходов

## Жизненный цикл рынка

```
draft → active → locked → resolved
  ↓         ↓
cancelled cancelled
```

### Статусы

- **draft** - Черновик, создан но не активирован
- **active** - Активен, принимает ставки
- **locked** - Заблокирован, ставки не принимаются, но еще не разрешен
- **resolved** - Разрешен, определен победивший исход
- **cancelled** - Отменен

### Переходы статусов

- `draft` → `active` (активация)
- `draft` → `cancelled` (отмена)
- `active` → `locked` (блокировка)
- `active` → `resolved` (разрешение)
- `active` → `cancelled` (отмена)
- `locked` → `resolved` (разрешение)
- `locked` → `cancelled` (отмена)

## API Endpoints

### Публичные (не требуют аутентификации)

- `GET /markets` - Список рынков с фильтрацией
- `GET /markets/:id` - Получение рынка по ID
- `GET /markets/slug/:slug` - Получение рынка по slug

### Админские (требуют роль admin)

- `POST /markets` - Создание рынка
- `PATCH /markets/:id` - Обновление рынка
- `POST /markets/:id/activate` - Активация рынка
- `POST /markets/:id/lock` - Блокировка рынка
- `POST /markets/:id/resolve` - Разрешение рынка
- `POST /markets/:id/cancel` - Отмена рынка

## Примеры использования

### Создание binary рынка

```typescript
POST /markets
Authorization: Bearer <admin_token>

{
  "title": "Биткоин достигнет $100,000 к концу 2024?",
  "slug": "bitcoin-100k-2024",
  "description": "Рынок на достижение биткоином цены $100,000 к 31 декабря 2024",
  "categoryId": "category-uuid",
  "type": "binary",
  "pricingModel": "lmsr",
  "outcomes": [
    {
      "title": "Да",
      "description": "Биткоин достигнет или превысит $100,000"
    },
    {
      "title": "Нет",
      "description": "Биткоин не достигнет $100,000"
    }
  ],
  "endDate": "2024-12-31T23:59:59Z"
}
```

### Создание multiple choice рынка

```typescript
POST /markets
Authorization: Bearer <admin_token>

{
  "title": "Кто выиграет чемпионат мира по футболу 2026?",
  "slug": "world-cup-2026-winner",
  "description": "Рынок на победителя чемпионата мира",
  "categoryId": "category-uuid",
  "type": "multi",
  "pricingModel": "lmsr",
  "outcomes": [
    { "title": "Бразилия" },
    { "title": "Аргентина" },
    { "title": "Франция" },
    { "title": "Испания" },
    { "title": "Другая команда" }
  ],
  "endDate": "2026-07-19T23:59:59Z"
}
```

### Разрешение рынка

```typescript
POST /markets/:id/resolve
Authorization: Bearer <admin_token>

{
  "outcomeId": "outcome-uuid",
  "resolutionDate": "2024-12-31T12:00:00Z"
}
```

## Валидация

- Slug должен быть уникальным
- Binary рынок должен иметь ровно 2 исхода
- Multi рынок должен иметь минимум 2 исхода
- Категория должна существовать и быть активной
- Рынок можно разрешить только если он в статусе `active` или `locked`

## Бизнес-логика

1. При создании рынка автоматически создаются исходы
2. При активации проверяется наличие исходов
3. При разрешении автоматически запускается обработка выплат, которая обновляет статусы ставок (won/lost) в модуле Payouts
4. При отмене рынок переходит в статус `cancelled`


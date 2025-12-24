# Architecture of TON Market Contract

## Обзор

TON Market Contract - это смарт-контракт для управления прогнозными рынками на блокчейне TON. Контракт обеспечивает децентрализованное управление ставками, дедлайнами и выплатами.

## Архитектура данных

### Структура хранения

```
Contract Storage:
├── outcomes_dict (cell)
│   └── Dictionary: outcome_id (8 bits) -> total_amount (coins)
├── status (8 bits)
├── deadline (64 bits - Unix timestamp)
├── resolved_outcome (8 bits)
├── total_locked (coins)
├── admin_address (address)
├── fee_rate (8 bits - basis points)
├── fee_collector (address)
└── bets_dict (cell)
    └── Dictionary: hash(sender_address, bet_id) (256 bits) -> bet_data (cell)
```

### Bet Data Structure

```
bet_data:
├── outcome_id (8 bits)
├── bet_amount (coins)
└── timestamp (64 bits)
```

## Потоки операций

### 1. Размещение ставки

```
User → Contract (OP_PLACE_BET + TON)
  ↓
Contract проверяет:
  - Статус рынка (active)
  - Дедлайн (не пройден)
  - Минимальная сумма
  ↓
Contract:
  - Рассчитывает комиссию
  - Блокирует средства
  - Сохраняет ставку в bets_dict
  - Обновляет outcomes_dict
  - Отправляет комиссию fee_collector
  ↓
Contract сохраняет состояние
```

### 2. Разрешение рынка

```
Admin → Contract (OP_RESOLVE_MARKET)
  ↓
Contract проверяет:
  - Отправитель = admin
  - Статус != resolved/cancelled
  - Дедлайн пройден
  ↓
Contract:
  - Обновляет статус на RESOLVED
  - Сохраняет выигрышный исход
  ↓
Contract сохраняет состояние
```

### 3. Вывод выигрышей

```
User → Contract (OP_WITHDRAW_WINNINGS)
  ↓
Contract проверяет:
  - Статус = RESOLVED
  - Ставка существует
  - Ставка на выигрышный исход
  - Ставка еще не выведена
  ↓
Contract:
  - Рассчитывает выплату (упрощенная модель)
  - Удаляет ставку из bets_dict
  - Отправляет выплату пользователю
  ↓
Contract сохраняет состояние
```

## Интеграция с Backend

### Синхронизация состояния

Backend должен синхронизировать состояние контракта с базой данных:

```
Contract Event → Backend Listener
  ↓
Backend:
  - Парсит транзакцию
  - Обновляет БД
  - Уведомляет пользователей
```

### Создание рынка

```
Backend → Deploy Contract
  ↓
Contract инициализируется с:
  - admin_address
  - deadline
  - fee_rate
  - fee_collector
  ↓
Backend сохраняет contract_address в БД
```

## Модель выплат

### Текущая реализация (упрощенная)

```func
payout = bet_amount * 2  // 1:1 выплата
```

### Будущая реализация (AMM)

Интеграция с `packages/pricing-engine`:

```func
;; Использовать LMSR или Constant Product для расчета выплат
payout = calculateAMMPayout(bet_amount, market_state, outcome_id)
```

## Gas Optimization

### Оптимизации

1. **Использование словарей** - Эффективное хранение данных
2. **Inline функции** - Уменьшение размера кода
3. **Минимальные проверки** - Только необходимые валидации
4. **Batch операции** - Группировка операций где возможно

### Оценка газа

- `OP_PLACE_BET`: ~0.1-0.2 TON
- `OP_RESOLVE_MARKET`: ~0.05 TON
- `OP_WITHDRAW_WINNINGS`: ~0.1 TON
- Get methods: Бесплатно (read-only)

## Масштабируемость

### Ограничения

- Максимальное количество ставок: Ограничено размером словаря
- Максимальная сумма: Ограничена балансом контракта
- Количество исходов: До 255 (8 bits)

### Решения

- Использование нескольких контрактов для больших рынков
- Периодическая архивация старых ставок
- Использование off-chain данных для больших объемов

## Обновление контракта

### Proxy Pattern

```func
;; Proxy контракт для обновления логики
contract Proxy {
    cell implementation;  // Адрес текущей реализации
    
    () recv_internal() {
        ;; Перенаправление на implementation
    }
}
```

### Версионирование

```func
;; Добавить версию в storage
int contract_version = 1;

;; Проверка версии при обновлении
if (new_version > contract_version) {
    ;; Миграция данных
}
```

## Мониторинг

### Метрики

- Количество ставок
- Общая заблокированная сумма
- Количество разрешенных рынков
- Средний размер ставки
- Комиссии собраны

### События

Все операции должны логироваться:
- Размещение ставки
- Разрешение рынка
- Вывод средств
- Отмена рынка

## Безопасность

См. `SECURITY.md` для детальной информации о мерах безопасности.

## Тестирование

### Unit Tests

- Тестирование каждой операции
- Тестирование граничных случаев
- Тестирование ошибок

### Integration Tests

- Тестирование полного цикла
- Тестирование взаимодействия с backend
- Тестирование на testnet

## Деплой

### Testnet

```bash
# Компиляция
func -SPA stdlib.fc market-v2.fc -o market-v2.fif

# Деплой на testnet
toncli deploy --testnet
```

### Mainnet

```bash
# Аудит и тестирование обязательны!
toncli deploy --mainnet
```


# TON Smart Contracts

Smart contracts для платформы прогнозных рынков на TON блокчейне.

## Структура

- `market.fc` - Контракт для управления рынками
- `payment.fc` - Контракт для обработки платежей
- `liquidity.fc` - Контракт для управления ликвидностью

## Компиляция

```bash
func -SPA -o market.fif market.fc
```

## Деплой

```bash
fift -s deploy.fif
```


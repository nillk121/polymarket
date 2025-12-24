# Миграция в монорепозиторий

## Шаги миграции

### 1. Установка зависимостей

```bash
npm install
```

### 2. Перемещение существующего кода

#### Backend
```bash
# Скопировать содержимое backend/ в apps/backend/
cp -r backend/* apps/backend/
```

#### Frontend (Mini App)
```bash
# Скопировать содержимое frontend/ в apps/mini-app/
cp -r frontend/* apps/mini-app/
```

### 3. Обновление импортов

#### В backend
Заменить локальные типы на shared-types:
```typescript
// Было
import { MarketStatus } from './entities/market.entity';

// Стало
import { MarketStatus } from '@polymarket/shared-types';
```

Использовать pricing-engine:
```typescript
// Было
import { PricingService } from './pricing.service';

// Стало
import { pricingEngine } from '@polymarket/pricing-engine';
```

#### В mini-app
Использовать shared-types:
```typescript
// Было
import { OrderType } from '../types';

// Стало
import { OrderType } from '@polymarket/shared-types';
```

### 4. Обновление конфигураций

#### Backend tsconfig.json
Добавить paths для shared packages:
```json
{
  "compilerOptions": {
    "paths": {
      "@polymarket/shared-types": ["../../packages/shared-types/src"],
      "@polymarket/shared-utils": ["../../packages/shared-utils/src"],
      "@polymarket/pricing-engine": ["../../packages/pricing-engine/src"],
      "@polymarket/analytics-sdk": ["../../packages/analytics-sdk/src"]
    }
  }
}
```

#### Mini App vite.config.ts
Добавить resolve.alias:
```typescript
resolve: {
  alias: {
    '@polymarket/shared-types': path.resolve(__dirname, '../../packages/shared-types/src'),
    '@polymarket/shared-utils': path.resolve(__dirname, '../../packages/shared-utils/src'),
    '@polymarket/analytics-sdk': path.resolve(__dirname, '../../packages/analytics-sdk/src'),
  },
}
```

### 5. Удаление старой структуры

После успешной миграции можно удалить:
- `backend/` (старая директория)
- `frontend/` (старая директория)

### 6. Проверка

```bash
# Сборка всех проектов
npm run build

# Запуск в режиме разработки
npm run dev
```

## Проблемы и решения

### Проблема: Импорты не разрешаются
**Решение**: Убедитесь, что все shared packages собраны:
```bash
npm run build --filter=shared-types
```

### Проблема: TypeScript ошибки
**Решение**: Проверьте paths в tsconfig.json и убедитесь, что все зависимости установлены.

### Проблема: Turborepo не находит проекты
**Решение**: Проверьте, что все package.json файлы имеют правильные имена и находятся в правильных директориях.


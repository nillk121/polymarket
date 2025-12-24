# Примеры использования Telegram Authentication

## 1. Авторизация через Telegram WebApp

### Frontend (React)

```typescript
import { useTelegram } from '../hooks/useTelegram';
import axios from 'axios';

function LoginComponent() {
  const { tg } = useTelegram();

  const handleLogin = async () => {
    if (!tg?.initData) {
      console.error('Telegram WebApp не инициализирован');
      return;
    }

    try {
      // Парсим initData
      const params = new URLSearchParams(tg.initData);
      const authData = {
        id: params.get('user') ? JSON.parse(params.get('user')!).id.toString() : '',
        first_name: params.get('user') ? JSON.parse(params.get('user')!).first_name : '',
        last_name: params.get('user') ? JSON.parse(params.get('user')!).last_name : '',
        username: params.get('user') ? JSON.parse(params.get('user')!).username : '',
        auth_date: parseInt(params.get('auth_date') || '0'),
        hash: params.get('hash') || '',
      };

      const response = await axios.post('/api/auth/telegram', authData);
      
      // Сохраняем токены
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      
      console.log('Авторизация успешна', response.data.user);
    } catch (error) {
      console.error('Ошибка авторизации', error);
    }
  };

  return <button onClick={handleLogin}>Войти через Telegram</button>;
}
```

### Использование токена

```typescript
// Добавление токена в заголовки
axios.defaults.headers.common['Authorization'] = 
  `Bearer ${localStorage.getItem('access_token')}`;

// Запрос к защищенному endpoint
const response = await axios.get('/api/auth/me');
```

## 2. Обновление токена

```typescript
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!refreshToken) {
    // Перенаправить на логин
    return;
  }

  try {
    const response = await axios.post('/api/auth/refresh', {
      refresh_token: refreshToken,
    });

    localStorage.setItem('access_token', response.data.access_token);
    return response.data.access_token;
  } catch (error) {
    // Refresh token истек, нужна повторная авторизация
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Перенаправить на логин
  }
}

// Interceptor для автоматического обновления токена
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return axios.request(error.config);
      }
    }
    return Promise.reject(error);
  }
);
```

## 3. Защита endpoints

### Только для авторизованных

```typescript
@Controller('markets')
export class MarketsController {
  @Get('my-markets')
  @UseGuards(JwtAuthGuard)
  async getMyMarkets(@CurrentUser() user: any) {
    // user содержит информацию о текущем пользователе
    return this.marketsService.findByUser(user.id);
  }
}
```

### Только для админов

```typescript
@Controller('admin')
export class AdminController {
  @Post('markets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async createMarket(@Body() data: any, @CurrentUser() user: any) {
    return this.marketsService.create(data, user.id);
  }
}
```

### С проверкой разрешения

```typescript
@Controller('markets')
export class MarketsController {
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('market:create')
  async create(@Body() data: any, @CurrentUser() user: any) {
    return this.marketsService.create(data, user.id);
  }
}
```

## 4. Получение информации о пользователе

```typescript
@Get('profile')
@UseGuards(JwtAuthGuard)
async getProfile(@CurrentUser() user: any) {
  return {
    id: user.id,
    telegramId: user.telegramId,
    username: user.username,
    roles: user.jwtRoles,
    permissions: user.jwtPermissions,
    isAdmin: user.jwtRoles?.includes('admin'),
  };
}
```

## 5. Проверка прав на фронтенде

```typescript
// Хук для проверки ролей и разрешений
function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios.get('/api/auth/me')
      .then(res => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  const hasRole = (role: string) => {
    return user?.roles?.includes(role);
  };

  const hasPermission = (permission: string) => {
    return user?.permissions?.includes(permission);
  };

  return { user, hasRole, hasPermission };
}

// Использование
function AdminButton() {
  const { hasRole } = useAuth();
  
  if (!hasRole('admin')) {
    return null;
  }
  
  return <button>Админ панель</button>;
}
```


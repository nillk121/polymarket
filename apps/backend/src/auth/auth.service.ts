import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { TelegramValidator } from './utils/telegram-validator';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Парсинг initData строки в TelegramAuthDto
   */
  parseInitData(initData: string): TelegramAuthDto {
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    
    let user: any = {};
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (e) {
        // Игнорируем ошибку парсинга
      }
    }
    
    const authData: TelegramAuthDto = {
      id: user.id?.toString() || params.get('id') || '',
      first_name: user.first_name || params.get('first_name') || undefined,
      last_name: user.last_name || params.get('last_name') || undefined,
      username: user.username || params.get('username') || undefined,
      photo_url: user.photo_url || params.get('photo_url') || undefined,
      auth_date: parseInt(params.get('auth_date') || '0', 10),
      hash: params.get('hash') || '',
      query_id: params.get('query_id') || undefined,
      user: params.get('user') || undefined,
      receiver: params.get('receiver') || undefined,
      chat: params.get('chat') || undefined,
      chat_type: params.get('chat_type') || undefined,
      chat_instance: params.get('chat_instance') || undefined,
      start_param: params.get('start_param') || undefined,
      can_send_after: params.get('can_send_after') || undefined,
    };
    
    return authData;
  }

  /**
   * Валидация и аутентификация пользователя через Telegram WebApp
   */
  async validateTelegramUser(authData: TelegramAuthDto, initData?: string) {
    // Валидация hash от Telegram
    // Если передан initData, используем его для более точной валидации
    let isValid = true;
    if (initData) {
      isValid = this.validateTelegramHashFromInitData(initData);
    } else {
      // Fallback на старый метод
      isValid = this.validateTelegramHash(authData);
    }
    
    if (!isValid) {
      // Добавляем больше информации для отладки
      const isDevMode = this.configService.get('NODE_ENV') === 'development';
      const hasBotToken = !!this.configService.get('TELEGRAM_BOT_TOKEN');
      const hasHash = !!authData.hash;
      
      console.error('❌ Telegram hash validation failed:', {
        isDevMode,
        hasBotToken,
        hasHash,
        telegramId: authData.id,
        authDate: authData.auth_date ? new Date(authData.auth_date * 1000).toISOString() : 'missing',
        usingInitData: !!initData,
      });
      
      // В dev режиме пропускаем валидацию для тестирования
      if (isDevMode && authData.id && authData.auth_date) {
        console.warn('⚠️  Hash validation failed, but skipping in dev mode for testing');
      } else {
        throw new UnauthorizedException('Неверная подпись Telegram');
      }
    }

    console.log('✅ Telegram hash validation passed, proceeding with user creation/update');

    // Проверка времени (auth_date не должен быть старше 24 часов)
    // В dev режиме пропускаем проверку, если auth_date отсутствует
    if (authData.auth_date) {
      const authDate = new Date(authData.auth_date * 1000);
      const now = new Date();
      const hoursDiff = (now.getTime() - authDate.getTime()) / (1000 * 60 * 60);
      if (hoursDiff > 24) {
        throw new UnauthorizedException('Данные авторизации устарели');
      }
    } else {
      const isDevMode = this.configService.get('NODE_ENV') === 'development';
      if (!isDevMode) {
        throw new UnauthorizedException('auth_date отсутствует');
      } else {
        console.warn('⚠️  auth_date отсутствует, пропускаем проверку времени (dev режим)');
      }
    }

    // Поиск или создание пользователя
    const user = await this.prisma.user.upsert({
      where: { telegramId: authData.id },
      update: {
        username: authData.username,
        firstName: authData.first_name,
        lastName: authData.last_name,
        lastLoginAt: new Date(),
      },
      create: {
        telegramId: authData.id,
        username: authData.username,
        firstName: authData.first_name,
        lastName: authData.last_name,
        lastLoginAt: new Date(),
        roles: {
          create: {
            role: {
              connect: { name: 'user' },
            },
          },
        },
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return user;
  }

  /**
   * Валидация hash от Telegram WebApp по оригинальной строке initData
   * Алгоритм: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
   */
  private validateTelegramHashFromInitData(initData: string): boolean {
    const botToken = this.configService.get('TELEGRAM_BOT_TOKEN');
    const isDevMode = this.configService.get('NODE_ENV') === 'development';
    
    if (!botToken) {
      if (isDevMode) {
        console.warn('⚠️  Telegram hash validation skipped - TELEGRAM_BOT_TOKEN not set');
        return true;
      }
      return false;
    }

    // Парсим initData
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    
    if (!hash || hash === '') {
      if (isDevMode) {
        console.warn('⚠️  Telegram hash validation skipped - hash is empty');
        return true;
      }
      return false;
    }

    // Формируем data-check-string из всех параметров кроме hash
    // Важно: используем оригинальные URL-encoded значения
    const dataCheckString = Array.from(params.entries())
      .filter(([key]) => key !== 'hash')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Создаем secret key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Вычисляем hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    const isValid = calculatedHash === hash;
    
    // Детальное логирование для отладки (только в dev режиме)
    if (isDevMode) {
      if (isValid) {
        console.log('✅ Hash validation passed');
      } else {
        console.error('❌ Hash validation failed. Details:', {
          receivedHash: hash.substring(0, 16) + '...',
          calculatedHash: calculatedHash.substring(0, 16) + '...',
          dataCheckString: dataCheckString.substring(0, 200) + '...',
          dataCheckStringLength: dataCheckString.length,
        });
        // В dev режиме пропускаем валидацию для тестирования
        console.warn('⚠️  Hash validation failed, but skipping in dev mode for testing');
        return true;
      }
    }
    
    return isValid;
  }

  /**
   * Валидация hash от Telegram WebApp (старый метод, использует распарсенные данные)
   * @deprecated Используйте validateTelegramHashFromInitData для более точной валидации
   */
  private validateTelegramHash(authData: TelegramAuthDto): boolean {
    const botToken = this.configService.get('TELEGRAM_BOT_TOKEN');
    const isDevMode = this.configService.get('NODE_ENV') === 'development';
    
    if (!botToken) {
      // В development режиме пропускаем проверку, если токен не установлен
      if (isDevMode) {
        console.warn('⚠️  Telegram hash validation skipped - TELEGRAM_BOT_TOKEN not set');
        return true;
      }
      return false;
    }

    // Если hash пустой, пропускаем проверку в dev режиме
    if (!authData.hash || authData.hash === '') {
      if (isDevMode) {
        console.warn('⚠️  Telegram hash validation skipped - hash is empty');
        return true;
      }
      return false;
    }

    const { hash, ...data } = authData;

    // Создаем data-check-string из всех полей кроме hash
    // Важно: фильтруем только undefined/null, но не пустые строки
    const dataCheckString = Object.keys(data)
      .sort()
      .filter((key) => {
        const value = data[key];
        return value !== undefined && value !== null && value !== '';
      })
      .map((key) => {
        const value = data[key];
        // Если значение объект, сериализуем его
        if (typeof value === 'object') {
          return `${key}=${JSON.stringify(value)}`;
        }
        return `${key}=${value}`;
      })
      .join('\n');

    // Создаем secret key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Вычисляем hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    const isValid = calculatedHash === hash;
    
    // Детальное логирование для отладки (только в dev режиме)
    if (isDevMode && !isValid) {
      console.error('❌ Hash validation failed. Details:', {
        receivedHash: hash.substring(0, 16) + '...',
        calculatedHash: calculatedHash.substring(0, 16) + '...',
        dataCheckString: dataCheckString.substring(0, 200) + '...',
        dataKeys: Object.keys(data).sort(),
      });
      
      // В dev режиме, если hash не проходит, но есть все необходимые данные,
      // пропускаем валидацию для тестирования
      if (authData.id && authData.auth_date) {
        console.warn('⚠️  Hash validation failed, but skipping in dev mode for testing');
        return true;
      }
    }
    
    return isValid;
  }

  /**
   * Логин пользователя - выдача access и refresh токенов
   */
  async login(user: any): Promise<LoginResponseDto> {
    const roles = user.roles?.map((r: any) => r.role.name) || [];
    const permissions = this.extractPermissions(user);

    const accessPayload = {
      sub: user.id,
      telegramId: user.telegramId,
      roles,
      permissions,
      type: 'access',
    };

    const refreshPayload = {
      sub: user.id,
      telegramId: user.telegramId,
      type: 'refresh',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME') || this.configService.get('JWT_EXPIRES_IN') || '15m',
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME') || this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
    });

    // Сохранение refresh token в базе (опционально, для возможности отзыва)
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        // Можно добавить поле refreshToken в схему для хранения
      },
    });

    console.log('✅ User logged in successfully:', {
      userId: user.id,
      telegramId: user.telegramId,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        roles,
        permissions,
      },
    };
  }

  /**
   * Обновление access token через refresh token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Неверный тип токена');
      }

      const user = await this.validateUser(payload.sub);
      const roles = user.roles?.map((r: any) => r.role.name) || [];
      const permissions = this.extractPermissions(user);

      const accessPayload = {
        sub: user.id,
        telegramId: user.telegramId,
        roles,
        permissions,
        type: 'access',
      };

      return {
        access_token: this.jwtService.sign(accessPayload, {
          expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
        }),
      };
    } catch (error) {
      throw new UnauthorizedException('Неверный refresh token');
    }
  }

  /**
   * Извлечение всех разрешений пользователя из ролей
   */
  extractPermissions(user: any): string[] {
    const permissions = new Set<string>();
    
    user.roles?.forEach((userRole: any) => {
      userRole.role.permissions?.forEach((rolePermission: any) => {
        permissions.add(rolePermission.permission.name);
      });
    });

    return Array.from(permissions);
  }

  /**
   * Валидация пользователя по ID
   */
  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Пользователь не найден или неактивен');
    }

    if (user.isBanned) {
      if (user.bannedUntil && user.bannedUntil > new Date()) {
        throw new UnauthorizedException(
          `Пользователь заблокирован до ${user.bannedUntil.toISOString()}`,
        );
      } else if (!user.bannedUntil) {
        throw new UnauthorizedException('Пользователь заблокирован');
      }
    }

    return user;
  }

  /**
   * Выход пользователя (отзыв refresh token)
   */
  async logout(userId: string) {
    // В будущем можно добавить blacklist для refresh токенов
    return { message: 'Успешный выход' };
  }

  /**
   * Админ логин (username/password)
   */
  async adminLogin(username: string, password: string): Promise<LoginResponseDto> {
    // Поиск пользователя по username или email
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username },
        ],
        passwordHash: { not: null }, // Только пользователи с паролем
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    // Проверка активности
    if (!user.isActive) {
      throw new UnauthorizedException('Пользователь неактивен');
    }

    // Проверка, что пользователь имеет роль admin
    const roles = user.roles?.map((r: any) => r.role.name) || [];
    if (!roles.includes('admin')) {
      throw new UnauthorizedException('Доступ запрещен. Требуется роль администратора');
    }

    // Обновление времени последнего входа
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.login(user);
  }
}

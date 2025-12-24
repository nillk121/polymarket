import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Валидация и аутентификация пользователя через Telegram WebApp
   */
  async validateTelegramUser(authData: TelegramAuthDto) {
    // Валидация hash от Telegram
    const isValid = this.validateTelegramHash(authData);
    if (!isValid) {
      throw new UnauthorizedException('Неверная подпись Telegram');
    }

    // Проверка времени (auth_date не должен быть старше 24 часов)
    const authDate = new Date(authData.auth_date * 1000);
    const now = new Date();
    const hoursDiff = (now.getTime() - authDate.getTime()) / (1000 * 60 * 60);
    if (hoursDiff > 24) {
      throw new UnauthorizedException('Данные авторизации устарели');
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
   * Валидация hash от Telegram WebApp
   * Алгоритм: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
   */
  private validateTelegramHash(authData: TelegramAuthDto): boolean {
    const botToken = this.configService.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      // В development режиме пропускаем проверку, если токен не установлен
      if (this.configService.get('NODE_ENV') === 'development') {
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

    return calculatedHash === hash;
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
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    // Сохранение refresh token в базе (опционально, для возможности отзыва)
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        // Можно добавить поле refreshToken в схему для хранения
      },
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
}

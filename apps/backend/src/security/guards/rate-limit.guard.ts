import {
  Injectable,
  ExecutionContext,
  CanActivate,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Расширенный rate limit guard с поддержкой per-user лимитов
 * Упрощенная версия - использует стандартный ThrottlerGuard как основу
 */
@Injectable()
export class EnhancedRateLimitGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Если пользователь авторизован, используем per-user лимиты
    if (user) {
      // Проверка лимитов для конкретного пользователя
      const userLimit = await this.getUserRateLimit(user.id, request.url);
      
      // TODO: Реализовать проверку лимитов через Redis или in-memory storage
      // Пока используем стандартный ThrottlerGuard через декоратор
    }

    return true;
  }

  /**
   * Получение лимита для пользователя
   */
  private async getUserRateLimit(userId: string, endpoint: string) {
    // Можно настроить разные лимиты для разных endpoints
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { riskScore: true },
    });

    // Пользователи с высоким risk score получают более строгие лимиты
    const baseLimit = 100; // requests per minute
    const riskMultiplier = user?.riskScore
      ? Math.max(0.1, 1 - Number(user.riskScore) / 100)
      : 1;

    return {
      limit: Math.floor(baseLimit * riskMultiplier),
      ttl: 60000, // 1 minute
    };
  }

  /**
   * Логирование превышения лимита
   */
  private async logRateLimitExceeded(
    userId: string,
    endpoint: string,
    limit: number,
  ) {
    await this.prisma.securityEvent.create({
      data: {
        eventType: 'rate_limit_exceeded',
        severity: 'medium',
        userId,
        metadata: {
          endpoint,
          limit,
        },
      },
    });
  }
}


import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Расширенный rate limit guard с поддержкой per-user лимитов
 */
@Injectable()
export class EnhancedRateLimitGuard extends ThrottlerGuard {
  constructor(
    options: any,
    private prisma: PrismaService,
  ) {
    super(options);
  }

  async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Если пользователь авторизован, используем per-user лимиты
    if (user) {
      const key = `rate_limit:user:${user.id}:${request.url}`;
      const tracker = this.storageService.storage;
      
      // Проверка лимитов для конкретного пользователя
      const userLimit = await this.getUserRateLimit(user.id, request.url);
      const current = await tracker.get(key);
      
      if (current && current.totalHits >= userLimit.limit) {
        // Логирование превышения лимита
        await this.logRateLimitExceeded(user.id, request.url, userLimit.limit);
        throw new ThrottlerException();
      }
    }

    // Вызываем стандартную проверку
    return super.handleRequest(context, limit, ttl);
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


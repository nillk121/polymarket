import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Сервис для экстренной заморозки рынков
 */
@Injectable()
export class MarketFreezeService {
  private readonly logger = new Logger(MarketFreezeService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Заморозка рынка
   */
  async freezeMarket(
    marketId: string,
    reason: string,
    freezeType: 'emergency' | 'suspicious' | 'maintenance' | 'manual',
    severity: 'low' | 'medium' | 'high' | 'critical',
    frozenById: string,
    metadata?: any,
  ) {
    // Проверка существующей заморозки
    const existingFreeze = await this.prisma.marketFreeze.findFirst({
      where: {
        marketId,
        isActive: true,
      },
    });

    if (existingFreeze) {
      throw new Error('Рынок уже заморожен');
    }

    // Заморозка рынка
    const freeze = await this.prisma.marketFreeze.create({
      data: {
        marketId,
        reason,
        freezeType,
        severity,
        frozenById,
        metadata: metadata || {},
      },
      include: {
        market: true,
        freezer: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Обновление статуса рынка
    await this.prisma.market.update({
      where: { id: marketId },
      data: {
        status: 'locked',
      },
    });

    // Создание события безопасности
    await this.prisma.securityEvent.create({
      data: {
        eventType: 'market_freeze',
        severity,
        marketId,
        metadata: {
          freezeType,
          reason,
          freezeId: freeze.id,
        },
      },
    });

    this.logger.warn(
      `Market ${marketId} frozen: ${reason} (${freezeType}, ${severity})`,
    );

    return freeze;
  }

  /**
   * Разморозка рынка
   */
  async unfreezeMarket(
    marketId: string,
    unfreezeReason: string,
    unfrozenById: string,
  ) {
    const freeze = await this.prisma.marketFreeze.findFirst({
      where: {
        marketId,
        isActive: true,
      },
    });

    if (!freeze) {
      throw new Error('Рынок не заморожен');
    }

    // Разморозка
    const updated = await this.prisma.marketFreeze.update({
      where: { id: freeze.id },
      data: {
        isActive: false,
        unfrozenAt: new Date(),
        unfrozenById,
        unfreezeReason,
      },
      include: {
        market: true,
        unfreezer: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Восстановление статуса рынка (если он был активен до заморозки)
    const market = await this.prisma.market.findUnique({
      where: { id: marketId },
    });

    if (market && market.status === 'locked') {
      // Можно восстановить в active, если рынок еще не закончился
      if (!market.endDate || new Date(market.endDate) > new Date()) {
        await this.prisma.market.update({
          where: { id: marketId },
          data: {
            status: 'active',
          },
        });
      }
    }

    // Создание события безопасности
    await this.prisma.securityEvent.create({
      data: {
        eventType: 'market_unfreeze',
        severity: 'medium',
        marketId,
        metadata: {
          freezeId: freeze.id,
          unfreezeReason,
        },
      },
    });

    this.logger.log(`Market ${marketId} unfrozen: ${unfreezeReason}`);

    return updated;
  }

  /**
   * Получение активных заморозок
   */
  async getActiveFreezes(marketId?: string) {
    const where: any = {
      isActive: true,
    };

    if (marketId) {
      where.marketId = marketId;
    }

    return this.prisma.marketFreeze.findMany({
      where,
      include: {
        market: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        freezer: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Проверка, заморожен ли рынок
   */
  async isMarketFrozen(marketId: string): Promise<boolean> {
    const freeze = await this.prisma.marketFreeze.findFirst({
      where: {
        marketId,
        isActive: true,
      },
    });

    return !!freeze;
  }

  /**
   * Экстренная заморозка всех рынков (критическая ситуация)
   */
  async emergencyFreezeAll(
    reason: string,
    frozenById: string,
  ) {
    const activeMarkets = await this.prisma.market.findMany({
      where: {
        status: {
          in: ['active', 'locked'],
        },
      },
      select: {
        id: true,
      },
    });

    const freezes = await Promise.all(
      activeMarkets.map((market) =>
        this.freezeMarket(
          market.id,
          reason,
          'emergency',
          'critical',
          frozenById,
          { emergencyFreezeAll: true },
        ).catch((error) => {
          this.logger.error(
            `Failed to freeze market ${market.id}: ${error.message}`,
          );
          return null;
        }),
      ),
    );

    this.logger.error(
      `EMERGENCY: All markets frozen. Reason: ${reason}. Markets affected: ${activeMarkets.length}`,
    );

    return {
      totalMarkets: activeMarkets.length,
      frozen: freezes.filter(Boolean).length,
      failed: freezes.filter((f) => !f).length,
    };
  }
}


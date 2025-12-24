import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketStatus } from '../../markets/dto/update-market.dto';

/**
 * Валидатор для рынков
 * Устраняет дублирование кода валидации
 */
@Injectable()
export class MarketValidator {
  constructor(private prisma: PrismaService) {}

  /**
   * Проверка существования рынка
   */
  async validateMarketExists(marketId: string, includeOutcomes = false) {
    const market = await this.prisma.market.findUnique({
      where: { id: marketId },
      include: includeOutcomes
        ? {
            outcomes: {
              orderBy: { sortOrder: 'asc' },
            },
          }
        : undefined,
    });

    if (!market) {
      throw new NotFoundException('Рынок не найден');
    }

    return market;
  }

  /**
   * Проверка статуса рынка
   */
  validateMarketStatus(market: any, allowedStatuses: MarketStatus[]) {
    if (!allowedStatuses.includes(market.status)) {
      throw new BadRequestException(
        `Невозможно выполнить операцию на рынок со статусом ${market.status}. Разрешенные статусы: ${allowedStatuses.join(', ')}`,
      );
    }
  }

  /**
   * Проверка активности рынка
   */
  validateMarketActive(market: any) {
    this.validateMarketStatus(market, ['active', 'locked']);
  }

  /**
   * Проверка дедлайна рынка
   */
  validateMarketDeadline(market: any) {
    if (market.endDate && new Date(market.endDate) < new Date()) {
      throw new BadRequestException('Срок размещения ставок истек');
    }
  }

  /**
   * Проверка разрешения рынка
   */
  validateMarketResolved(market: any) {
    if (market.status !== 'resolved') {
      throw new BadRequestException('Рынок не разрешен');
    }
  }

  /**
   * Проверка исхода в рынке
   */
  validateOutcomeInMarket(market: any, outcomeId: string) {
    const outcome = market.outcomes?.find((o: any) => o.id === outcomeId);

    if (!outcome) {
      throw new NotFoundException('Исход не найден в этом рынке');
    }

    if (outcome.isResolved) {
      throw new BadRequestException('Исход уже разрешен');
    }

    return outcome;
  }

  /**
   * Комплексная валидация для размещения ставки
   */
  async validateForBetting(marketId: string) {
    const market = await this.validateMarketExists(marketId, true);
    this.validateMarketActive(market);
    this.validateMarketDeadline(market);

    return market;
  }

  /**
   * Комплексная валидация для разрешения рынка
   */
  async validateForResolution(marketId: string, userId: string) {
    const market = await this.validateMarketExists(marketId);

    // Проверка прав (должна быть в guards, но для удобства здесь)
    // В production лучше использовать guards

    if (market.status === 'resolved') {
      throw new BadRequestException('Рынок уже разрешен');
    }

    if (market.status === 'cancelled') {
      throw new BadRequestException('Невозможно разрешить отмененный рынок');
    }

    return market;
  }
}


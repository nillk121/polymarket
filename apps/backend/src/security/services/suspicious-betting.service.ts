import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Decimal from 'decimal.js';

/**
 * Сервис для обнаружения подозрительных ставок
 */
@Injectable()
export class SuspiciousBettingService {
  private readonly logger = new Logger(SuspiciousBettingService.name);
  private readonly RISK_THRESHOLD = 70; // Порог для создания события

  constructor(private prisma: PrismaService) {}

  /**
   * Анализ ставки на подозрительность
   */
  async analyzeBet(betId: string) {
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
      include: {
        user: {
          include: {
            bets: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Последние 24 часа
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
        market: true,
      },
    });

    if (!bet) {
      return null;
    }

    const riskFactors: string[] = [];
    let riskScore = 0;

    // 1. Проверка скорости ставок (velocity)
    const velocityRisk = await this.checkBettingVelocity(bet.user, bet);
    if (velocityRisk.score > 0) {
      riskScore += velocityRisk.score;
      riskFactors.push(...velocityRisk.factors);
    }

    // 2. Проверка необычных сумм
    const amountRisk = await this.checkUnusualAmounts(bet.user, bet);
    if (amountRisk.score > 0) {
      riskScore += amountRisk.score;
      riskFactors.push(...amountRisk.factors);
    }

    // 3. Проверка паттернов
    const patternRisk = await this.checkBettingPatterns(bet.user, bet);
    if (patternRisk.score > 0) {
      riskScore += patternRisk.score;
      riskFactors.push(...patternRisk.factors);
    }

    // 4. Проверка времени ставок
    const timingRisk = await this.checkBettingTiming(bet);
    if (timingRisk.score > 0) {
      riskScore += timingRisk.score;
      riskFactors.push(...timingRisk.factors);
    }

    // 5. Проверка рынка
    const marketRisk = await this.checkMarketRisk(bet.market);
    if (marketRisk.score > 0) {
      riskScore += marketRisk.score;
      riskFactors.push(...marketRisk.factors);
    }

    // Обновление risk score пользователя
    await this.updateUserRiskScore(bet.userId, riskScore);

    // Если риск превышает порог, создаем событие
    if (riskScore >= this.RISK_THRESHOLD) {
      await this.createSuspiciousActivity(
        bet.userId,
        'betting_pattern',
        riskScore,
        riskFactors,
        { betId },
      );

      await this.prisma.securityEvent.create({
        data: {
          eventType: 'suspicious_bet',
          severity: riskScore >= 90 ? 'high' : 'medium',
          userId: bet.userId,
          betId: bet.id,
          marketId: bet.marketId,
          metadata: {
            riskScore,
            riskFactors,
            amount: bet.totalCost.toString(),
          },
        },
      });

      this.logger.warn(
        `Suspicious bet detected: ${betId}, risk score: ${riskScore}`,
      );
    }

    return {
      riskScore,
      riskFactors,
      action: riskScore >= 90 ? 'block' : riskScore >= 70 ? 'review' : 'none',
    };
  }

  /**
   * Проверка скорости ставок
   */
  private async checkBettingVelocity(user: any, currentBet: any) {
    const recentBets = user.bets || [];
    const score = 0;
    const factors: string[] = [];

    // Более 10 ставок за час
    const betsLastHour = recentBets.filter(
      (b: any) =>
        new Date(b.createdAt).getTime() >
        Date.now() - 60 * 60 * 1000,
    ).length;

    if (betsLastHour > 10) {
      factors.push(`rapid_betting_${betsLastHour}_per_hour`);
      return { score: 30, factors };
    }

    // Более 5 ставок за 10 минут
    const betsLast10Min = recentBets.filter(
      (b: any) =>
        new Date(b.createdAt).getTime() >
        Date.now() - 10 * 60 * 1000,
    ).length;

    if (betsLast10Min > 5) {
      factors.push(`very_rapid_betting_${betsLast10Min}_per_10min`);
      return { score: 40, factors };
    }

    return { score, factors };
  }

  /**
   * Проверка необычных сумм
   */
  private async checkUnusualAmounts(user: any, currentBet: any) {
    const score = 0;
    const factors: string[] = [];

    // Получение истории ставок пользователя
    const userBets = await this.prisma.bet.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Последние 30 дней
        },
      },
      select: {
        totalCost: true,
      },
    });

    if (userBets.length < 5) {
      return { score, factors }; // Недостаточно данных
    }

    const amounts = userBets.map((b) => Number(b.totalCost));
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const currentAmount = Number(currentBet.totalCost);

    // Ставка в 10 раз больше средней
    if (currentAmount > avgAmount * 10) {
      factors.push(`unusually_large_amount_${currentAmount}_vs_avg_${avgAmount}`);
      return { score: 35, factors };
    }

    // Ставка в 100 раз больше средней
    if (currentAmount > avgAmount * 100) {
      factors.push(`extremely_large_amount_${currentAmount}_vs_avg_${avgAmount}`);
      return { score: 50, factors };
    }

    return { score, factors };
  }

  /**
   * Проверка паттернов ставок
   */
  private async checkBettingPatterns(user: any, currentBet: any) {
    const score = 0;
    const factors: string[] = [];

    // Проверка на одинаковые суммы
    const recentBets = await this.prisma.bet.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      select: {
        totalCost: true,
      },
    });

    const currentAmount = Number(currentBet.totalCost);
    const sameAmountBets = recentBets.filter(
      (b) => Math.abs(Number(b.totalCost) - currentAmount) < 0.01,
    ).length;

    // Более 5 ставок с одинаковой суммой
    if (sameAmountBets > 5) {
      factors.push(`repeated_amount_${sameAmountBets}_times`);
      return { score: 25, factors };
    }

    return { score, factors };
  }

  /**
   * Проверка времени ставок
   */
  private async checkBettingTiming(bet: any) {
    const score = 0;
    const factors: string[] = [];
    const betTime = new Date(bet.createdAt);

    // Ставка в необычное время (например, 3-5 утра)
    const hour = betTime.getHours();
    if (hour >= 3 && hour <= 5) {
      factors.push(`unusual_time_${hour}_hours`);
      return { score: 10, factors };
    }

    return { score, factors };
  }

  /**
   * Проверка риска рынка
   */
  private async checkMarketRisk(market: any) {
    const score = 0;
    const factors: string[] = [];

    // Рынок заморожен
    const freeze = await this.prisma.marketFreeze.findFirst({
      where: {
        marketId: market.id,
        isActive: true,
      },
    });

    if (freeze) {
      factors.push(`market_frozen`);
      return { score: 100, factors }; // Критический риск
    }

    return { score, factors };
  }

  /**
   * Обновление risk score пользователя
   */
  private async updateUserRiskScore(userId: string, additionalRisk: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { riskScore: true },
    });

    const currentRisk = user?.riskScore ? Number(user.riskScore) : 0;
    const newRisk = Math.min(100, currentRisk + additionalRisk * 0.1); // Увеличиваем постепенно

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        riskScore: newRisk,
      },
    });
  }

  /**
   * Создание записи о подозрительной активности
   */
  private async createSuspiciousActivity(
    userId: string,
    activityType: string,
    riskScore: number,
    riskFactors: string[],
    metadata?: any,
  ) {
    await this.prisma.suspiciousActivity.create({
      data: {
        userId,
        activityType,
        riskScore,
        description: `Detected ${activityType} with risk score ${riskScore}`,
        metadata: {
          ...metadata,
          riskFactors,
        },
      },
    });
  }
}


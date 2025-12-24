import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrackEventDto } from './dto/track-event.dto';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import Decimal from 'decimal.js';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Отслеживание события
   */
  async trackEvent(data: TrackEventDto, ipAddress?: string, userAgent?: string) {
    return this.prisma.analyticsEvent.create({
      data: {
        eventType: data.eventType,
        userId: data.userId,
        marketId: data.marketId,
        betId: data.betId,
        metadata: data.metadata || {},
        trafficSourceId: data.trafficSourceId,
        sessionId: data.sessionId,
        referralCode: data.referralCode,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        ipAddress,
        userAgent,
      },
    });
  }

  /**
   * Базовая статистика
   */
  async getStats() {
    const [totalEvents, totalUsers, totalMarkets, totalBets] = await Promise.all([
      this.prisma.analyticsEvent.count(),
      this.prisma.user.count(),
      this.prisma.market.count(),
      this.prisma.bet.count(),
    ]);

    return {
      totalEvents,
      totalUsers,
      totalMarkets,
      totalBets,
    };
  }

  /**
   * Отслеживание источников трафика
   */
  async getTrafficSources(query: AnalyticsQueryDto) {
    const where: any = {};

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    if (query.trafficSourceId) {
      where.trafficSourceId = query.trafficSourceId;
    }

    const events = await this.prisma.analyticsEvent.findMany({
      where,
      include: {
        trafficSource: true,
      },
    });

    // Группировка по источникам трафика
    const sourcesMap = new Map<string, any>();

    events.forEach((event) => {
      const sourceId = event.trafficSourceId || 'direct';
      const source = event.trafficSource;

      if (!sourcesMap.has(sourceId)) {
        sourcesMap.set(sourceId, {
          id: sourceId,
          name: source?.name || 'Прямой трафик',
          type: source?.type || 'direct',
          totalEvents: 0,
          uniqueUsers: new Set<string>(),
          events: [],
        });
      }

      const sourceData = sourcesMap.get(sourceId)!;
      sourceData.totalEvents++;
      if (event.userId) {
        sourceData.uniqueUsers.add(event.userId);
      }
      sourceData.events.push(event);
    });

    return Array.from(sourcesMap.values()).map((source) => ({
      ...source,
      uniqueUsers: source.uniqueUsers.size,
      events: undefined, // Убираем массив событий из ответа
    }));
  }

  /**
   * Время ставок (по часам дня)
   */
  async getBetTiming(query: AnalyticsQueryDto) {
    const where: any = {
      eventType: 'bet_placed',
    };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const bets = await this.prisma.analyticsEvent.findMany({
      where,
      select: {
        createdAt: true,
      },
    });

    // Группировка по часам
    const hourlyStats = new Map<number, number>();

    for (let hour = 0; hour < 24; hour++) {
      hourlyStats.set(hour, 0);
    }

    bets.forEach((bet) => {
      const hour = new Date(bet.createdAt).getHours();
      hourlyStats.set(hour, (hourlyStats.get(hour) || 0) + 1);
    });

    return Array.from(hourlyStats.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour - b.hour);
  }

  /**
   * Популярные рынки
   */
  async getPopularMarkets(query: AnalyticsQueryDto) {
    const where: any = {};

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    // Получаем события просмотров и ставок
    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        ...where,
        eventType: {
          in: ['market_view', 'bet_placed'],
        },
        marketId: {
          not: null,
        },
      },
      include: {
        market: {
          include: {
            category: true,
          },
        },
      },
    });

    // Группировка по рынкам
    const marketsMap = new Map<string, any>();

    events.forEach((event) => {
      if (!event.marketId || !event.market) return;

      if (!marketsMap.has(event.marketId)) {
        marketsMap.set(event.marketId, {
          marketId: event.marketId,
          title: event.market.title,
          slug: event.market.slug,
          category: event.market.category?.name,
          views: 0,
          bets: 0,
          uniqueViewers: new Set<string>(),
          uniqueBettors: new Set<string>(),
        });
      }

      const marketData = marketsMap.get(event.marketId)!;

      if (event.eventType === 'market_view') {
        marketData.views++;
        if (event.userId) {
          marketData.uniqueViewers.add(event.userId);
        }
      } else if (event.eventType === 'bet_placed') {
        marketData.bets++;
        if (event.userId) {
          marketData.uniqueBettors.add(event.userId);
        }
      }
    });

    return Array.from(marketsMap.values())
      .map((market) => ({
        ...market,
        uniqueViewers: market.uniqueViewers.size,
        uniqueBettors: market.uniqueBettors.size,
        conversionRate:
          market.uniqueViewers.size > 0
            ? (market.uniqueBettors.size / market.uniqueViewers.size) * 100
            : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, query.limit || 20);
  }

  /**
   * Глубина ликвидности
   */
  async getLiquidityDepth(marketId?: string) {
    const where: any = {
      isActive: true,
    };

    if (marketId) {
      where.marketId = marketId;
    }

    const pools = await this.prisma.liquidityPool.findMany({
      where,
      include: {
        market: {
          include: {
            outcomes: true,
          },
        },
        outcome: true,
      },
    });

    // Группировка по рынкам
    const marketsMap = new Map<string, any>();

    pools.forEach((pool) => {
      const marketId = pool.marketId;

      if (!marketsMap.has(marketId)) {
        marketsMap.set(marketId, {
          marketId,
          title: pool.market.title,
          totalLiquidity: new Decimal(0),
          outcomes: new Map<string, any>(),
        });
      }

      const marketData = marketsMap.get(marketId)!;
      marketData.totalLiquidity = marketData.totalLiquidity.plus(pool.amount);

      if (pool.outcomeId) {
        if (!marketData.outcomes.has(pool.outcomeId)) {
          marketData.outcomes.set(pool.outcomeId, {
            outcomeId: pool.outcomeId,
            title: pool.outcome?.title,
            liquidity: new Decimal(0),
          });
        }

        const outcomeData = marketData.outcomes.get(pool.outcomeId)!;
        outcomeData.liquidity = outcomeData.liquidity.plus(pool.amount);
      }
    });

    return Array.from(marketsMap.values()).map((market) => ({
      marketId: market.marketId,
      title: market.title,
      totalLiquidity: market.totalLiquidity.toNumber(),
      outcomes: Array.from(market.outcomes.values()).map((outcome: any) => ({
        outcomeId: outcome.outcomeId,
        title: outcome.title,
        liquidity: outcome.liquidity.toNumber(),
        percentage:
          market.totalLiquidity.gt(0)
            ? (outcome.liquidity.toNumber() / market.totalLiquidity.toNumber()) * 100
            : 0,
      })),
    }));
  }

  /**
   * Когорты пользователей (по дате регистрации)
   */
  async getUserCohorts(query: AnalyticsQueryDto) {
    const where: any = {};

    if (query.startDate) {
      where.createdAt = {
        gte: new Date(query.startDate),
      };
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
      },
    });

    // Группировка по неделям регистрации
    const cohortsMap = new Map<string, Set<string>>();

    users.forEach((user) => {
      const weekStart = this.getWeekStart(user.createdAt);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!cohortsMap.has(weekKey)) {
        cohortsMap.set(weekKey, new Set<string>());
      }

      cohortsMap.get(weekKey)!.add(user.id);
    });

    // Для каждой когорты считаем активность
    const cohorts = await Promise.all(
      Array.from(cohortsMap.entries()).map(async ([weekKey, userIds]) => {
        const userIdsArray = Array.from(userIds);

        // Считаем ставки по неделям после регистрации
        const betsByWeek = await Promise.all(
          [0, 1, 2, 3, 4].map(async (weekOffset) => {
            const weekStart = new Date(weekKey);
            weekStart.setDate(weekStart.getDate() + weekOffset * 7);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);

            const bets = await this.prisma.bet.count({
              where: {
                userId: {
                  in: userIdsArray,
                },
                createdAt: {
                  gte: weekStart,
                  lt: weekEnd,
                },
              },
            });

            return {
              week: weekOffset,
              bets,
              retention: (bets / userIdsArray.length) * 100,
            };
          })
        );

        return {
          cohort: weekKey,
          users: userIdsArray.length,
          activity: betsByWeek,
        };
      })
    );

    return cohorts.sort((a, b) => a.cohort.localeCompare(b.cohort));
  }

  /**
   * DAU / MAU (Daily/Monthly Active Users)
   */
  async getDAUMAU(query: AnalyticsQueryDto) {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 дней назад

    // DAU - уникальные пользователи за день
    const dauData = await Promise.all(
      Array.from({ length: Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) }, async (_, i) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const uniqueUsers = await this.prisma.analyticsEvent.findMany({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
            userId: {
              not: null,
            },
          },
          select: {
            userId: true,
          },
          distinct: ['userId'],
        });

        return {
          date: date.toISOString().split('T')[0],
          dau: uniqueUsers.length,
        };
      })
    );

    // MAU - уникальные пользователи за последние 30 дней
    const thirtyDaysAgo = new Date(endDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const mauUsers = await this.prisma.analyticsEvent.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
          lte: endDate,
        },
        userId: {
          not: null,
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    const mau = mauUsers.length;

    // Средний DAU за период
    const avgDAU =
      dauData.reduce((sum, day) => sum + day.dau, 0) / dauData.length;

    return {
      dau: dauData,
      mau,
      avgDAU: Math.round(avgDAU),
      stickiness: mau > 0 ? (avgDAU / mau) * 100 : 0, // Процент "липкости"
    };
  }

  /**
   * Воронка конверсии
   */
  async getConversionFunnel(query: AnalyticsQueryDto) {
    const where: any = {};

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    // Этапы воронки
    const stages = [
      { name: 'Просмотр рынка', eventType: 'market_view' },
      { name: 'Просмотр деталей', eventType: 'market_detail_view' },
      { name: 'Начало ставки', eventType: 'bet_initiated' },
      { name: 'Завершение ставки', eventType: 'bet_placed' },
      { name: 'Пополнение баланса', eventType: 'deposit' },
    ];

    const funnelData = await Promise.all(
      stages.map(async (stage) => {
        const count = await this.prisma.analyticsEvent.count({
          where: {
            ...where,
            eventType: stage.eventType,
          },
        });

        return {
          stage: stage.name,
          eventType: stage.eventType,
          count,
        };
      })
    );

    // Расчет конверсии
    let previousCount = funnelData[0]?.count || 0;
    const funnelWithConversion = funnelData.map((stage, index) => {
      const conversion =
        previousCount > 0 ? (stage.count / previousCount) * 100 : 0;
      previousCount = stage.count;

      return {
        ...stage,
        conversion: Math.round(conversion * 100) / 100,
      };
    });

    return funnelWithConversion;
  }

  /**
   * Полный дашборд аналитики
   */
  async getDashboard(query: AnalyticsQueryDto) {
    const [
      stats,
      trafficSources,
      betTiming,
      popularMarkets,
      liquidityDepth,
      dauMau,
      conversionFunnel,
    ] = await Promise.all([
      this.getStats(),
      this.getTrafficSources(query),
      this.getBetTiming(query),
      this.getPopularMarkets(query),
      this.getLiquidityDepth(),
      this.getDAUMAU(query),
      this.getConversionFunnel(query),
    ]);

    return {
      stats,
      trafficSources,
      betTiming,
      popularMarkets,
      liquidityDepth,
      dauMau,
      conversionFunnel,
    };
  }

  /**
   * Вспомогательный метод: получение начала недели
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Понедельник
    return new Date(d.setDate(diff));
  }
}

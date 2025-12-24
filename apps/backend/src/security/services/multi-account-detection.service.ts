import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * Сервис для обнаружения множественных аккаунтов
 */
@Injectable()
export class MultiAccountDetectionService {
  private readonly logger = new Logger(MultiAccountDetectionService.name);
  private readonly MIN_CONFIDENCE = 50; // Минимальная уверенность для создания кластера

  constructor(private prisma: PrismaService) {}

  /**
   * Анализ пользователя на множественные аккаунты
   */
  async analyzeUser(userId: string, metadata?: {
    ipAddress?: string;
    userAgent?: string;
    fingerprint?: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        securityEvents: {
          where: {
            eventType: 'multi_account',
          },
          take: 10,
        },
      },
    });

    if (!user) {
      return null;
    }

    // Поиск похожих пользователей по IP, fingerprint, паттернам
    const similarUsers = await this.findSimilarUsers(userId, metadata);

    if (similarUsers.length > 0) {
      const confidence = this.calculateConfidence(similarUsers, metadata);
      
      if (confidence >= this.MIN_CONFIDENCE) {
        await this.createOrUpdateCluster(userId, similarUsers, confidence, metadata);
      }
    }

    return similarUsers;
  }

  /**
   * Поиск похожих пользователей
   */
  private async findSimilarUsers(
    userId: string,
    metadata?: {
      ipAddress?: string;
      fingerprint?: string;
    },
  ) {
    const conditions: any[] = [];

    // Поиск по IP адресу
    if (metadata?.ipAddress) {
      const ipUsers = await this.prisma.securityEvent.findMany({
        where: {
          ipAddress: metadata.ipAddress,
          userId: {
            not: userId,
          },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Последние 30 дней
          },
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      });
      conditions.push(...ipUsers.map((u) => u.userId));
    }

    // Поиск по fingerprint
    if (metadata?.fingerprint) {
      const fingerprintUsers = await this.prisma.securityEvent.findMany({
        where: {
          fingerprint: metadata.fingerprint,
          userId: {
            not: userId,
          },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      });
      conditions.push(...fingerprintUsers.map((u) => u.userId));
    }

    // Поиск по паттернам ставок (одинаковые рынки, одинаковые суммы, одинаковое время)
    const bettingPatterns = await this.findBettingPatternMatches(userId);
    conditions.push(...bettingPatterns);

    // Удаляем дубликаты
    const uniqueUserIds = [...new Set(conditions.filter(Boolean))];

    return uniqueUserIds;
  }

  /**
   * Поиск совпадений по паттернам ставок
   */
  private async findBettingPatternMatches(userId: string): Promise<string[]> {
    const userBets = await this.prisma.bet.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Последние 7 дней
        },
      },
      select: {
        marketId: true,
        totalCost: true,
        createdAt: true,
      },
      take: 100,
    });

    if (userBets.length < 3) {
      return [];
    }

    // Группировка по рынкам и суммам
    const patternMap = new Map<string, number[]>();
    userBets.forEach((bet) => {
      const key = `${bet.marketId}:${bet.totalCost}`;
      if (!patternMap.has(key)) {
        patternMap.set(key, []);
      }
      patternMap.get(key)!.push(bet.createdAt.getTime());
    });

    // Поиск других пользователей с похожими паттернами
    const similarUserIds: string[] = [];
    
    for (const [pattern, timestamps] of patternMap.entries()) {
      const [marketId, amount] = pattern.split(':');
      
      const similarBets = await this.prisma.bet.findMany({
        where: {
          marketId,
          totalCost: parseFloat(amount),
          userId: {
            not: userId,
          },
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      });

      similarUserIds.push(...similarBets.map((b) => b.userId));
    }

    return [...new Set(similarUserIds)];
  }

  /**
   * Расчет уверенности в том, что это множественные аккаунты
   */
  private calculateConfidence(
    similarUserIds: string[],
    metadata?: {
      ipAddress?: string;
      fingerprint?: string;
    },
  ): number {
    let confidence = 0;

    // IP адрес - 30%
    if (metadata?.ipAddress) {
      confidence += 30;
    }

    // Fingerprint - 40%
    if (metadata?.fingerprint) {
      confidence += 40;
    }

    // Количество похожих пользователей - до 20%
    if (similarUserIds.length >= 3) {
      confidence += 20;
    } else if (similarUserIds.length >= 2) {
      confidence += 10;
    }

    // Паттерны ставок - до 10%
    if (similarUserIds.length > 0) {
      confidence += 10;
    }

    return Math.min(100, confidence);
  }

  /**
   * Создание или обновление кластера множественных аккаунтов
   */
  private async createOrUpdateCluster(
    userId: string,
    similarUserIds: string[],
    confidence: number,
    metadata?: any,
  ) {
    // Проверка существующего кластера
    const existingMember = await this.prisma.multiAccountMember.findFirst({
      where: {
        userId,
      },
      include: {
        cluster: true,
      },
    });

    if (existingMember) {
      // Обновление существующего кластера
      const allUserIds = [
        ...new Set([userId, ...similarUserIds, existingMember.clusterId]),
      ];

      // Добавление новых пользователей в кластер
      for (const similarUserId of similarUserIds) {
        if (similarUserId !== userId) {
          await this.prisma.multiAccountMember.upsert({
            where: {
              clusterId_userId: {
                clusterId: existingMember.clusterId,
                userId: similarUserId,
              },
            },
            create: {
              clusterId: existingMember.clusterId,
              userId: similarUserId,
              evidence: metadata,
            },
            update: {
              evidence: metadata,
            },
          });
        }
      }

      // Обновление уверенности
      await this.prisma.multiAccountCluster.update({
        where: { id: existingMember.clusterId },
        data: {
          confidence: Math.max(confidence, existingMember.cluster.confidence),
          evidence: {
            ...(existingMember.cluster.evidence as any),
            ...metadata,
            lastUpdated: new Date().toISOString(),
          },
        },
      });
    } else {
      // Создание нового кластера
      const clusterId = `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await this.prisma.multiAccountCluster.create({
        data: {
          clusterId,
          confidence,
          evidence: {
            ...metadata,
            detectedAt: new Date().toISOString(),
          },
          accounts: {
            create: [
              { userId, evidence: metadata },
              ...similarUserIds.map((id) => ({
                userId: id,
                evidence: metadata,
              })),
            ],
          },
        },
      });

      // Создание события безопасности
      await this.prisma.securityEvent.create({
        data: {
          eventType: 'multi_account',
          severity: confidence >= 80 ? 'high' : 'medium',
          userId,
          metadata: {
            clusterId,
            confidence,
            similarUsers: similarUserIds,
          },
        },
      });
    }

    this.logger.warn(
      `Multi-account cluster detected for user ${userId} with confidence ${confidence}%`,
    );
  }

  /**
   * Периодический анализ всех пользователей (запускается по расписанию)
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async analyzeAllUsers() {
    this.logger.log('Starting multi-account detection analysis...');

    const recentUsers = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Последние 7 дней
        },
      },
      select: {
        id: true,
      },
      take: 1000, // Ограничение для производительности
    });

    for (const user of recentUsers) {
      try {
        await this.analyzeUser(user.id);
      } catch (error) {
        this.logger.error(
          `Error analyzing user ${user.id}: ${error.message}`,
        );
      }
    }

    this.logger.log('Multi-account detection analysis completed');
  }
}


import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Сервис для отслеживания источников трафика
 */
@Injectable()
export class TrafficTrackingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Создание источника трафика для поста
   */
  async createTrafficSource(
    postId: string,
    channelId: string,
    name?: string,
  ) {
    // Получаем канал
    const channel = await this.prisma.telegramChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new Error('Channel not found');
    }

    // Генерация уникального кода для источника трафика
    const code = `post_${postId}_${channel.channelId}`;

    // Проверка существующего источника
    const existing = await this.prisma.trafficSource.findUnique({
      where: { code },
    });

    if (existing) {
      return existing;
    }

    // Создание нового источника
    return this.prisma.trafficSource.create({
      data: {
        name: name || `Post ${postId}`,
        type: 'telegram',
        code,
        metadata: {
          postId,
          channelId: channel.channelId,
          channelName: channel.channelTitle || channel.channelUsername,
        },
      },
    });
  }

  /**
   * Регистрация клика по ссылке из поста
   */
  async trackClick(
    trafficSourceId: string,
    userId?: string,
    metadata?: Record<string, any>,
  ) {
    // Создание записи аналитики
    await this.prisma.analyticsEvent.create({
      data: {
        userId,
        eventType: 'post_click',
        trafficSourceId,
        metadata: {
          ...metadata,
        },
      },
    });

    return { success: true };
  }

  /**
   * Регистрация просмотра поста
   */
  async trackView(
    postId: string,
    userId?: string,
  ) {
    // Увеличение счетчика просмотров поста
    await this.prisma.post.update({
      where: { id: postId },
      data: {
        viewsCount: {
          increment: 1,
        },
      },
    });

    // Создание записи аналитики
    if (userId) {
      await this.prisma.analyticsEvent.create({
        data: {
          userId,
          eventType: 'post_view',
          metadata: {
            postId,
          },
        },
      });
    }

    return { success: true };
  }

  /**
   * Получение статистики по источнику трафика
   */
  async getTrafficStats(trafficSourceId: string) {
    const source = await this.prisma.trafficSource.findUnique({
      where: { id: trafficSourceId },
    });

    if (!source) {
      return null;
    }

    // Получение дополнительной статистики из аналитики
    const analytics = await this.prisma.analyticsEvent.findMany({
      where: {
        eventType: {
          in: ['post_click', 'post_view'],
        },
        trafficSourceId: trafficSourceId,
      },
    });

    const clicks = analytics.filter((a) => a.eventType === 'post_click').length;
    const views = analytics.filter((a) => a.eventType === 'post_view').length;
    const uniqueUsers = new Set(
      analytics.filter((a) => a.userId).map((a) => a.userId),
    ).size;

    return {
      source,
      totalClicks: clicks,
      totalViews: views,
      uniqueUsers,
      analytics,
    };
  }

  /**
   * Получение статистики по посту
   */
  async getPostStats(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return null;
    }

    // Получение источников трафика для поста
    const trafficSources = await this.prisma.trafficSource.findMany({
      where: {
        metadata: {
          path: ['postId'],
          equals: postId,
        },
      },
    });

    // Получение аналитики для поста
    const analytics = await this.prisma.analyticsEvent.findMany({
      where: {
        eventType: {
          in: ['post_click', 'post_view'],
        },
        OR: [
          {
            metadata: {
              path: ['postId'],
              equals: postId,
            },
          },
          {
            trafficSourceId: {
              in: trafficSources.map((ts) => ts.id),
            },
          },
        ],
      },
    });

    const totalClicks = analytics.filter((a) => a.eventType === 'post_click').length;
    const totalViews = post.viewsCount + analytics.filter((a) => a.eventType === 'post_view').length;

    return {
      post,
      totalViews,
      totalClicks,
      trafficSources,
      uniqueUsers: new Set(
        analytics.filter((a) => a.userId).map((a) => a.userId),
      ).size,
    };
  }
}

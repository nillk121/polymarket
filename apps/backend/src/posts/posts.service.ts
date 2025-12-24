import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostTemplatesService } from '../post-templates/post-templates.service';
import { DeeplinkService } from './services/deeplink.service';
import { TrafficTrackingService } from './services/traffic-tracking.service';
import { TelegramPostingService } from './services/telegram-posting.service';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    private prisma: PrismaService,
    private postTemplatesService: PostTemplatesService,
    private deeplinkService: DeeplinkService,
    private trafficTrackingService: TrafficTrackingService,
    private telegramPostingService: TelegramPostingService,
  ) {}

  /**
   * Создание поста
   */
  async create(userId: string, createPostDto: CreatePostDto) {
    let content = createPostDto.content;

    // Если используется шаблон, рендерим его
    if (createPostDto.templateId) {
      content = await this.postTemplatesService.renderTemplate(
        createPostDto.templateId,
        createPostDto.templateVariables || {},
      );
    }

    // Добавление deep link, если указан рынок
    if (createPostDto.marketId) {
      const marketLink = this.deeplinkService.generateMarketLink(
        createPostDto.marketId,
        `post_${Date.now()}`,
      );
      content += `\n\n📱 <a href="${marketLink}">Открыть рынок в Mini App</a>`;
    }

    // Создание поста
    const post = await this.prisma.post.create({
      data: {
        channelId: createPostDto.channelId,
        templateId: createPostDto.templateId,
        marketId: createPostDto.marketId,
        title: createPostDto.title,
        content,
        status: createPostDto.status || 'draft',
        scheduledAt: createPostDto.scheduledAt
          ? new Date(createPostDto.scheduledAt)
          : null,
        createdById: userId,
      },
    });

    // Создание источника трафика, если указан канал
    if (createPostDto.channelId) {
      await this.trafficTrackingService.createTrafficSource(
        post.id,
        createPostDto.channelId,
        createPostDto.title || `Post ${post.id}`,
      );
    }

    return post;
  }

  /**
   * Получение всех постов
   */
  async findAll(params?: {
    channelId?: string;
    status?: string;
    marketId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.channelId) where.channelId = params.channelId;
    if (params?.status) where.status = params.status;
    if (params?.marketId) where.marketId = params.marketId;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          channel: true,
          template: true,
          market: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          creator: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Получение одного поста
   */
  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        channel: true,
        template: true,
        market: true,
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Пост не найден');
    }

    return post;
  }

  /**
   * Обновление поста
   */
  async update(id: string, updatePostDto: UpdatePostDto) {
    const post = await this.findOne(id);

    let content = updatePostDto.content || post.content;

    // Если обновляется шаблон, рендерим его
    if (updatePostDto.templateId && updatePostDto.templateVariables) {
      content = await this.postTemplatesService.renderTemplate(
        updatePostDto.templateId,
        updatePostDto.templateVariables,
      );
    }

    // Обновление deep link, если указан рынок
    if (updatePostDto.marketId) {
      const marketLink = this.deeplinkService.generateMarketLink(
        updatePostDto.marketId,
        `post_${id}`,
      );
      content += `\n\n📱 <a href="${marketLink}">Открыть рынок в Mini App</a>`;
    }

    return this.prisma.post.update({
      where: { id },
      data: {
        ...updatePostDto,
        content,
        scheduledAt: updatePostDto.scheduledAt
          ? new Date(updatePostDto.scheduledAt)
          : undefined,
      },
    });
  }

  /**
   * Публикация поста в канал
   */
  async publishPost(id: string) {
    const post = await this.findOne(id);

    if (!post.channelId) {
      throw new BadRequestException('Пост не привязан к каналу');
    }

    if (post.status === 'published') {
      throw new BadRequestException('Пост уже опубликован');
    }

    const channel = await this.prisma.telegramChannel.findUnique({
      where: { id: post.channelId },
    });

    if (!channel) {
      throw new NotFoundException('Канал не найден');
    }

    if (!channel.isActive) {
      throw new BadRequestException('Канал неактивен');
    }

    // Создание кнопки Mini App, если есть рынок
    let replyMarkup;
    if (post.marketId) {
      const marketLink = this.deeplinkService.generateMarketLink(
        post.marketId,
        `post_${id}`,
      );
      replyMarkup = this.telegramPostingService.createMiniAppButton(
        '📱 Открыть рынок',
        marketLink,
      );
    }

    // Публикация в Telegram
    const result = await this.telegramPostingService.publishPost(
      channel.channelId,
      post.content,
      {
        parseMode: 'HTML',
        replyMarkup,
      },
    );

    // Обновление поста
    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: {
        status: 'published',
        publishedAt: new Date(),
        telegramMessageId: result.messageId.toString(),
      },
    });

    this.logger.log(`Post ${id} published to channel ${channel.channelId}`);

    return updatedPost;
  }

  /**
   * Удаление поста
   */
  async remove(id: string) {
    const post = await this.findOne(id);

    // Удаление из Telegram, если опубликован
    if (post.status === 'published' && post.telegramMessageId && post.channelId) {
      const channel = await this.prisma.telegramChannel.findUnique({
        where: { id: post.channelId },
      });

      if (channel) {
        try {
          await this.telegramPostingService.deletePost(
            channel.channelId,
            parseInt(post.telegramMessageId),
          );
        } catch (error) {
          this.logger.warn(`Failed to delete post from Telegram: ${error}`);
        }
      }
    }

    return this.prisma.post.delete({
      where: { id },
    });
  }

  /**
   * Регистрация клика по ссылке
   */
  async trackClick(trafficSourceId: string, userId?: string) {
    return this.trafficTrackingService.trackClick(trafficSourceId, userId);
  }

  /**
   * Регистрация просмотра поста
   */
  async trackView(postId: string, userId?: string) {
    return this.trafficTrackingService.trackView(postId, userId);
  }

  /**
   * Получение статистики поста
   */
  async getPostStats(postId: string) {
    return this.trafficTrackingService.getPostStats(postId);
  }
}


import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarketDto, MarketType } from './dto/create-market.dto';
import { UpdateMarketDto, MarketStatus } from './dto/update-market.dto';
import { ResolveMarketDto } from './dto/resolve-market.dto';
import { QueryMarketDto } from './dto/query-market.dto';
import { PayoutsService } from '../payouts/payouts.service';

@Injectable()
export class MarketsService {
  private readonly logger = new Logger(MarketsService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => PayoutsService))
    private payoutsService: PayoutsService,
    private categoryValidator: CategoryValidator,
  ) {}

  /**
   * Асинхронная обработка выплат после разрешения рынка
   */
  private async processPayoutsAsync(marketId: string, resolvedOutcomeId: string) {
    try {
      this.logger.log(
        `Starting async payout processing for market ${marketId}`,
      );
      await this.payoutsService.processMarketPayouts(marketId, resolvedOutcomeId);
      this.logger.log(
        `Completed async payout processing for market ${marketId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing payouts for market ${marketId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Создание рынка (только для админов)
   */
  async create(createMarketDto: CreateMarketDto, userId: string) {
    // Проверка уникальности slug
    const existing = await this.prisma.market.findUnique({
      where: { slug: createMarketDto.slug },
    });

    if (existing) {
      throw new ConflictException('Рынок с таким slug уже существует');
    }

    // Валидация категории (используем общий валидатор)
    if (createMarketDto.categoryId) {
      await this.categoryValidator.validateCategoryActiveExists(
        createMarketDto.categoryId,
      );
    }

    // Валидация outcomes
    if (createMarketDto.type === MarketType.BINARY) {
      // Для binary рынков должно быть ровно 2 исхода
      if (
        !createMarketDto.outcomes ||
        createMarketDto.outcomes.length !== 2
      ) {
        throw new BadRequestException(
          'Binary рынок должен иметь ровно 2 исхода',
        );
      }
    } else if (createMarketDto.type === MarketType.MULTI) {
      // Для multi рынков должно быть минимум 2 исхода
      if (
        !createMarketDto.outcomes ||
        createMarketDto.outcomes.length < 2
      ) {
        throw new BadRequestException(
          'Multi рынок должен иметь минимум 2 исхода',
        );
      }
    }

    // Создание рынка с исходами
    return this.prisma.market.create({
      data: {
        title: createMarketDto.title,
        slug: createMarketDto.slug,
        description: createMarketDto.description,
        categoryId: createMarketDto.categoryId,
        type: createMarketDto.type,
        pricingModel: createMarketDto.pricingModel || 'lmsr',
        status: MarketStatus.DRAFT,
        endDate: createMarketDto.endDate
          ? new Date(createMarketDto.endDate)
          : null,
        imageUrl: createMarketDto.imageUrl,
        telegramChannelId: createMarketDto.telegramChannelId,
        createdById: userId,
        outcomes: {
          create: createMarketDto.outcomes.map((outcome, index) => ({
            title: outcome.title,
            description: outcome.description,
            sortOrder: outcome.sortOrder ?? index,
            probability:
              createMarketDto.type === MarketType.BINARY ? 0.5 : 1 / createMarketDto.outcomes.length,
          })),
        },
      },
      include: {
        category: true,
        outcomes: {
          orderBy: { sortOrder: 'asc' },
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
    });
  }

  /**
   * Получение всех рынков с фильтрацией
   */
  async findAll(query: QueryMarketDto) {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      categoryId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [markets, total] = await Promise.all([
      this.prisma.market.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          outcomes: {
            orderBy: { sortOrder: 'asc' },
          },
          creator: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              bets: true,
            },
          },
        },
      }),
      this.prisma.market.count({ where }),
    ]);

    return {
      markets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Получение рынка по ID
   */
  async findOne(id: string) {
    const market = await this.prisma.market.findUnique({
      where: { id },
      include: {
        category: true,
        outcomes: {
          orderBy: { sortOrder: 'asc' },
        },
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            bets: true,
            liquidityPools: true,
          },
        },
      },
    });

    if (!market) {
      throw new NotFoundException('Рынок не найден');
    }

    return market;
  }

  /**
   * Получение рынка по slug
   */
  async findBySlug(slug: string) {
    const market = await this.prisma.market.findUnique({
      where: { slug },
      include: {
        category: true,
        outcomes: {
          orderBy: { sortOrder: 'asc' },
        },
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            bets: true,
            liquidityPools: true,
          },
        },
      },
    });

    if (!market) {
      throw new NotFoundException('Рынок не найден');
    }

    return market;
  }

  /**
   * Обновление рынка (только для админов)
   */
  async update(id: string, updateMarketDto: UpdateMarketDto, userId: string) {
    const market = await this.findOne(id);

    // Проверка прав на обновление
    if (market.createdById !== userId) {
      // Можно добавить проверку роли админа
      throw new ForbiddenException('Нет прав на обновление этого рынка');
    }

    // Валидация статуса
    if (updateMarketDto.status) {
      this.validateStatusTransition(market.status, updateMarketDto.status);
    }

    // Проверка уникальности slug
    if (updateMarketDto.slug && updateMarketDto.slug !== market.slug) {
      const existing = await this.prisma.market.findUnique({
        where: { slug: updateMarketDto.slug },
      });

      if (existing) {
        throw new ConflictException('Рынок с таким slug уже существует');
      }
    }

    // Валидация категории
    if (updateMarketDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateMarketDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Категория не найдена');
      }
    }

    return this.prisma.market.update({
      where: { id },
      data: {
        ...updateMarketDto,
        endDate: updateMarketDto.endDate
          ? new Date(updateMarketDto.endDate)
          : undefined,
      },
      include: {
        category: true,
        outcomes: {
          orderBy: { sortOrder: 'asc' },
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
    });
  }

  /**
   * Активация рынка (draft -> active)
   */
  async activate(id: string, userId: string) {
    const market = await this.findOne(id);

    if (market.status !== MarketStatus.DRAFT) {
      throw new BadRequestException(
        `Невозможно активировать рынок со статусом ${market.status}`,
      );
    }

    // Проверка наличия исходов
    if (market.outcomes.length === 0) {
      throw new BadRequestException('Рынок должен иметь хотя бы один исход');
    }

    return this.prisma.market.update({
      where: { id },
      data: {
        status: MarketStatus.ACTIVE,
      },
      include: {
        category: true,
        outcomes: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  /**
   * Блокировка рынка (active -> locked)
   */
  async lock(id: string, userId: string) {
    const market = await this.findOne(id);

    if (market.status !== MarketStatus.ACTIVE) {
      throw new BadRequestException(
        `Невозможно заблокировать рынок со статусом ${market.status}`,
      );
    }

    return this.prisma.market.update({
      where: { id },
      data: {
        status: MarketStatus.LOCKED,
      },
      include: {
        category: true,
        outcomes: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  /**
   * Разрешение рынка (только для админов)
   */
  async resolve(id: string, resolveMarketDto: ResolveMarketDto, userId: string) {
    const market = await this.findOne(id);

    // Рынок должен быть в статусе active или locked
    if (
      market.status !== MarketStatus.ACTIVE &&
      market.status !== MarketStatus.LOCKED
    ) {
      throw new BadRequestException(
        `Невозможно разрешить рынок со статусом ${market.status}`,
      );
    }

    // Проверка существования исхода
    const outcome = await this.prisma.outcome.findFirst({
      where: {
        id: resolveMarketDto.outcomeId,
        marketId: id,
      },
    });

    if (!outcome) {
      throw new NotFoundException('Исход не найден в этом рынке');
    }

    const resolutionDate = resolveMarketDto.resolutionDate
      ? new Date(resolveMarketDto.resolutionDate)
      : new Date();

    // Обновление рынка и исхода
    return this.prisma.$transaction(async (tx) => {
      // Обновление исхода
      await tx.outcome.update({
        where: { id: resolveMarketDto.outcomeId },
        data: {
          isResolved: true,
        },
      });

      // Обновление рынка
      const updatedMarket = await tx.market.update({
        where: { id },
        data: {
          status: MarketStatus.RESOLVED,
          resolvedOutcomeId: resolveMarketDto.outcomeId,
          resolutionDate,
        },
        include: {
          category: true,
          outcomes: {
            orderBy: { sortOrder: 'asc' },
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
      });

      // Автоматическая обработка выплат после разрешения рынка
      // Вызываем асинхронно, чтобы не блокировать ответ
      this.processPayoutsAsync(id, resolveMarketDto.outcomeId).catch((error) => {
        this.logger.error(`Failed to process payouts for market ${id}:`, error);
      });

      return updatedMarket;
    });
  }

  /**
   * Отмена рынка
   */
  async cancel(id: string, userId: string) {
    const market = await this.findOne(id);

    // Рынок можно отменить только если он не разрешен
    if (market.status === MarketStatus.RESOLVED) {
      throw new BadRequestException('Невозможно отменить разрешенный рынок');
    }

    return this.prisma.market.update({
      where: { id },
      data: {
        status: MarketStatus.CANCELLED,
      },
      include: {
        category: true,
        outcomes: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  /**
   * Валидация перехода статусов
   */
  private validateStatusTransition(
    currentStatus: string,
    newStatus: string,
  ): void {
    const allowedTransitions: Record<string, string[]> = {
      [MarketStatus.DRAFT]: [MarketStatus.ACTIVE, MarketStatus.CANCELLED],
      [MarketStatus.ACTIVE]: [
        MarketStatus.LOCKED,
        MarketStatus.RESOLVED,
        MarketStatus.CANCELLED,
      ],
      [MarketStatus.LOCKED]: [MarketStatus.RESOLVED, MarketStatus.CANCELLED],
      [MarketStatus.RESOLVED]: [], // Разрешенный рынок нельзя изменить
      [MarketStatus.CANCELLED]: [], // Отмененный рынок нельзя изменить
    };

    const allowed = allowedTransitions[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Невозможно перевести рынок из статуса ${currentStatus} в ${newStatus}`,
      );
    }
  }
}

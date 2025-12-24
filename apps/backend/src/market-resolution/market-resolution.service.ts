import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResolutionDto } from './dto/create-resolution.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ReviewDisputeDto } from './dto/review-dispute.dto';

@Injectable()
export class MarketResolutionService {
  private readonly logger = new Logger(MarketResolutionService.name);
  private readonly DEFAULT_DISPUTE_WINDOW_HOURS = 24;

  constructor(private prisma: PrismaService) {}

  /**
   * Создание разрешения рынка
   */
  async createResolution(
    marketId: string,
    createResolutionDto: CreateResolutionDto,
    resolvedById: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Проверка существования рынка
    const market = await this.prisma.market.findUnique({
      where: { id: marketId },
      include: {
        outcomes: true,
        resolution: true,
      },
    });

    if (!market) {
      throw new NotFoundException('Рынок не найден');
    }

    // Проверка статуса рынка
    if (market.status !== 'active' && market.status !== 'locked') {
      throw new BadRequestException(
        'Рынок должен быть в статусе active или locked для разрешения',
      );
    }

    // Проверка существующего разрешения
    if (market.resolution) {
      throw new ConflictException('Разрешение для этого рынка уже существует');
    }

    // Проверка существования исхода
    const outcome = market.outcomes.find(
      (o) => o.id === createResolutionDto.resolvedOutcomeId,
    );
    if (!outcome) {
      throw new NotFoundException('Исход не найден');
    }

    // Проверка оракула (если указан)
    if (createResolutionDto.oracleId) {
      const oracle = await this.prisma.oracle.findUnique({
        where: { id: createResolutionDto.oracleId },
      });
      if (!oracle || !oracle.isActive) {
        throw new BadRequestException('Оракул не найден или неактивен');
      }
    }

    const resolutionDate = createResolutionDto.resolutionDate
      ? new Date(createResolutionDto.resolutionDate)
      : new Date();

    const disputeWindowHours =
      createResolutionDto.disputeWindowHours ||
      this.DEFAULT_DISPUTE_WINDOW_HOURS;
    const disputeWindowEnds = new Date(
      resolutionDate.getTime() + disputeWindowHours * 60 * 60 * 1000,
    );

    return this.prisma.$transaction(async (tx) => {
      // Создание разрешения
      const resolution = await tx.marketResolution.create({
        data: {
          marketId,
          resolvedOutcomeId: createResolutionDto.resolvedOutcomeId,
          resolutionSource: createResolutionDto.oracleId ? 'oracle' : 'admin',
          oracleId: createResolutionDto.oracleId || null,
          resolvedById,
          status: 'pending',
          resolutionNotes: createResolutionDto.resolutionNotes,
          resolutionDate,
          disputeWindowEnds,
        },
        include: {
          market: true,
          resolvedOutcome: true,
          resolver: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      // Обновление рынка
      await tx.market.update({
        where: { id: marketId },
        data: {
          status: 'locked',
          resolvedOutcomeId: createResolutionDto.resolvedOutcomeId,
          resolutionDate,
        },
      });

      // Создание аудит-лога
      await tx.resolutionAuditLog.create({
        data: {
          resolutionId: resolution.id,
          action: 'created',
          performedById: resolvedById,
          newValues: {
            resolvedOutcomeId: createResolutionDto.resolvedOutcomeId,
            resolutionSource: createResolutionDto.oracleId ? 'oracle' : 'admin',
            oracleId: createResolutionDto.oracleId,
            disputeWindowEnds: disputeWindowEnds.toISOString(),
          },
          ipAddress,
          userAgent,
        },
      });

      this.logger.log(
        `Resolution created for market ${marketId} by user ${resolvedById}`,
      );

      return resolution;
    });
  }

  /**
   * Подтверждение разрешения (после окончания окна споров)
   */
  async confirmResolution(
    resolutionId: string,
    finalizedById: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const resolution = await this.prisma.marketResolution.findUnique({
      where: { id: resolutionId },
      include: {
        market: true,
        disputes: {
          where: {
            status: 'open',
          },
        },
      },
    });

    if (!resolution) {
      throw new NotFoundException('Разрешение не найдено');
    }

    if (resolution.status !== 'pending') {
      throw new BadRequestException(
        `Разрешение уже в статусе ${resolution.status}`,
      );
    }

    // Проверка окна споров
    if (
      resolution.disputeWindowEnds &&
      new Date() < resolution.disputeWindowEnds
    ) {
      throw new BadRequestException(
        'Окно для споров еще не закрыто',
      );
    }

    // Проверка открытых споров
    if (resolution.disputes.length > 0) {
      throw new BadRequestException(
        'Есть открытые споры. Сначала разрешите их.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Обновление разрешения
      const updated = await tx.marketResolution.update({
        where: { id: resolutionId },
        data: {
          status: 'confirmed',
          finalizedAt: new Date(),
          finalizedById,
        },
        include: {
          market: true,
          resolvedOutcome: true,
        },
      });

      // Обновление рынка
      await tx.market.update({
        where: { id: resolution.marketId },
        data: {
          status: 'resolved',
        },
      });

      // Создание аудит-лога
      await tx.resolutionAuditLog.create({
        data: {
          resolutionId,
          action: 'confirmed',
          performedById: finalizedById,
          oldValues: {
            status: 'pending',
          },
          newValues: {
            status: 'confirmed',
            finalizedAt: new Date().toISOString(),
          },
          ipAddress,
          userAgent,
        },
      });

      this.logger.log(
        `Resolution ${resolutionId} confirmed by user ${finalizedById}`,
      );

      return updated;
    });
  }

  /**
   * Создание спора
   */
  async createDispute(
    resolutionId: string,
    createDisputeDto: CreateDisputeDto,
    createdById: string,
  ) {
    const resolution = await this.prisma.marketResolution.findUnique({
      where: { id: resolutionId },
      include: {
        market: {
          include: {
            outcomes: true,
          },
        },
      },
    });

    if (!resolution) {
      throw new NotFoundException('Разрешение не найдено');
    }

    // Проверка окна споров
    if (
      resolution.disputeWindowEnds &&
      new Date() > resolution.disputeWindowEnds
    ) {
      throw new BadRequestException('Окно для споров закрыто');
    }

    // Проверка статуса разрешения
    if (resolution.status !== 'pending') {
      throw new BadRequestException(
        'Нельзя создать спор для разрешения в статусе ' + resolution.status,
      );
    }

    // Проверка существования исхода
    const outcome = resolution.market.outcomes.find(
      (o) => o.id === createDisputeDto.disputedOutcomeId,
    );
    if (!outcome) {
      throw new NotFoundException('Исход не найден');
    }

    return this.prisma.$transaction(async (tx) => {
      // Создание спора
      const dispute = await tx.marketDispute.create({
        data: {
          resolutionId,
          disputedOutcomeId: createDisputeDto.disputedOutcomeId,
          reason: createDisputeDto.reason,
          evidence: createDisputeDto.evidence || {},
          status: 'open',
          createdById,
        },
        include: {
          resolution: true,
          disputedOutcome: true,
          creator: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      // Обновление статуса разрешения
      await tx.marketResolution.update({
        where: { id: resolutionId },
        data: {
          status: 'disputed',
        },
      });

      // Создание аудит-лога
      await tx.resolutionAuditLog.create({
        data: {
          resolutionId,
          action: 'disputed',
          performedById: createdById,
          newValues: {
            disputedOutcomeId: createDisputeDto.disputedOutcomeId,
            reason: createDisputeDto.reason,
          },
        },
      });

      this.logger.log(
        `Dispute created for resolution ${resolutionId} by user ${createdById}`,
      );

      return dispute;
    });
  }

  /**
   * Рассмотрение спора
   */
  async reviewDispute(
    disputeId: string,
    reviewDisputeDto: ReviewDisputeDto,
    reviewedById: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const dispute = await this.prisma.marketDispute.findUnique({
      where: { id: disputeId },
      include: {
        resolution: true,
      },
    });

    if (!dispute) {
      throw new NotFoundException('Спор не найден');
    }

    if (dispute.status !== 'open') {
      throw new BadRequestException('Спор уже рассмотрен');
    }

    const newStatus =
      reviewDisputeDto.decision === 'accepted' ? 'accepted' : 'rejected';

    return this.prisma.$transaction(async (tx) => {
      // Обновление спора
      const updated = await tx.marketDispute.update({
        where: { id: disputeId },
        data: {
          status: newStatus,
          reviewedById,
          reviewedAt: new Date(),
          reviewNotes: reviewDisputeDto.reviewNotes,
        },
        include: {
          resolution: true,
          reviewer: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      // Если спор принят, обновляем разрешение
      if (newStatus === 'accepted') {
        await tx.marketResolution.update({
          where: { id: dispute.resolutionId },
          data: {
            resolvedOutcomeId: dispute.disputedOutcomeId,
            status: 'pending', // Возвращаем в pending для повторного подтверждения
          },
        });

        // Создание аудит-лога для разрешения
        await tx.resolutionAuditLog.create({
          data: {
            resolutionId: dispute.resolutionId,
            action: 'updated_after_dispute',
            performedById: reviewedById,
            oldValues: {
              resolvedOutcomeId: updated.resolution.resolvedOutcomeId,
            },
            newValues: {
              resolvedOutcomeId: dispute.disputedOutcomeId,
            },
            ipAddress,
            userAgent,
          },
        });
      }

      // Проверка, остались ли открытые споры
      const openDisputes = await tx.marketDispute.count({
        where: {
          resolutionId: dispute.resolutionId,
          status: 'open',
        },
      });

      // Если все споры рассмотрены, возвращаем статус в pending
      if (openDisputes === 0) {
        await tx.marketResolution.update({
          where: { id: dispute.resolutionId },
          data: {
            status: 'pending',
          },
        });
      }

      this.logger.log(
        `Dispute ${disputeId} reviewed by user ${reviewedById}, decision: ${newStatus}`,
      );

      return updated;
    });
  }

  /**
   * Получение разрешения
   */
  async getResolution(resolutionId: string) {
    const resolution = await this.prisma.marketResolution.findUnique({
      where: { id: resolutionId },
      include: {
        market: {
          include: {
            outcomes: true,
            category: true,
          },
        },
        resolvedOutcome: true,
        oracle: true,
        resolver: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        finalizer: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        disputes: {
          include: {
            disputedOutcome: true,
            creator: {
              select: {
                id: true,
                username: true,
              },
            },
            reviewer: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        auditLogs: {
          include: {
            performer: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!resolution) {
      throw new NotFoundException('Разрешение не найдено');
    }

    return resolution;
  }

  /**
   * Получение всех разрешений
   */
  async getAllResolutions(params?: {
    marketId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.marketId) {
      where.marketId = params.marketId;
    }
    if (params?.status) {
      where.status = params.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.marketResolution.findMany({
        where,
        skip,
        take: limit,
        include: {
          market: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          resolvedOutcome: true,
          resolver: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.marketResolution.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Получение аудит-логов разрешения
   */
  async getResolutionAuditLogs(resolutionId: string) {
    return this.prisma.resolutionAuditLog.findMany({
      where: { resolutionId },
      include: {
        performer: {
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
}


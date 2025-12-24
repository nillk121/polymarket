import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MultiAccountDetectionService } from './services/multi-account-detection.service';
import { SuspiciousBettingService } from './services/suspicious-betting.service';
import { MarketFreezeService } from './services/market-freeze.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('security')
export class SecurityController {
  constructor(
    private multiAccountService: MultiAccountDetectionService,
    private suspiciousBettingService: SuspiciousBettingService,
    private marketFreezeService: MarketFreezeService,
    private prisma: PrismaService,
  ) {}

  /**
   * Получение событий безопасности
   */
  @Get('events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  async getSecurityEvents(
    @Query('eventType') eventType?: string,
    @Query('severity') severity?: string,
    @Query('isResolved') isResolved?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const where: any = {};
    if (eventType) where.eventType = eventType;
    if (severity) where.severity = severity;
    if (isResolved !== undefined) where.isResolved = isResolved === 'true';

    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      this.prisma.securityEvent.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
          market: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.securityEvent.count({ where }),
    ]);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Получение подозрительной активности
   */
  @Get('suspicious-activities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  async getSuspiciousActivities(
    @Query('userId') userId?: string,
    @Query('isReviewed') isReviewed?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const where: any = {};
    if (userId) where.userId = userId;
    if (isReviewed !== undefined) where.isReviewed = isReviewed === 'true';

    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      this.prisma.suspiciousActivity.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              riskScore: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.suspiciousActivity.count({ where }),
    ]);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Получение кластеров множественных аккаунтов
   */
  @Get('multi-account-clusters')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  async getMultiAccountClusters(
    @Query('isConfirmed') isConfirmed?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const where: any = {};
    if (isConfirmed !== undefined) where.isConfirmed = isConfirmed === 'true';

    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      this.prisma.multiAccountCluster.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          accounts: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  telegramId: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.multiAccountCluster.count({ where }),
    ]);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Заморозка рынка
   */
  @Post('markets/:marketId/freeze')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async freezeMarket(
    @Param('marketId') marketId: string,
    @Body() body: {
      reason: string;
      freezeType: 'emergency' | 'suspicious' | 'maintenance' | 'manual';
      severity?: 'low' | 'medium' | 'high' | 'critical';
      metadata?: any;
    },
    @CurrentUser() user: any,
  ) {
    return this.marketFreezeService.freezeMarket(
      marketId,
      body.reason,
      body.freezeType,
      body.severity || 'medium',
      user.id,
      body.metadata,
    );
  }

  /**
   * Экстренная заморозка всех рынков
   */
  @Post('markets/freeze-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async freezeAllMarkets(
    @Body() body: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.marketFreezeService.emergencyFreezeAll(body.reason, user.id);
  }

  /**
   * Разморозка рынка
   */
  @Post('markets/:marketId/unfreeze')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async unfreezeMarket(
    @Param('marketId') marketId: string,
    @Body() body: { unfreezeReason: string },
    @CurrentUser() user: any,
  ) {
    return this.marketFreezeService.unfreezeMarket(
      marketId,
      body.unfreezeReason,
      user.id,
    );
  }

  /**
   * Получение активных заморозок
   */
  @Get('market-freezes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  async getActiveFreezes(@Query('marketId') marketId?: string) {
    return this.marketFreezeService.getActiveFreezes(marketId);
  }

  /**
   * Анализ пользователя на множественные аккаунты
   */
  @Post('analyze-user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  async analyzeUser(
    @Param('userId') userId: string,
    @Body() body: {
      ipAddress?: string;
      userAgent?: string;
      fingerprint?: string;
    },
  ) {
    return this.multiAccountService.analyzeUser(userId, body);
  }

  /**
   * Анализ ставки на подозрительность
   */
  @Post('analyze-bet/:betId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  async analyzeBet(@Param('betId') betId: string) {
    return this.suspiciousBettingService.analyzeBet(betId);
  }
}


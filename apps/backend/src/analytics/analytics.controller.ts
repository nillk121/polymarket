import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto } from './dto/track-event.dto';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Отслеживание события (публичный endpoint)
   */
  @Post('track')
  @Public()
  async trackEvent(@Body() data: TrackEventDto, @Req() req: any) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.analyticsService.trackEvent(data, ipAddress, userAgent);
  }

  /**
   * Базовая статистика
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  async getStats() {
    return this.analyticsService.getStats();
  }

  /**
   * Источники трафика
   */
  @Get('traffic-sources')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  async getTrafficSources(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getTrafficSources(query);
  }

  /**
   * Время ставок
   */
  @Get('bet-timing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  async getBetTiming(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getBetTiming(query);
  }

  /**
   * Популярные рынки
   */
  @Get('popular-markets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  async getPopularMarkets(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getPopularMarkets(query);
  }

  /**
   * Глубина ликвидности
   */
  @Get('liquidity-depth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  async getLiquidityDepth(@Query('marketId') marketId?: string) {
    return this.analyticsService.getLiquidityDepth(marketId);
  }

  /**
   * Когорты пользователей
   */
  @Get('user-cohorts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  async getUserCohorts(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getUserCohorts(query);
  }

  /**
   * DAU / MAU
   */
  @Get('dau-mau')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  async getDAUMAU(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getDAUMAU(query);
  }

  /**
   * Воронка конверсии
   */
  @Get('conversion-funnel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  async getConversionFunnel(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getConversionFunnel(query);
  }

  /**
   * Полный дашборд
   */
  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  async getDashboard(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getDashboard(query);
  }
}

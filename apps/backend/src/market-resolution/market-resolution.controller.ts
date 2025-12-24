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
import { MarketResolutionService } from './market-resolution.service';
import { CreateResolutionDto } from './dto/create-resolution.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ReviewDisputeDto } from './dto/review-dispute.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('market-resolutions')
export class MarketResolutionController {
  constructor(
    private readonly resolutionService: MarketResolutionService,
  ) {}

  /**
   * Создание разрешения рынка (только админ)
   */
  @Post('markets/:marketId/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async createResolution(
    @Param('marketId') marketId: string,
    @Body() createResolutionDto: CreateResolutionDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.resolutionService.createResolution(
      marketId,
      createResolutionDto,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Подтверждение разрешения (только админ)
   */
  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async confirmResolution(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.resolutionService.confirmResolution(
      id,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Создание спора (авторизованные пользователи)
   */
  @Post(':id/disputes')
  @UseGuards(JwtAuthGuard)
  async createDispute(
    @Param('id') resolutionId: string,
    @Body() createDisputeDto: CreateDisputeDto,
    @CurrentUser() user: any,
  ) {
    return this.resolutionService.createDispute(
      resolutionId,
      createDisputeDto,
      user.id,
    );
  }

  /**
   * Рассмотрение спора (только админ)
   */
  @Put('disputes/:disputeId/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async reviewDispute(
    @Param('disputeId') disputeId: string,
    @Body() reviewDisputeDto: ReviewDisputeDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.resolutionService.reviewDispute(
      disputeId,
      reviewDisputeDto,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Получение разрешения
   */
  @Get(':id')
  @Public()
  async getResolution(@Param('id') id: string) {
    return this.resolutionService.getResolution(id);
  }

  /**
   * Получение всех разрешений
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  async getAllResolutions(
    @Query('marketId') marketId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.resolutionService.getAllResolutions({
      marketId,
      status,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  /**
   * Получение аудит-логов разрешения
   */
  @Get(':id/audit-logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  async getAuditLogs(@Param('id') id: string) {
    return this.resolutionService.getResolutionAuditLogs(id);
  }
}


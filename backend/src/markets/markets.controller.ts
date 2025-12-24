import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MarketsService } from './markets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { MarketStatus, PricingModel } from './entities/market.entity';

@Controller('markets')
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: MarketStatus,
  ) {
    return this.marketsService.findAll(
      parseInt(page),
      parseInt(limit),
      status,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.marketsService.findOne(id);
  }

  @Get(':id/stats')
  async getStats(@Param('id') id: string) {
    return this.marketsService.getMarketStats(id);
  }

  @Get(':id/position')
  @UseGuards(JwtAuthGuard)
  async getPosition(@Param('id') id: string, @Request() req) {
    return this.marketsService.getUserPosition(req.user.id, id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Body() createMarketDto: any, @Request() req) {
    return this.marketsService.create({
      ...createMarketDto,
      createdBy: req.user.id,
    });
  }

  @Post(':id/resolve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async resolve(
    @Param('id') id: string,
    @Body('outcomeId') outcomeId: string,
    @Request() req,
  ) {
    return this.marketsService.resolve(id, outcomeId, req.user.id);
  }
}


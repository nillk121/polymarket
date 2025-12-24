import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getStats() {
    return this.analyticsService.getStats();
  }

  @Get('attribution')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAttribution(@Query('referralCode') referralCode?: string) {
    return this.analyticsService.getAttributionStats(referralCode);
  }
}


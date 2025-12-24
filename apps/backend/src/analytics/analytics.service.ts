import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async trackEvent(data: any) {
    return this.prisma.analyticsEvent.create({
      data,
    });
  }

  async getStats() {
    const [totalEvents, totalUsers, totalMarkets, totalBets] = await Promise.all([
      this.prisma.analyticsEvent.count(),
      this.prisma.user.count(),
      this.prisma.market.count(),
      this.prisma.bet.count(),
    ]);

    return {
      totalEvents,
      totalUsers,
      totalMarkets,
      totalBets,
    };
  }
}

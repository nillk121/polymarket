import { Injectable } from '@nestjs/common';
import { MarketsService } from '../markets/markets.service';
import { UsersService } from '../users/users.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class AdminService {
  constructor(
    private marketsService: MarketsService,
    private usersService: UsersService,
    private analyticsService: AnalyticsService,
  ) {}

  async getDashboardStats() {
    const [markets, users, analytics] = await Promise.all([
      this.marketsService.findAll(1, 1000),
      // TODO: Добавить метод для получения всех пользователей
      this.analyticsService.getStats(),
    ]);

    return {
      totalMarkets: markets.total,
      totalUsers: 0, // TODO: Реализовать
      totalVolume: analytics.totalVolume || 0,
      activeMarkets: markets.markets.filter((m) => m.status === 'open').length,
    };
  }
}


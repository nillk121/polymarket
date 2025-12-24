import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MarketsModule } from '../markets/markets.module';
import { UsersModule } from '../users/users.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [MarketsModule, UsersModule, AnalyticsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}


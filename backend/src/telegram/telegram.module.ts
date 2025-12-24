import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { MarketsModule } from '../markets/markets.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [MarketsModule, AnalyticsModule],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}


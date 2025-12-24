import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketsService } from './markets.service';
import { MarketsController } from './markets.controller';
import { Market } from './entities/market.entity';
import { MarketOutcome } from './entities/market-outcome.entity';
import { UserPosition } from './entities/user-position.entity';
import { PricingService } from './pricing.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Market, MarketOutcome, UserPosition]),
    OrdersModule,
  ],
  controllers: [MarketsController],
  providers: [MarketsService, PricingService],
  exports: [MarketsService, PricingService],
})
export class MarketsModule {}


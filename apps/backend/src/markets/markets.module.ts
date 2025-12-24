import { Module, forwardRef } from '@nestjs/common';
import { MarketsService } from './markets.service';
import { MarketsController } from './markets.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PayoutsModule } from '../payouts/payouts.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => PayoutsModule),
  ],
  controllers: [MarketsController],
  providers: [MarketsService],
  exports: [MarketsService],
})
export class MarketsModule {}

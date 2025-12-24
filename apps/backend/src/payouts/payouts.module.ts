import { Module, forwardRef } from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { PayoutsController } from './payouts.controller';
import { PayoutCalculationService } from './services/payout-calculation.service';
import { PayoutExecutionService } from './services/payout-execution.service';
import { PayoutAuditService } from './services/payout-audit.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BetsModule } from '../bets/bets.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    PrismaModule,
    BetsModule,
    forwardRef(() => PaymentsModule),
  ],
  controllers: [PayoutsController],
  providers: [
    PayoutsService,
    PayoutCalculationService,
    PayoutExecutionService,
    PayoutAuditService,
  ],
  exports: [
    PayoutsService,
    PayoutCalculationService,
    PayoutExecutionService,
    PayoutAuditService,
  ],
})
export class PayoutsModule {}

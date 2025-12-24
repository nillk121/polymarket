import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TONService } from './services/ton.service';
import { TelegramWalletService } from './services/telegram-wallet.service';
import { TelegramStarsService } from './services/telegram-stars.service';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    TONService,
    TelegramWalletService,
    TelegramStarsService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}


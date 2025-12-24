import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentGatewayService } from './services/payment-gateway.service';
import { IdempotencyService } from './services/idempotency.service';
import { TonWalletProvider } from './providers/ton-wallet.provider';
import { TelegramWalletProvider } from './providers/telegram-wallet.provider';
import { TelegramStarsProvider } from './providers/telegram-stars.provider';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { BalanceService } from '../bets/services/balance.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentGatewayService,
    IdempotencyService,
    TonWalletProvider,
    TelegramWalletProvider,
    TelegramStarsProvider,
    BalanceService,
  ],
  exports: [
    PaymentsService,
    PaymentGatewayService,
    TonWalletProvider,
    TelegramWalletProvider,
    TelegramStarsProvider,
  ],
})
export class PaymentsModule {}

import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '../orders/entities/order.entity';
import { TONService } from './services/ton.service';
import { TelegramWalletService } from './services/telegram-wallet.service';
import { TelegramStarsService } from './services/telegram-stars.service';

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    private tonService: TONService,
    private telegramWalletService: TelegramWalletService,
    private telegramStarsService: TelegramStarsService,
  ) {}

  async processPayment(
    userId: string,
    amount: number,
    method: PaymentMethod,
  ): Promise<PaymentResult> {
    switch (method) {
      case PaymentMethod.TON_WALLET:
        return this.tonService.processPayment(userId, amount);
      case PaymentMethod.TELEGRAM_WALLET:
        return this.telegramWalletService.processPayment(userId, amount);
      case PaymentMethod.TELEGRAM_STARS:
        return this.telegramStarsService.processPayment(userId, amount);
      default:
        return {
          success: false,
          error: 'Неподдерживаемый метод оплаты',
        };
    }
  }

  async verifyPayment(
    transactionId: string,
    method: PaymentMethod,
  ): Promise<boolean> {
    switch (method) {
      case PaymentMethod.TON_WALLET:
        return this.tonService.verifyPayment(transactionId);
      case PaymentMethod.TELEGRAM_WALLET:
        return this.telegramWalletService.verifyPayment(transactionId);
      case PaymentMethod.TELEGRAM_STARS:
        return this.telegramStarsService.verifyPayment(transactionId);
      default:
        return false;
    }
  }
}


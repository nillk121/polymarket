import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BalanceService } from '../../bets/services/balance.service';
import { PaymentGatewayService } from '../../payments/services/payment-gateway.service';
import { PaymentProviderType } from '../../payments/interfaces/payment-provider.interface';
import { PayoutCalculationService } from './payout-calculation.service';
import Decimal from 'decimal.js';

/**
 * Сервис для выполнения выплат через различные провайдеры
 */
@Injectable()
export class PayoutExecutionService {
  private readonly logger = new Logger(PayoutExecutionService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => BalanceService))
    private balanceService: BalanceService,
    @Inject(forwardRef(() => PaymentGatewayService))
    private paymentGatewayService: PaymentGatewayService,
    private payoutCalculationService: PayoutCalculationService,
  ) {}

  /**
   * Выполнение выплаты через внутренний баланс
   */
  async executeInternalPayout(
    payoutId: string,
    walletId: string,
    amount: Decimal,
    currency: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Зачисляем средства на внутренний баланс
      await this.balanceService.creditBalance(walletId, amount, currency);

      // Обновляем статус выплаты
      const payout = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: 'completed',
          processedAt: new Date(),
        },
      });

      // Создаем транзакцию
      await tx.transaction.create({
        data: {
          userId: payout.userId,
          walletId: payout.walletId,
          betId: payout.betId,
          type: 'payout',
          status: 'completed',
          amount: amount,
          currency: currency,
          netAmount: amount,
          fee: new Decimal(0),
          metadata: {
            payoutId: payout.id,
            type: 'internal',
          },
        },
      });

      return payout;
    });
  }

  /**
   * Выполнение выплаты через внешний провайдер (TON Wallet, Telegram Wallet)
   */
  async executeExternalPayout(
    payoutId: string,
    walletId: string,
    amount: Decimal,
    currency: string,
    providerType: PaymentProviderType,
  ) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (!wallet.address) {
      throw new BadRequestException('Wallet address is required for external payout');
    }

    // В реальной реализации здесь будет вызов API провайдера для отправки средств
    // Для демонстрации создаем транзакцию и обновляем статус

    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({
        where: { id: payoutId },
      });

      if (!payout) {
        throw new NotFoundException('Payout not found');
      }

      // Обновляем статус на processing
      await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: 'processing',
        },
      });

      // В реальной реализации здесь будет:
      // 1. Вызов API провайдера для отправки средств
      // 2. Получение external transaction ID
      // 3. Обновление payout с externalPayoutId

      // Для демонстрации симулируем успешную выплату
      const externalPayoutId = `ext_${Date.now()}_${payoutId}`;

      const updatedPayout = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: 'completed',
          externalPayoutId,
          processedAt: new Date(),
        },
      });

      // Создаем транзакцию
      await tx.transaction.create({
        data: {
          userId: payout.userId,
          walletId: payout.walletId,
          betId: payout.betId,
          type: 'payout',
          status: 'completed',
          amount: amount,
          currency: currency,
          netAmount: amount,
          fee: new Decimal(0),
          externalTransactionId: externalPayoutId,
          metadata: {
            payoutId: payout.id,
            type: 'external',
            providerType,
          },
        },
      });

      this.logger.log(
        `External payout ${payoutId} completed via ${providerType}. Amount: ${amount} ${currency}`,
      );

      return updatedPayout;
    });
  }

  /**
   * Определение типа выплаты на основе типа кошелька
   */
  getPayoutType(walletType: string): 'internal' | 'external' {
    if (walletType === 'internal') {
      return 'internal';
    }
    return 'external';
  }

  /**
   * Определение провайдера на основе типа кошелька
   */
  getProviderType(walletType: string): PaymentProviderType | null {
    switch (walletType) {
      case 'ton_wallet':
        return PaymentProviderType.TON_WALLET;
      case 'telegram_wallet':
        return PaymentProviderType.TELEGRAM_WALLET;
      default:
        return null;
    }
  }
}


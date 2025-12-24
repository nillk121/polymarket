import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IPaymentProvider, PaymentProviderType, PaymentStatus } from '../interfaces/payment-provider.interface';
import { TonWalletProvider } from '../providers/ton-wallet.provider';
import { TelegramWalletProvider } from '../providers/telegram-wallet.provider';
import { TelegramStarsProvider } from '../providers/telegram-stars.provider';
import { IdempotencyService } from './idempotency.service';
import { Inject, forwardRef } from '@nestjs/common';
import { BalanceService } from '../../bets/services/balance.service';
import Decimal from 'decimal.js';

/**
 * Единый сервис для работы с платежами
 */
@Injectable()
export class PaymentGatewayService {
  private providers: Map<PaymentProviderType, IPaymentProvider>;

  constructor(
    private prisma: PrismaService,
    private tonWalletProvider: TonWalletProvider,
    private telegramWalletProvider: TelegramWalletProvider,
    private telegramStarsProvider: TelegramStarsProvider,
    private idempotencyService: IdempotencyService,
    @Inject(forwardRef(() => BalanceService))
    private balanceService: BalanceService,
  ) {
    // Регистрация провайдеров
    this.providers = new Map([
      [PaymentProviderType.TON_WALLET, this.tonWalletProvider],
      [PaymentProviderType.TELEGRAM_WALLET, this.telegramWalletProvider],
      [PaymentProviderType.TELEGRAM_STARS, this.telegramStarsProvider],
    ]);
  }

  /**
   * Создание платежа через любой провайдер
   */
  async createPayment(
    userId: string,
    providerType: PaymentProviderType,
    amount: Decimal,
    currency: string,
    walletId: string,
    description?: string,
    idempotencyKey?: string,
    metadata?: Record<string, any>,
  ) {
    // Получение провайдера
    const provider = this.providers.get(providerType);
    if (!provider) {
      throw new NotFoundException(`Payment provider ${providerType} not found`);
    }

    // Проверка кошелька
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.userId !== userId) {
      throw new BadRequestException('Wallet belongs to another user');
    }

    if (wallet.type !== providerType) {
      throw new BadRequestException(
        `Wallet type ${wallet.type} does not match provider ${providerType}`,
      );
    }

    // Генерация идемпотентного ключа если не указан
    const idempotencyKeyFinal =
      idempotencyKey ||
      this.idempotencyService.generateKey(userId, 'create_payment', {
        providerType,
        amount: amount.toString(),
        currency,
        walletId,
      });

    // Проверка идемпотентности
    const existing = await this.idempotencyService.checkAndStore(
      idempotencyKeyFinal,
      'create_payment',
      { providerType, amount: amount.toString(), currency, walletId },
    );

    if (existing) {
      // Возвращаем существующий результат
      return existing;
    }

    // Создание платежа через провайдера
    const paymentResult = await provider.createPayment({
      userId,
      walletId,
      amount,
      currency,
      description,
      metadata: {
        ...metadata,
        walletAddress: wallet.address,
      },
      idempotencyKey: idempotencyKeyFinal,
    });

    // Сохранение транзакции в БД
    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        walletId,
        type: 'deposit',
        status: 'pending',
        amount,
        currency,
        netAmount: amount,
        fee: new Decimal(0),
        externalTransactionId: paymentResult.providerPaymentId,
        metadata: {
          paymentId: paymentResult.paymentId,
          providerType,
          ...paymentResult.metadata,
        },
      },
    });

    // Сохранение результата для идемпотентности
    await this.idempotencyService.storeResult(
      idempotencyKeyFinal,
      'create_payment',
      {
        paymentId: paymentResult.paymentId,
        transactionId: transaction.id,
        ...paymentResult,
      },
    );

    return {
      ...paymentResult,
      transactionId: transaction.id,
    };
  }

  /**
   * Обработка webhook от провайдера
   */
  async handleWebhook(
    providerType: PaymentProviderType,
    payload: any,
    signature: string,
    timestamp?: string,
  ) {
    const provider = this.providers.get(providerType);
    if (!provider) {
      throw new NotFoundException(`Payment provider ${providerType} not found`);
    }

    // Верификация webhook
    const payloadString = typeof payload === 'string' 
      ? payload 
      : JSON.stringify(payload);
    
    const isValid = await provider.verifyWebhook({
      signature,
      payload: payloadString,
      timestamp,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // Парсинг данных webhook
    const webhookData = await provider.parseWebhook(payload);

    // Поиск транзакции по external ID
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        externalTransactionId: webhookData.providerPaymentId,
      },
      include: {
        wallet: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Проверка на дублирование (replay protection)
    const isReplay = await this.idempotencyService.checkReplay(
      webhookData.providerPaymentId,
      'webhook',
      webhookData.timestamp.getTime(),
    );

    if (isReplay && transaction.status === 'completed') {
      // Игнорируем повторный webhook для уже обработанной транзакции
      return { success: true, message: 'Already processed' };
    }

    // Обновление транзакции
    return this.prisma.$transaction(async (tx) => {
      const updatedTransaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: this.mapPaymentStatus(webhookData.status),
          processedAt: webhookData.timestamp,
          metadata: {
            ...(transaction.metadata as any),
            webhookData: webhookData.metadata,
            transactionHash: webhookData.transactionHash,
          },
        },
      });

      // Если платеж успешен - зачисляем средства
      if (webhookData.status === PaymentStatus.COMPLETED) {
        await this.balanceService.creditBalance(
          transaction.walletId,
          webhookData.amount,
          webhookData.currency,
        );
      }

      return updatedTransaction;
    });
  }

  /**
   * Проверка статуса платежа
   */
  async checkPaymentStatus(transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const providerType = (transaction.metadata as any)?.providerType;
    if (!providerType) {
      return transaction.status;
    }

    const provider = this.providers.get(providerType as PaymentProviderType);
    if (!provider) {
      return transaction.status;
    }

    // Проверка статуса у провайдера
    const providerStatus = await provider.checkPaymentStatus(
      transaction.externalTransactionId || '',
    );

    // Обновление статуса если изменился
    if (providerStatus !== this.mapPaymentStatus(transaction.status)) {
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: this.mapPaymentStatus(providerStatus),
        },
      });
    }

    return providerStatus;
  }

  /**
   * Маппинг статуса платежа в статус транзакции
   */
  private mapPaymentStatus(status: PaymentStatus): string {
    const statusMap: Record<PaymentStatus, string> = {
      [PaymentStatus.PENDING]: 'pending',
      [PaymentStatus.PROCESSING]: 'pending',
      [PaymentStatus.COMPLETED]: 'completed',
      [PaymentStatus.FAILED]: 'failed',
      [PaymentStatus.CANCELLED]: 'cancelled',
      [PaymentStatus.REFUNDED]: 'completed',
    };

    return statusMap[status] || 'pending';
  }
}


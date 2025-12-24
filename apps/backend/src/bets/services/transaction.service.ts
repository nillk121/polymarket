import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Decimal from 'decimal.js';

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  BET_PLACED = 'bet_placed',
  BET_WON = 'bet_won',
  BET_LOST = 'bet_lost',
  REFUND = 'refund',
  COMMISSION = 'commission',
  REFERRAL_BONUS = 'referral_bonus',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Сервис для создания транзакций (защита от двойного расходования)
 */
@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Создание транзакции для ставки
   * 
   * @param userId - ID пользователя
   * @param walletId - ID кошелька
   * @param betId - ID ставки
   * @param amount - Сумма
   * @param type - Тип транзакции
   * @param metadata - Дополнительные данные
   * @returns Созданная транзакция
   */
  async createTransaction(
    userId: string,
    walletId: string,
    betId: string | null,
    amount: Decimal,
    type: TransactionType,
    currency: string = 'TON',
    metadata?: any,
  ) {
    return this.prisma.transaction.create({
      data: {
        userId,
        walletId,
        betId,
        type,
        status: TransactionStatus.PENDING,
        amount,
        currency,
        netAmount: amount,
        fee: new Decimal(0),
        metadata: metadata || {},
      },
    });
  }

  /**
   * Подтверждение транзакции
   */
  async completeTransaction(transactionId: string) {
    return this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: TransactionStatus.COMPLETED,
        processedAt: new Date(),
      },
    });
  }

  /**
   * Отмена транзакции
   */
  async cancelTransaction(transactionId: string, errorMessage?: string) {
    return this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: TransactionStatus.CANCELLED,
        errorMessage,
      },
    });
  }

  /**
   * Проверка на дублирование транзакций (защита от двойного расходования)
   * 
   * @param userId - ID пользователя
   * @param walletId - ID кошелька
   * @param amount - Сумма
   * @param type - Тип транзакции
   * @param timeWindow - Временное окно в миллисекундах (по умолчанию 5 секунд)
   * @returns true если найдена дублирующая транзакция
   */
  async hasDuplicateTransaction(
    userId: string,
    walletId: string,
    amount: Decimal,
    type: TransactionType,
    timeWindow: number = 5000,
  ): Promise<boolean> {
    const since = new Date(Date.now() - timeWindow);

    const duplicate = await this.prisma.transaction.findFirst({
      where: {
        userId,
        walletId,
        type,
        amount: {
          equals: amount,
        },
        status: {
          in: [TransactionStatus.PENDING, TransactionStatus.COMPLETED],
        },
        createdAt: {
          gte: since,
        },
      },
    });

    return !!duplicate;
  }
}


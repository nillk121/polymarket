import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Decimal from 'decimal.js';

/**
 * Сервис для управления балансами и блокировками
 */
@Injectable()
export class BalanceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Получение баланса кошелька
   */
  async getBalance(walletId: string, currency: string = 'TON') {
    const balance = await this.prisma.balance.findUnique({
      where: {
        walletId_currency: {
          walletId,
          currency,
        },
      },
    });

    if (!balance) {
      // Создаем баланс если его нет
      return this.prisma.balance.create({
        data: {
          walletId,
          currency,
          amount: new Decimal(0),
          lockedAmount: new Decimal(0),
        },
      });
    }

    return balance;
  }

  /**
   * Блокировка средств на балансе
   * 
   * @param walletId - ID кошелька
   * @param amount - Сумма для блокировки
   * @param currency - Валюта
   * @returns Обновленный баланс
   */
  async lockBalance(
    walletId: string,
    amount: Decimal,
    currency: string = 'TON',
  ) {
    // Используем транзакцию для атомарности
    return this.prisma.$transaction(async (tx) => {
      const balance = await tx.balance.findUnique({
        where: {
          walletId_currency: {
            walletId,
            currency,
          },
        },
      });

      if (!balance) {
        throw new NotFoundException('Баланс не найден');
      }

      const availableAmount = new Decimal(balance.amount).minus(
        new Decimal(balance.lockedAmount),
      );

      if (availableAmount.lt(amount)) {
        throw new BadRequestException(
          `Недостаточно средств. Доступно: ${availableAmount.toString()}, требуется: ${amount.toString()}`,
        );
      }

      const newLockedAmount = new Decimal(balance.lockedAmount).plus(amount);

      return tx.balance.update({
        where: {
          walletId_currency: {
            walletId,
            currency,
          },
        },
        data: {
          lockedAmount: newLockedAmount,
        },
      });
    });
  }

  /**
   * Разблокировка средств
   * 
   * @param walletId - ID кошелька
   * @param amount - Сумма для разблокировки
   * @param currency - Валюта
   * @returns Обновленный баланс
   */
  async unlockBalance(
    walletId: string,
    amount: Decimal,
    currency: string = 'TON',
  ) {
    return this.prisma.$transaction(async (tx) => {
      const balance = await tx.balance.findUnique({
        where: {
          walletId_currency: {
            walletId,
            currency,
          },
        },
      });

      if (!balance) {
        throw new NotFoundException('Баланс не найден');
      }

      const currentLocked = new Decimal(balance.lockedAmount);
      const unlockAmount = Decimal.min(amount, currentLocked);
      const newLockedAmount = currentLocked.minus(unlockAmount);

      return tx.balance.update({
        where: {
          walletId_currency: {
            walletId,
            currency,
          },
        },
        data: {
          lockedAmount: newLockedAmount.gte(0) ? newLockedAmount : new Decimal(0),
        },
      });
    });
  }

  /**
   * Списание средств (с разблокировкой)
   * 
   * @param walletId - ID кошелька
   * @param amount - Сумма для списания
   * @param currency - Валюта
   * @returns Обновленный баланс
   */
  async deductBalance(
    walletId: string,
    amount: Decimal,
    currency: string = 'TON',
  ) {
    return this.prisma.$transaction(async (tx) => {
      const balance = await tx.balance.findUnique({
        where: {
          walletId_currency: {
            walletId,
            currency,
          },
        },
      });

      if (!balance) {
        throw new NotFoundException('Баланс не найден');
      }

      const currentAmount = new Decimal(balance.amount);
      const currentLocked = new Decimal(balance.lockedAmount);

      if (currentAmount.lt(amount)) {
        throw new BadRequestException('Недостаточно средств');
      }

      // Разблокируем и списываем
      const newLockedAmount = Decimal.max(
        currentLocked.minus(amount),
        new Decimal(0),
      );
      const newAmount = currentAmount.minus(amount);

      return tx.balance.update({
        where: {
          walletId_currency: {
            walletId,
            currency,
          },
        },
        data: {
          amount: newAmount,
          lockedAmount: newLockedAmount,
        },
      });
    });
  }

  /**
   * Зачисление средств
   * 
   * @param walletId - ID кошелька
   * @param amount - Сумма для зачисления
   * @param currency - Валюта
   * @returns Обновленный баланс
   */
  async creditBalance(
    walletId: string,
    amount: Decimal,
    currency: string = 'TON',
  ) {
    return this.prisma.$transaction(async (tx) => {
      const balance = await tx.balance.findUnique({
        where: {
          walletId_currency: {
            walletId,
            currency,
          },
        },
      });

      if (!balance) {
        // Создаем баланс если его нет
        return tx.balance.create({
          data: {
            walletId,
            currency,
            amount,
            lockedAmount: new Decimal(0),
          },
        });
      }

      const newAmount = new Decimal(balance.amount).plus(amount);

      return tx.balance.update({
        where: {
          walletId_currency: {
            walletId,
            currency,
          },
        },
        data: {
          amount: newAmount,
        },
      });
    });
  }
}


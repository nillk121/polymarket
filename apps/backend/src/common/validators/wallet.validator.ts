import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Decimal from 'decimal.js';

/**
 * Валидатор для кошельков
 */
@Injectable()
export class WalletValidator {
  constructor(private prisma: PrismaService) {}

  /**
   * Проверка существования кошелька
   */
  async validateWalletExists(walletId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
      include: {
        balances: true,
      },
    });

    if (!wallet) {
      throw new NotFoundException('Кошелек не найден');
    }

    return wallet;
  }

  /**
   * Проверка принадлежности кошелька пользователю
   */
  validateWalletOwnership(wallet: any, userId: string) {
    if (wallet.userId !== userId) {
      throw new ForbiddenException('Кошелек не принадлежит пользователю');
    }
  }

  /**
   * Проверка активности кошелька
   */
  validateWalletActive(wallet: any) {
    if (!wallet.isActive) {
      throw new BadRequestException('Кошелек неактивен');
    }
  }

  /**
   * Проверка достаточности баланса
   */
  validateSufficientBalance(
    wallet: any,
    currency: string,
    requiredAmount: Decimal,
  ) {
    const balance = wallet.balances?.find((b: any) => b.currency === currency);

    if (!balance) {
      throw new BadRequestException(`Баланс в валюте ${currency} не найден`);
    }

    const balanceAmount = new Decimal(balance.amount);
    const lockedAmount = new Decimal(balance.lockedAmount || 0);
    const availableAmount = balanceAmount.minus(lockedAmount);

    if (availableAmount.lessThan(requiredAmount)) {
      throw new BadRequestException(
        `Недостаточно средств. Доступно: ${availableAmount.toString()}, требуется: ${requiredAmount.toString()}`,
      );
    }
  }

  /**
   * Комплексная валидация кошелька для операции
   */
  async validateWalletForOperation(
    walletId: string,
    userId: string,
    currency: string,
    requiredAmount?: Decimal,
  ) {
    const wallet = await this.validateWalletExists(walletId);
    this.validateWalletOwnership(wallet, userId);
    this.validateWalletActive(wallet);

    if (requiredAmount) {
      this.validateSufficientBalance(wallet, currency, requiredAmount);
    }

    return wallet;
  }
}


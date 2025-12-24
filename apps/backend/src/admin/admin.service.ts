import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BalanceService } from '../bets/services/balance.service';
import { TransactionService, TransactionType, TransactionStatus } from '../bets/services/transaction.service';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import Decimal from 'decimal.js';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private balanceService: BalanceService,
    private transactionService: TransactionService,
  ) {}

  async getDashboard() {
    const [
      totalUsers,
      totalMarkets,
      totalBets,
      totalTransactions,
      activeMarkets,
      depositsResult,
      payoutsResult,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.market.count(),
      this.prisma.bet.count(),
      this.prisma.transaction.count(),
      this.prisma.market.count({ where: { status: 'active' } }),
      // Общий объем депозитов
      this.prisma.transaction.aggregate({
        where: {
          type: 'deposit',
          status: 'completed',
        },
        _sum: {
          amount: true,
        },
      }),
      // Общее количество выплат
      this.prisma.payout.count({
        where: {
          status: 'completed',
        },
      }),
    ]);

    // Расчет общего объема (сумма всех депозитов в TON)
    const totalVolume = depositsResult._sum.amount
      ? new Decimal(depositsResult._sum.amount.toString()).toNumber()
      : 0;

    return {
      totalUsers,
      totalMarkets,
      totalBets,
      totalTransactions,
      activeMarkets,
      totalVolume,
      totalPayouts: payoutsResult,
    };
  }

  async getAuditLogs(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.adminAuditLog.count(),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Пополнение или списание баланса пользователя
   */
  async adjustBalance(adjustBalanceDto: AdjustBalanceDto, adminId: string) {
    const { userId, walletId, type, amount, currency, description } = adjustBalanceDto;
    const amountDecimal = new Decimal(amount);

    // Проверка существования пользователя
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Проверка существования кошелька
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
      include: { user: true },
    });

    if (!wallet) {
      throw new NotFoundException('Кошелек не найден');
    }

    if (wallet.userId !== userId) {
      throw new BadRequestException('Кошелек не принадлежит указанному пользователю');
    }

    return this.prisma.$transaction(async (tx) => {
      // Изменение баланса
      if (type === 'credit') {
        await this.balanceService.creditBalance(walletId, amountDecimal, currency);
      } else {
        await this.balanceService.deductBalance(walletId, amountDecimal, currency);
      }

      // Создание транзакции
      const transaction = await this.transactionService.createTransaction(
        userId,
        walletId,
        null,
        amountDecimal,
        type === 'credit' ? TransactionType.ADMIN_ADJUSTMENT : TransactionType.ADMIN_ADJUSTMENT,
        currency,
        {
          adminId,
          description: description || `Административное ${type === 'credit' ? 'пополнение' : 'списание'}`,
          adjustmentType: type,
        },
      );

      // Подтверждение транзакции
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.COMPLETED,
        },
      });

      // Создание записи в аудит-логе
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: type === 'credit' ? 'balance_credit' : 'balance_debit',
          resourceType: 'balance',
          resourceId: walletId,
          newValues: {
            userId,
            walletId,
            amount: amountDecimal.toString(),
            currency,
            description,
          },
        },
      });

      // Получение обновленного баланса
      const updatedBalance = await this.balanceService.getBalance(walletId, currency);

      return {
        success: true,
        transaction,
        balance: updatedBalance,
        message: `Баланс успешно ${type === 'credit' ? 'пополнен' : 'списан'}`,
      };
    });
  }

  /**
   * Получить список пользователей с балансами
   */
  async getUsersBalances(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { telegramId: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          wallets: {
            where: { isActive: true },
            include: {
              balances: {
                orderBy: { currency: 'asc' },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

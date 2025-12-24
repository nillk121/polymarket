import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PayoutCalculationService } from './services/payout-calculation.service';
import { PayoutExecutionService } from './services/payout-execution.service';
import { PayoutAuditService } from './services/payout-audit.service';
import Decimal from 'decimal.js';

/**
 * Основной сервис для управления выплатами
 */
@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    private prisma: PrismaService,
    private payoutCalculationService: PayoutCalculationService,
    private payoutExecutionService: PayoutExecutionService,
    private payoutAuditService: PayoutAuditService,
  ) {}

  /**
   * Автоматическая выплата после разрешения рынка
   */
  async processMarketPayouts(marketId: string, resolvedOutcomeId: string) {
    this.logger.log(
      `Processing payouts for market ${marketId}, resolved outcome: ${resolvedOutcomeId}`,
    );

    // Получаем все активные ставки на этом рынке
    const bets = await this.prisma.bet.findMany({
      where: {
        marketId,
        status: 'active',
      },
      include: {
        user: true,
        market: true,
        outcome: true,
        wallet: true,
      },
    });

    this.logger.log(`Found ${bets.length} active bets to process`);

    const payoutPromises = bets.map((bet) =>
      this.processBetPayout(bet, resolvedOutcomeId),
    );

    const results = await Promise.allSettled(payoutPromises);

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    this.logger.log(
      `Payout processing completed. Successful: ${successful}, Failed: ${failed}`,
    );

    return {
      total: bets.length,
      successful,
      failed,
    };
  }

  /**
   * Обработка выплаты для одной ставки
   */
  async processBetPayout(bet: any, resolvedOutcomeId: string) {
    // Проверка на двойную выплату
    const existingPayout = await this.prisma.payout.findFirst({
      where: {
        betId: bet.id,
        status: {
          in: ['pending', 'processing', 'completed'],
        },
      },
    });

    if (existingPayout) {
      this.logger.warn(
        `Payout already exists for bet ${bet.id}. Skipping to prevent double payout.`,
      );
      throw new ConflictException(
        `Payout already exists for bet ${bet.id}`,
      );
    }

    // Определяем, выиграла ли ставка
    const isWinningBet = bet.outcomeId === resolvedOutcomeId;
    const isLosingBet = !isWinningBet;

    // Получаем комиссию рынка
    const feeRate = new Decimal(bet.market.feeRate?.toString() || '0.05');

    let payoutAmount: Decimal;
    let fee: Decimal;
    let grossPayout: Decimal;

    if (isWinningBet) {
      // Выигравшая ставка
      if (bet.type === 'buy') {
        // BUY ставка: выплата = shares (каждая акция стоит 1 при разрешении)
        const calculation = this.payoutCalculationService.calculatePayout(
          new Decimal(bet.shares.toString()),
          new Decimal(bet.price.toString()),
          new Decimal(bet.totalCost.toString()),
          feeRate,
        );
        grossPayout = calculation.grossPayout;
        fee = calculation.fee;
        payoutAmount = calculation.netPayout;
      } else {
        // SELL ставка: выплата = выручка от продажи (уже получена)
        // Для SELL ставки на выигравший исход выплата не производится
        // (пользователь уже получил выручку при продаже)
        this.logger.log(
          `Skipping payout for SELL bet ${bet.id} on winning outcome`,
        );
        return null;
      }
    } else {
      // Проигравшая ставка - возврат части средств (опционально)
      const refundRate = new Decimal(0.1); // 10% возврат
      const refund = this.payoutCalculationService.calculateRefund(
        new Decimal(bet.totalCost.toString()),
        refundRate,
      );
      payoutAmount = refund.refundAmount;
      fee = new Decimal(0);
      grossPayout = payoutAmount;
    }

    // Валидация суммы выплаты
    if (payoutAmount.isZero() || payoutAmount.isNegative()) {
      this.logger.warn(
        `Invalid payout amount for bet ${bet.id}: ${payoutAmount.toString()}`,
      );
      return null;
    }

    this.payoutCalculationService.validatePayoutAmount(payoutAmount);

    // Создание записи о выплате
    return this.prisma.$transaction(async (tx) => {
      // Обновляем статус ставки
      const betStatus = isWinningBet ? 'won' : 'lost';
      await tx.bet.update({
        where: { id: bet.id },
        data: {
          status: betStatus,
          resolvedAt: new Date(),
        },
      });

      // Создаем выплату
      const payout = await tx.payout.create({
        data: {
          userId: bet.userId,
          betId: bet.id,
          walletId: bet.walletId,
          amount: payoutAmount,
          currency: 'TON', // Можно сделать динамическим
          status: 'pending',
        },
      });

      // Аудит-лог создания выплаты
      await this.payoutAuditService.logPayoutCreation(
        payout.id,
        bet.userId,
        bet.id,
        payoutAmount,
        'TON',
        {
          marketId: bet.marketId,
          outcomeId: bet.outcomeId,
          resolvedOutcomeId,
          betType: bet.type,
          isWinningBet,
          grossPayout: grossPayout.toString(),
          fee: fee.toString(),
          netPayout: payoutAmount.toString(),
        },
      );

      // Выполняем выплату
      try {
        await this.executePayout(payout.id);
      } catch (error) {
        this.logger.error(
          `Failed to execute payout ${payout.id}: ${error.message}`,
        );
        await this.payoutAuditService.logPayoutError(
          payout.id,
          bet.userId,
          error,
        );
        throw error;
      }

      return payout;
    });
  }

  /**
   * Выполнение выплаты
   */
  async executePayout(payoutId: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        wallet: true,
        bet: {
          include: {
            market: true,
          },
        },
      },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (payout.status === 'completed') {
      throw new ConflictException('Payout already completed');
    }

    if (payout.status === 'failed') {
      throw new BadRequestException('Payout has failed and cannot be retried');
    }

    // Аудит-лог начала обработки
    await this.payoutAuditService.logPayoutProcessing(payout.id, 'processing', {
      walletType: payout.wallet.type,
      amount: payout.amount.toString(),
    });

    const amount = new Decimal(payout.amount.toString());
    const currency = payout.currency;

    // Определяем тип выплаты
    const payoutType = this.payoutExecutionService.getPayoutType(
      payout.wallet.type,
    );

    if (payoutType === 'internal') {
      // Внутренняя выплата (зачисление на баланс)
      await this.payoutExecutionService.executeInternalPayout(
        payout.id,
        payout.walletId,
        amount,
        currency,
      );
    } else {
      // Внешняя выплата (TON Wallet, Telegram Wallet)
      const providerType = this.payoutExecutionService.getProviderType(
        payout.wallet.type,
      );

      if (!providerType) {
        throw new BadRequestException(
          `Unsupported wallet type for external payout: ${payout.wallet.type}`,
        );
      }

      await this.payoutExecutionService.executeExternalPayout(
        payout.id,
        payout.walletId,
        amount,
        currency,
        providerType,
      );
    }

    // Аудит-лог завершения
    const updatedPayout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });

    await this.payoutAuditService.logPayoutCompletion(
      payout.id,
      payout.userId,
      amount,
      currency,
      updatedPayout?.externalPayoutId || undefined,
      {
        walletType: payout.wallet.type,
        payoutType,
      },
    );

    return updatedPayout;
  }

  /**
   * Получение выплат пользователя
   */
  async findByUser(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [payouts, total] = await Promise.all([
      this.prisma.payout.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          bet: {
            include: {
              market: true,
              outcome: true,
            },
          },
          wallet: true,
          transaction: true,
        },
      }),
      this.prisma.payout.count({ where: { userId } }),
    ]);

    return {
      payouts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Получение одной выплаты
   */
  async findOne(id: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id },
      include: {
        bet: {
          include: {
            market: true,
            outcome: true,
          },
        },
        wallet: true,
        transaction: true,
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    return payout;
  }

  /**
   * Получение аудит-логов выплаты
   */
  async getAuditLogs(payoutId: string) {
    return this.payoutAuditService.getPayoutAuditHistory(payoutId);
  }

  /**
   * Повторная попытка выплаты (для failed выплат)
   */
  async retryPayout(payoutId: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (payout.status !== 'failed') {
      throw new BadRequestException(
        `Cannot retry payout with status: ${payout.status}`,
      );
    }

    // Сбрасываем статус на pending
    await this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'pending',
      },
    });

    // Повторная попытка выполнения
    return this.executePayout(payoutId);
  }
}

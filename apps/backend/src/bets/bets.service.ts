import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarketsService } from '../markets/markets.service';
import { BalanceService } from './services/balance.service';
import { TransactionService, TransactionType } from './services/transaction.service';
import { BetsGateway } from './gateways/bets.gateway';
import { PlaceBetDto, BetType } from './dto/place-bet.dto';
import { QueryBetDto } from './dto/query-bet.dto';
import {
  PricingService,
  MarketState,
  OutcomeState,
  BetType as PricingBetType,
  PricingModel,
} from '@polymarket/pricing-engine';
import Decimal from 'decimal.js';

@Injectable()
export class BetsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => MarketsService))
    private marketsService: MarketsService,
    private balanceService: BalanceService,
    private transactionService: TransactionService,
    private betsGateway: BetsGateway,
  ) {}

  /**
   * Размещение ставки
   * 
   * @param userId - ID пользователя
   * @param placeBetDto - Данные ставки
   * @returns Созданная ставка
   */
  async placeBet(userId: string, placeBetDto: PlaceBetDto) {
    // Проверка валидности данных
    if (!placeBetDto.shares && !placeBetDto.cost) {
      throw new BadRequestException(
        'Необходимо указать либо shares, либо cost',
      );
    }

    if (placeBetDto.shares && placeBetDto.cost) {
      throw new BadRequestException(
        'Укажите только shares или cost, но не оба',
      );
    }

    // Используем транзакцию для атомарности
    return this.prisma.$transaction(async (tx) => {
      // 1. Получение и валидация рынка
      const market = await tx.market.findUnique({
        where: { id: placeBetDto.marketId },
        include: {
          outcomes: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      if (!market) {
        throw new NotFoundException('Рынок не найден');
      }

      // 2. Проверка статуса рынка
      if (market.status !== 'active' && market.status !== 'locked') {
        throw new BadRequestException(
          `Невозможно разместить ставку на рынок со статусом ${market.status}`,
        );
      }

      // 3. Проверка дедлайна
      if (market.endDate && new Date(market.endDate) < new Date()) {
        throw new BadRequestException('Срок размещения ставок истек');
      }

      // 4. Проверка исхода
      const outcome = market.outcomes.find(
        (o) => o.id === placeBetDto.outcomeId,
      );
      if (!outcome) {
        throw new NotFoundException('Исход не найден в этом рынке');
      }

      if (outcome.isResolved) {
        throw new BadRequestException('Исход уже разрешен');
      }

      // 5. Проверка кошелька
      const wallet = await tx.wallet.findUnique({
        where: { id: placeBetDto.walletId },
      });

      if (!wallet) {
        throw new NotFoundException('Кошелек не найден');
      }

      if (wallet.userId !== userId) {
        throw new ForbiddenException('Кошелек принадлежит другому пользователю');
      }

      if (!wallet.isActive) {
        throw new BadRequestException('Кошелек неактивен');
      }

      // 6. Создание состояния рынка для pricing engine
      const marketState: MarketState = {
        id: market.id,
        pricingModel:
          market.pricingModel === 'lmsr'
            ? PricingModel.LMSR
            : PricingModel.CONSTANT_PRODUCT,
        liquidity: new Decimal(market.liquidity.toString()),
        feeRate: new Decimal(0.02), // TODO: получить из настроек рынка
        outcomes: market.outcomes.map(
          (o): OutcomeState => ({
            id: o.id,
            shares: new Decimal(o.shares.toString()),
            totalVolume: new Decimal(o.totalVolume.toString()),
          }),
        ),
      };

      // 7. Расчет цены и количества акций
      let shares: Decimal;
      let priceCalculation;

      if (placeBetDto.shares) {
        // Покупка определенного количества акций
        shares = new Decimal(placeBetDto.shares);
        priceCalculation = PricingService.calculatePrice({
          marketState,
          outcomeId: placeBetDto.outcomeId,
          shares,
          betType:
            placeBetDto.type === BetType.BUY
              ? PricingBetType.BUY
              : PricingBetType.SELL,
        });
      } else {
        // Покупка на определенную сумму
        const cost = new Decimal(placeBetDto.cost!);
        shares = PricingService.calculateSharesFromCost(
          marketState,
          placeBetDto.outcomeId,
          cost,
        );
        priceCalculation = PricingService.calculatePrice({
          marketState,
          outcomeId: placeBetDto.outcomeId,
          shares,
          betType:
            placeBetDto.type === BetType.BUY
              ? PricingBetType.BUY
              : PricingBetType.SELL,
        });
      }

      // 8. Проверка проскальзывания
      if (placeBetDto.maxSlippage !== undefined) {
        const maxSlippage = new Decimal(placeBetDto.maxSlippage);
        if (
          priceCalculation.slippage.abs().gt(maxSlippage)
        ) {
          throw new BadRequestException(
            `Проскальзывание ${priceCalculation.slippage.toString()}% превышает максимально допустимое ${maxSlippage.toString()}%`,
          );
        }
      }

      // 9. Проверка на двойное расходование
      const hasDuplicate = await this.transactionService.hasDuplicateTransaction(
        userId,
        placeBetDto.walletId,
        priceCalculation.totalCost,
        TransactionType.BET_PLACED,
      );

      if (hasDuplicate) {
        throw new ConflictException(
          'Обнаружена дублирующая транзакция. Пожалуйста, подождите.',
        );
      }

      // 10. Блокировка баланса
      await this.balanceService.lockBalance(
        placeBetDto.walletId,
        priceCalculation.totalCost,
      );

      // 11. Создание транзакции
      const transaction = await this.transactionService.createTransaction(
        userId,
        placeBetDto.walletId,
        null, // betId будет установлен после создания ставки
        priceCalculation.totalCost,
        TransactionType.BET_PLACED,
        'TON',
        {
          marketId: market.id,
          outcomeId: outcome.id,
          shares: shares.toString(),
          price: priceCalculation.price.toString(),
          slippage: priceCalculation.slippage.toString(),
        },
      );

      // 12. Создание ставки
      const bet = await tx.bet.create({
        data: {
          userId,
          marketId: market.id,
          outcomeId: outcome.id,
          walletId: placeBetDto.walletId,
          type: placeBetDto.type,
          shares: shares,
          price: priceCalculation.price,
          totalCost: priceCalculation.totalCost,
          potentialPayout:
            placeBetDto.type === BetType.BUY
              ? shares // При покупке потенциальный выигрыш = количество акций
              : priceCalculation.totalCost,
          status: 'pending',
          referralCode: placeBetDto.referralCode,
        },
      });

      // 13. Обновление транзакции с betId
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { betId: bet.id },
      });

      // 14. Обновление исхода (обновление пула ликвидности)
      await tx.outcome.update({
        where: { id: outcome.id },
        data: {
          shares:
            placeBetDto.type === BetType.BUY
              ? new Decimal(outcome.shares.toString()).plus(shares)
              : new Decimal(outcome.shares.toString()).minus(shares),
          totalVolume: new Decimal(outcome.totalVolume.toString()).plus(
            priceCalculation.totalCost,
          ),
        },
      });

      // 15. Обновление рынка
      await tx.market.update({
        where: { id: market.id },
        data: {
          totalVolume: new Decimal(market.totalVolume.toString()).plus(
            priceCalculation.totalCost,
          ),
          totalBets: market.totalBets + 1,
        },
      });

      // 16. Списание средств
      await this.balanceService.deductBalance(
        placeBetDto.walletId,
        priceCalculation.totalCost,
      );

      // 17. Подтверждение транзакции
      await this.transactionService.completeTransaction(transaction.id);

      // 18. Обновление статуса ставки
      const updatedBet = await tx.bet.update({
        where: { id: bet.id },
        data: { status: 'active' },
        include: {
          market: {
            include: {
              outcomes: true,
            },
          },
          outcome: true,
          wallet: true,
        },
      });

      // 19. Отправка real-time обновления
      this.betsGateway.emitBetPlaced(updatedBet);

      // 20. Отправка обновления цен
      const updatedMarket = await tx.market.findUnique({
        where: { id: market.id },
        include: { outcomes: true },
      });

      if (updatedMarket) {
        const marketState: MarketState = {
          id: updatedMarket.id,
          pricingModel:
            updatedMarket.pricingModel === 'lmsr'
              ? PricingModel.LMSR
              : PricingModel.CONSTANT_PRODUCT,
          liquidity: new Decimal(updatedMarket.liquidity.toString()),
          feeRate: new Decimal(0.02),
          outcomes: updatedMarket.outcomes.map(
            (o): OutcomeState => ({
              id: o.id,
              shares: new Decimal(o.shares.toString()),
              totalVolume: new Decimal(o.totalVolume.toString()),
            }),
          ),
        };

        const prices: Record<string, number> = {};
        for (const outcome of updatedMarket.outcomes) {
          const price = PricingService.getCurrentPrice(marketState, outcome.id);
          prices[outcome.id] = price.toNumber();
        }

        this.betsGateway.emitPriceUpdate(market.id, prices);
      }

      return updatedBet;
    });
  }

  /**
   * Отмена ставки
   */
  async cancelBet(userId: string, betId: string, reason?: string) {
    return this.prisma.$transaction(async (tx) => {
      const bet = await tx.bet.findUnique({
        where: { id: betId },
        include: {
          market: true,
        },
      });

      if (!bet) {
        throw new NotFoundException('Ставка не найдена');
      }

      if (bet.userId !== userId) {
        throw new ForbiddenException('Ставка принадлежит другому пользователю');
      }

      if (bet.status !== 'pending' && bet.status !== 'active') {
        throw new BadRequestException(
          `Невозможно отменить ставку со статусом ${bet.status}`,
        );
      }

      // Проверка статуса рынка
      if (bet.market.status === 'resolved' || bet.market.status === 'cancelled') {
        throw new BadRequestException('Рынок уже разрешен или отменен');
      }

      // Возврат средств
      await this.balanceService.unlockBalance(bet.walletId, bet.totalCost);
      await this.balanceService.creditBalance(bet.walletId, bet.totalCost);

      // Откат изменений в исходе
      const outcome = await tx.outcome.findUnique({
        where: { id: bet.outcomeId },
      });

      if (outcome) {
        await tx.outcome.update({
          where: { id: bet.outcomeId },
          data: {
            shares:
              bet.type === 'buy'
                ? new Decimal(outcome.shares.toString()).minus(bet.shares)
                : new Decimal(outcome.shares.toString()).plus(bet.shares),
            totalVolume: new Decimal(outcome.totalVolume.toString()).minus(
              bet.totalCost,
            ),
          },
        });
      }

      // Откат изменений в рынке
      await tx.market.update({
        where: { id: bet.marketId },
        data: {
          totalVolume: new Decimal(bet.market.totalVolume.toString()).minus(
            bet.totalCost,
          ),
          totalBets: Math.max(bet.market.totalBets - 1, 0),
        },
      });

      // Обновление статуса ставки
      const cancelledBet = await tx.bet.update({
        where: { id: betId },
        data: {
          status: 'cancelled',
        },
        include: {
          market: true,
          outcome: true,
          wallet: true,
        },
      });

      // Отправка real-time обновления
      this.betsGateway.emitBetCancelled(cancelledBet);

      return cancelledBet;
    });
  }

  /**
   * Получение ставок пользователя
   */
  async findByUser(userId: string, query: QueryBetDto = {}) {
    const { page = 1, limit = 20, status, marketId, outcomeId } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) where.status = status;
    if (marketId) where.marketId = marketId;
    if (outcomeId) where.outcomeId = outcomeId;

    const [bets, total] = await Promise.all([
      this.prisma.bet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          market: {
            include: {
              category: true,
              outcomes: true,
            },
          },
          outcome: true,
          wallet: true,
        },
      }),
      this.prisma.bet.count({ where }),
    ]);

    return {
      bets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Получение ставки по ID
   */
  async findOne(betId: string, userId?: string) {
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
      include: {
        market: {
          include: {
            category: true,
            outcomes: true,
          },
        },
        outcome: true,
        wallet: true,
        transactions: true,
      },
    });

    if (!bet) {
      throw new NotFoundException('Ставка не найдена');
    }

    if (userId && bet.userId !== userId) {
      throw new ForbiddenException('Ставка принадлежит другому пользователю');
    }

    return bet;
  }
}

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderType, OrderStatus, PaymentMethod } from './entities/order.entity';
import { MarketsService } from '../markets/markets.service';
import { PricingService } from '../markets/pricing.service';
import { UsersService } from '../users/users.service';
import { PaymentsService } from '../payments/payments.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { MarketOutcome } from '../markets/entities/market-outcome.entity';
import { UserPosition } from '../markets/entities/user-position.entity';
import Decimal from 'decimal.js';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private marketsService: MarketsService,
    private pricingService: PricingService,
    private usersService: UsersService,
    private paymentsService: PaymentsService,
    private analyticsService: AnalyticsService,
    private dataSource: DataSource,
  ) {}

  async createOrder(
    userId: string,
    marketId: string,
    outcomeId: string,
    type: OrderType,
    shares: number,
    paymentMethod: PaymentMethod,
    referralCode?: string,
  ): Promise<Order> {
    const market = await this.marketsService.findOne(marketId);
    const outcome = market.outcomes.find((o) => o.id === outcomeId);

    if (!outcome) {
      throw new NotFoundException('Исход не найден');
    }

    if (market.status !== 'open') {
      throw new BadRequestException('Рынок закрыт');
    }

    const sharesDecimal = new Decimal(shares);
    const otherOutcomes = market.outcomes.filter((o) => o.id !== outcomeId);
    const liquidity = new Decimal(market.liquidity || 0);

    // Вычисляем стоимость
    const cost = this.pricingService.calculateCost(
      market.pricingModel,
      outcome,
      otherOutcomes,
      liquidity,
      sharesDecimal,
    );

    // Проверяем баланс пользователя
    const user = await this.usersService.findOne(userId);
    let hasBalance = false;

    switch (paymentMethod) {
      case PaymentMethod.TON_WALLET:
        hasBalance = new Decimal(user.tonBalance).gte(cost);
        break;
      case PaymentMethod.TELEGRAM_STARS:
        hasBalance = user.starsBalance >= cost.toNumber();
        break;
      case PaymentMethod.TELEGRAM_WALLET:
        hasBalance = new Decimal(user.balance).gte(cost);
        break;
    }

    if (!hasBalance) {
      throw new BadRequestException('Недостаточно средств');
    }

    // Создаем заказ
    const order = this.ordersRepository.create({
      userId,
      marketId,
      outcomeId,
      type,
      shares: sharesDecimal.toNumber(),
      price: cost.div(sharesDecimal).toNumber(),
      totalCost: cost.toNumber(),
      paymentMethod,
      referralCode,
      status: OrderStatus.PENDING,
    });

    // Используем транзакцию для атомарности
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Обрабатываем платеж
      const paymentResult = await this.paymentsService.processPayment(
        userId,
        cost.toNumber(),
        paymentMethod,
      );

      if (!paymentResult.success) {
        throw new BadRequestException('Ошибка обработки платежа');
      }

      order.paymentTransactionId = paymentResult.transactionId;

      // Обновляем баланс пользователя
      switch (paymentMethod) {
        case PaymentMethod.TON_WALLET:
          await this.usersService.updateTonBalance(userId, cost.toNumber(), 'subtract');
          break;
        case PaymentMethod.TELEGRAM_STARS:
          await this.usersService.updateStarsBalance(userId, cost.toNumber(), 'subtract');
          break;
        case PaymentMethod.TELEGRAM_WALLET:
          await this.usersService.updateBalance(userId, cost.toNumber(), 'subtract');
          break;
      }

      // Обновляем количество акций исхода
      const outcomeRepo = queryRunner.manager.getRepository(MarketOutcome);
      await outcomeRepo.increment({ id: outcomeId }, 'shares', shares);

      // Обновляем или создаем позицию пользователя
      const positionRepo = queryRunner.manager.getRepository(UserPosition);
      let position = await positionRepo.findOne({
        where: { userId, marketId, outcomeId },
      });

      if (position) {
        const totalShares = new Decimal(position.shares).plus(sharesDecimal);
        const totalCost = new Decimal(position.averagePrice)
          .mul(position.shares)
          .plus(cost);
        position.shares = totalShares.toNumber();
        position.averagePrice = totalCost.div(totalShares).toNumber();
      } else {
        position = positionRepo.create({
          userId,
          marketId,
          outcomeId,
          shares: sharesDecimal.toNumber(),
          averagePrice: cost.div(sharesDecimal).toNumber(),
        });
      }

      await positionRepo.save(position);

      // Сохраняем заказ
      order.status = OrderStatus.COMPLETED;
      const savedOrder = await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();

      // Логируем аналитику
      await this.analyticsService.trackEvent(userId, 'order_complete', {
        marketId,
        orderId: savedOrder.id,
        amount: cost.toNumber(),
        paymentMethod,
      });

      return savedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      order.status = OrderStatus.FAILED;
      await this.ordersRepository.save(order);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getUserOrders(userId: string, page: number = 1, limit: number = 20) {
    const [orders, total] = await this.ordersRepository.findAndCount({
      where: { userId },
      relations: ['market', 'outcome'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { orders, total };
  }

  async getOrder(id: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['market', 'outcome', 'user'],
    });

    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }

    return order;
  }
}


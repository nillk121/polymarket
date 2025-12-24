import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Market, MarketStatus, PricingModel } from './entities/market.entity';
import { MarketOutcome } from './entities/market-outcome.entity';
import { UserPosition } from './entities/user-position.entity';
import { PricingService } from './pricing.service';
import Decimal from 'decimal.js';

@Injectable()
export class MarketsService {
  constructor(
    @InjectRepository(Market)
    private marketsRepository: Repository<Market>,
    @InjectRepository(MarketOutcome)
    private outcomesRepository: Repository<MarketOutcome>,
    @InjectRepository(UserPosition)
    private positionsRepository: Repository<UserPosition>,
    private pricingService: PricingService,
  ) {}

  async create(
    data: {
      title: string;
      description: string;
      type: 'binary' | 'multi';
      pricingModel: PricingModel;
      liquidity: number;
      outcomes: string[];
      endDate?: Date;
      createdBy: string;
    },
  ): Promise<Market> {
    const market = this.marketsRepository.create({
      title: data.title,
      description: data.description,
      type: data.type as any,
      pricingModel: data.pricingModel,
      liquidity: data.liquidity,
      endDate: data.endDate,
      createdById: data.createdBy,
      status: MarketStatus.OPEN,
    });

    const savedMarket = await this.marketsRepository.save(market);

    // Создаем исходы
    const outcomes = data.outcomes.map((title) =>
      this.outcomesRepository.create({
        marketId: savedMarket.id,
        title,
        shares: 0,
        probability: 1 / data.outcomes.length,
      }),
    );

    await this.outcomesRepository.save(outcomes);
    savedMarket.outcomes = outcomes;

    return savedMarket;
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    status?: MarketStatus,
  ): Promise<{ markets: Market[]; total: number }> {
    const query = this.marketsRepository
      .createQueryBuilder('market')
      .leftJoinAndSelect('market.outcomes', 'outcomes')
      .leftJoinAndSelect('market.creator', 'creator')
      .orderBy('market.createdAt', 'DESC');

    if (status) {
      query.where('market.status = :status', { status });
    }

    const [markets, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Обновляем вероятности для каждого рынка
    for (const market of markets) {
      await this.updateMarketProbabilities(market);
    }

    return { markets, total };
  }

  async findOne(id: string): Promise<Market> {
    const market = await this.marketsRepository.findOne({
      where: { id },
      relations: ['outcomes', 'creator'],
    });

    if (!market) {
      throw new NotFoundException('Рынок не найден');
    }

    await this.updateMarketProbabilities(market);
    return market;
  }

  async resolve(
    marketId: string,
    outcomeId: string,
    adminId: string,
  ): Promise<Market> {
    const market = await this.findOne(marketId);

    if (market.status !== MarketStatus.OPEN) {
      throw new BadRequestException('Рынок уже закрыт или разрешен');
    }

    const outcome = market.outcomes.find((o) => o.id === outcomeId);
    if (!outcome) {
      throw new NotFoundException('Исход не найден');
    }

    market.status = MarketStatus.RESOLVED;
    market.resolvedOutcomeId = outcomeId;
    market.resolutionDate = new Date();

    outcome.isResolved = true;
    await this.outcomesRepository.save(outcome);
    await this.marketsRepository.save(market);

    // TODO: Выплата выигрышей пользователям

    return market;
  }

  async getUserPosition(
    userId: string,
    marketId: string,
  ): Promise<UserPosition[]> {
    return this.positionsRepository.find({
      where: { userId, marketId },
      relations: ['outcome'],
    });
  }

  async updateMarketProbabilities(market: Market): Promise<void> {
    if (!market.outcomes || market.outcomes.length === 0) {
      return;
    }

    const liquidity = new Decimal(market.liquidity || 0);

    for (const outcome of market.outcomes) {
      const otherOutcomes = market.outcomes.filter((o) => o.id !== outcome.id);
      const probability = this.pricingService.calculatePrice(
        market.pricingModel,
        outcome,
        otherOutcomes,
        liquidity,
      );

      outcome.probability = probability.toNumber();
      await this.outcomesRepository.save(outcome);
    }
  }

  async getMarketStats(marketId: string) {
    const market = await this.findOne(marketId);
    const positions = await this.positionsRepository.find({
      where: { marketId },
    });

    const totalVolume = positions.reduce(
      (sum, p) => sum.plus(new Decimal(p.shares).mul(p.averagePrice)),
      new Decimal(0),
    );

    return {
      totalPositions: positions.length,
      totalVolume: totalVolume.toNumber(),
      liquidity: market.liquidity,
    };
  }
}


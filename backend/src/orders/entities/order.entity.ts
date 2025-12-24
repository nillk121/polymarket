import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Market } from '../../markets/entities/market.entity';
import { MarketOutcome } from '../../markets/entities/market-outcome.entity';

export enum OrderType {
  BUY = 'buy',
  SELL = 'sell',
}

export enum OrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export enum PaymentMethod {
  TON_WALLET = 'ton_wallet',
  TELEGRAM_WALLET = 'telegram_wallet',
  TELEGRAM_STARS = 'telegram_stars',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Market, (market) => market.orders)
  @JoinColumn({ name: 'marketId' })
  market: Market;

  @Column()
  marketId: string;

  @ManyToOne(() => MarketOutcome)
  @JoinColumn({ name: 'outcomeId' })
  outcome: MarketOutcome;

  @Column()
  outcomeId: string;

  @Column({
    type: 'enum',
    enum: OrderType,
  })
  type: OrderType;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  shares: number;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  price: number;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  totalCost: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  paymentTransactionId: string;

  @Column({ nullable: true })
  referralCode: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


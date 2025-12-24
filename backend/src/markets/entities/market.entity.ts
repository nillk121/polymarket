import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { UserPosition } from './user-position.entity';
import { MarketOutcome } from './market-outcome.entity';

export enum MarketStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled',
}

export enum MarketType {
  BINARY = 'binary',
  MULTI = 'multi',
}

export enum PricingModel {
  LMSR = 'lmsr',
  CONSTANT_PRODUCT = 'constant_product',
}

@Entity('markets')
export class Market {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: MarketStatus,
    default: MarketStatus.OPEN,
  })
  status: MarketStatus;

  @Column({
    type: 'enum',
    enum: MarketType,
    default: MarketType.BINARY,
  })
  type: MarketType;

  @Column({
    type: 'enum',
    enum: PricingModel,
    default: PricingModel.LMSR,
  })
  pricingModel: PricingModel;

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  liquidity: number;

  @Column({ nullable: true })
  resolvedOutcomeId: string;

  @Column({ nullable: true })
  resolutionDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  telegramChannelId: string;

  @Column({ nullable: true })
  telegramMessageId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  creator: User;

  @Column()
  createdById: string;

  @OneToMany(() => MarketOutcome, (outcome) => outcome.market, {
    cascade: true,
  })
  outcomes: MarketOutcome[];

  @OneToMany(() => Order, (order) => order.market)
  orders: Order[];

  @OneToMany(() => UserPosition, (position) => position.market)
  positions: UserPosition[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


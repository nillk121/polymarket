import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Market } from '../../markets/entities/market.entity';

export enum EventType {
  MARKET_VIEW = 'market_view',
  MARKET_CREATE = 'market_create',
  ORDER_PLACE = 'order_place',
  ORDER_COMPLETE = 'order_complete',
  USER_REGISTER = 'user_register',
  USER_LOGIN = 'user_login',
  PAYMENT_INIT = 'payment_init',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAIL = 'payment_fail',
  REFERRAL_CLICK = 'referral_click',
}

@Entity('analytics_events')
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => Market, { nullable: true })
  @JoinColumn({ name: 'marketId' })
  market: Market;

  @Column({ nullable: true })
  marketId: string;

  @Column({
    type: 'enum',
    enum: EventType,
  })
  eventType: EventType;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  referrer: string;

  @Column({ nullable: true })
  utmSource: string;

  @Column({ nullable: true })
  utmMedium: string;

  @Column({ nullable: true })
  utmCampaign: string;

  @Column({ nullable: true })
  referralCode: string;

  @CreateDateColumn()
  createdAt: Date;
}


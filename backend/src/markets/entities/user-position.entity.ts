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
import { Market } from './market.entity';
import { MarketOutcome } from './market-outcome.entity';

@Entity('user_positions')
export class UserPosition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.positions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Market, (market) => market.positions)
  @JoinColumn({ name: 'marketId' })
  market: Market;

  @Column()
  marketId: string;

  @ManyToOne(() => MarketOutcome)
  @JoinColumn({ name: 'outcomeId' })
  outcome: MarketOutcome;

  @Column()
  outcomeId: string;

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  shares: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  averagePrice: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


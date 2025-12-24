import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Market } from './market.entity';

@Entity('market_outcomes')
export class MarketOutcome {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Market, (market) => market.outcomes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'marketId' })
  market: Market;

  @Column()
  marketId: string;

  @Column()
  title: string;

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  probability: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  shares: number;

  @Column({ default: false })
  isResolved: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


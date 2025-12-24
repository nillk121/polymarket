import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { UserPosition } from '../../markets/entities/user-position.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  telegramId: string;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ default: 0, type: 'decimal', precision: 20, scale: 8 })
  balance: number;

  @Column({ default: 0, type: 'decimal', precision: 20, scale: 8 })
  tonBalance: number;

  @Column({ default: 0 })
  starsBalance: number;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ nullable: true })
  referralCode: string;

  @Column({ nullable: true })
  referredBy: string;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => UserPosition, (position) => position.user)
  positions: UserPosition[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


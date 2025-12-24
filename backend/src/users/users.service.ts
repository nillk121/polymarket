import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOrCreateByTelegramId(
    telegramId: string,
    data: {
      username?: string;
      firstName?: string;
      lastName?: string;
    },
  ): Promise<User> {
    let user = await this.usersRepository.findOne({
      where: { telegramId },
    });

    if (!user) {
      user = this.usersRepository.create({
        telegramId,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        referralCode: this.generateReferralCode(),
      });
      await this.usersRepository.save(user);
    } else {
      // Обновляем данные пользователя
      user.username = data.username || user.username;
      user.firstName = data.firstName || user.firstName;
      user.lastName = data.lastName || user.lastName;
      await this.usersRepository.save(user);
    }

    return user;
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return user;
  }

  async findByTelegramId(telegramId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { telegramId } });
  }

  async findByReferralCode(referralCode: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { referralCode } });
  }

  async updateBalance(
    userId: string,
    amount: number,
    type: 'add' | 'subtract',
  ): Promise<User> {
    const user = await this.findOne(userId);
    if (type === 'add') {
      user.balance = Number(user.balance) + amount;
    } else {
      user.balance = Math.max(0, Number(user.balance) - amount);
    }
    return this.usersRepository.save(user);
  }

  async updateTonBalance(
    userId: string,
    amount: number,
    type: 'add' | 'subtract',
  ): Promise<User> {
    const user = await this.findOne(userId);
    if (type === 'add') {
      user.tonBalance = Number(user.tonBalance) + amount;
    } else {
      user.tonBalance = Math.max(0, Number(user.tonBalance) - amount);
    }
    return this.usersRepository.save(user);
  }

  async updateStarsBalance(
    userId: string,
    amount: number,
    type: 'add' | 'subtract',
  ): Promise<User> {
    const user = await this.findOne(userId);
    if (type === 'add') {
      user.starsBalance = Number(user.starsBalance) + amount;
    } else {
      user.starsBalance = Math.max(0, Number(user.starsBalance) - amount);
    }
    return this.usersRepository.save(user);
  }

  async setReferrer(userId: string, referrerCode: string): Promise<User> {
    const user = await this.findOne(userId);
    if (user.referredBy) {
      return user; // Уже есть реферер
    }

    const referrer = await this.findByReferralCode(referrerCode);
    if (referrer && referrer.id !== user.id) {
      user.referredBy = referrer.id;
      return this.usersRepository.save(user);
    }

    return user;
  }

  private generateReferralCode(): string {
    return crypto.randomBytes(8).toString('hex');
  }
}


import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

export interface TelegramAuthData {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateTelegramUser(authData: TelegramAuthData): Promise<User> {
    // В production здесь должна быть проверка hash от Telegram
    const user = await this.usersService.findOrCreateByTelegramId(
      authData.id,
      {
        username: authData.username,
        firstName: authData.first_name,
        lastName: authData.last_name,
      },
    );

    return user;
  }

  async login(user: User) {
    const payload = {
      sub: user.id,
      telegramId: user.telegramId,
      isAdmin: user.isAdmin,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        balance: user.balance,
        tonBalance: user.tonBalance,
        starsBalance: user.starsBalance,
        isAdmin: user.isAdmin,
      },
    };
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    return user;
  }
}


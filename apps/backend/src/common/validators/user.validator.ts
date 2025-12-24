import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Валидатор для пользователей
 */
@Injectable()
export class UserValidator {
  constructor(private prisma: PrismaService) {}

  /**
   * Проверка существования пользователя
   */
  async validateUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  /**
   * Проверка активности пользователя
   */
  validateUserActive(user: any) {
    if (!user.isActive) {
      throw new BadRequestException('Пользователь неактивен');
    }
  }

  /**
   * Комплексная валидация пользователя
   */
  async validateUserActiveExists(userId: string) {
    const user = await this.validateUserExists(userId);
    this.validateUserActive(user);
    return user;
  }
}


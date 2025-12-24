import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        wallets: {
          include: {
            balances: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  async findByTelegramId(telegramId: string) {
    return this.prisma.user.findUnique({
      where: { telegramId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Получить кошельки пользователя по Telegram ID
   * Автоматически создает пользователя и кошелек, если их нет
   */
  async getUserWallets(telegramId: string) {
    // Сначала пытаемся найти пользователя
    let user = await this.prisma.user.findUnique({
      where: { telegramId },
      include: {
        wallets: {
          where: { isActive: true },
          include: {
            balances: {
              orderBy: { currency: 'asc' },
            },
          },
        },
      },
    });

    // Если пользователь не найден, создаем его
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          telegramId,
          isActive: true,
          roles: {
            create: {
              role: {
                connect: { name: 'user' },
              },
            },
          },
          wallets: {
            create: {
              type: 'internal',
              isActive: true,
              balances: {
                create: {
                  currency: 'TON',
                  amount: 0,
                  lockedAmount: 0,
                  availableAmount: 0,
                },
              },
            },
          },
        },
        include: {
          wallets: {
            where: { isActive: true },
            include: {
              balances: {
                orderBy: { currency: 'asc' },
              },
            },
          },
        },
      });
    }

    // Если у пользователя нет активного кошелька, создаем его
    if (!user.wallets || user.wallets.length === 0) {
      const wallet = await this.prisma.wallet.create({
        data: {
          userId: user.id,
          type: 'internal',
          isActive: true,
          balances: {
            create: {
              currency: 'TON',
              amount: 0,
              lockedAmount: 0,
              availableAmount: 0,
            },
          },
        },
        include: {
          balances: {
            orderBy: { currency: 'asc' },
          },
        },
      });

      return [wallet];
    }

    return user.wallets;
  }

  /**
   * Получить кошельки пользователя по ID пользователя
   */
  async getWalletsByUserId(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: {
          where: { isActive: true },
          include: {
            balances: {
              orderBy: { currency: 'asc' },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Если у пользователя нет активного кошелька, создаем его
    if (!user.wallets || user.wallets.length === 0) {
      const wallet = await this.prisma.wallet.create({
        data: {
          userId: user.id,
          type: 'internal',
          isActive: true,
          balances: {
            create: {
              currency: 'TON',
              amount: 0,
              lockedAmount: 0,
              availableAmount: 0,
            },
          },
        },
        include: {
          balances: {
            orderBy: { currency: 'asc' },
          },
        },
      });

      return [wallet];
    }

    return user.wallets;
  }

  /**
   * Получить кошельки пользователя по Telegram ID (для совместимости)
   * @deprecated Используйте getUserWallets
   */
  async findUserWalletsByTelegramId(telegramId: string) {
    return this.getUserWallets(telegramId);
  }
}

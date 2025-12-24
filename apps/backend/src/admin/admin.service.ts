import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const [
      totalUsers,
      totalMarkets,
      totalBets,
      totalTransactions,
      activeMarkets,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.market.count(),
      this.prisma.bet.count(),
      this.prisma.transaction.count(),
      this.prisma.market.count({ where: { status: 'open' } }),
    ]);

    return {
      totalUsers,
      totalMarkets,
      totalBets,
      totalTransactions,
      activeMarkets,
    };
  }

  async getAuditLogs(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.adminAuditLog.count(),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

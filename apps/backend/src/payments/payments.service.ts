import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class PaymentsService {
  private readonly botToken: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.botToken = this.configService.get('TELEGRAM_BOT_TOKEN') || '';
  }

  async processPayment(userId: string, data: any) {
    return this.prisma.transaction.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async getTransactions(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({ where: { userId } }),
    ]);

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Создание invoice URL через Telegram Bot API для WebApp.openInvoice()
   */
  async createInvoiceUrl(
    paymentResult: any,
    provider: string,
    amount: number,
    currency: string,
    description?: string,
  ): Promise<string> {
    if (!this.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN не установлен');
    }

    const title = description || `Пополнение баланса на ${amount} ${currency === 'XTR' ? 'Stars' : currency}`;
    const payload = paymentResult.paymentId || paymentResult.transactionId;

    // Формируем prices в зависимости от валюты
    let prices: Array<{ label: string; amount: number }>;
    if (currency === 'XTR') {
      // Telegram Stars - целое число
      prices = [{ label: `${amount} Stars`, amount: Math.round(amount) }];
    } else if (currency === 'TON') {
      // TON - в нанотонах (1 TON = 10^9 нанотонов)
      prices = [{ label: `${amount} TON`, amount: Math.round(amount * 1000000000) }];
    } else {
      prices = [{ label: `${amount} ${currency}`, amount: Math.round(amount * 100) }];
    }

    // Вызываем Telegram Bot API для создания invoice link
    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/createInvoiceLink`,
        {
          title,
          description: description || title,
          payload,
          currency,
          prices,
          provider_token: provider === 'telegram_wallet' 
            ? this.configService.get('TELEGRAM_WALLET_PROVIDER_TOKEN') || ''
            : '',
        },
      );

      if (response.data.ok && response.data.result) {
        return response.data.result;
      } else {
        throw new Error('Не удалось создать invoice link');
      }
    } catch (error: any) {
      console.error('Error creating invoice link:', error.response?.data || error.message);
      throw new Error(`Ошибка создания invoice: ${error.response?.data?.description || error.message}`);
    }
  }
}

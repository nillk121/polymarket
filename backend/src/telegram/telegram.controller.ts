import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('webhook')
  async webhook(@Body() update: any) {
    await this.telegramService.handleWebhook(update);
    return { ok: true };
  }

  @Post('send-market')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async sendMarket(
    @Body() body: { channelId: string; marketId: string },
  ) {
    const messageId = await this.telegramService.sendMarketToChannel(
      body.channelId,
      body.marketId,
    );
    return { messageId };
  }
}


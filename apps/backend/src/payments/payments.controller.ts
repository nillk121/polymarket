import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentGatewayService } from './services/payment-gateway.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentProviderType } from './interfaces/payment-provider.interface';
import Decimal from 'decimal.js';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paymentGatewayService: PaymentGatewayService,
  ) {}

  /**
   * Создание платежа
   * POST /payments
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentGatewayService.createPayment(
      user.id,
      createPaymentDto.provider,
      new Decimal(createPaymentDto.amount),
      createPaymentDto.currency,
      createPaymentDto.walletId,
      createPaymentDto.description,
      createPaymentDto.idempotencyKey,
      createPaymentDto.metadata,
    );
  }

  /**
   * Webhook для TON Wallet
   * POST /payments/webhooks/ton
   */
  @Post('webhooks/ton')
  @HttpCode(HttpStatus.OK)
  async handleTonWebhook(
    @Body() payload: any,
    @Headers('x-signature') signature: string,
    @Headers('x-timestamp') timestamp: string,
  ) {
    return this.paymentGatewayService.handleWebhook(
      PaymentProviderType.TON_WALLET,
      payload,
      signature,
      timestamp,
    );
  }

  /**
   * Webhook для Telegram Wallet
   * POST /payments/webhooks/telegram-wallet
   */
  @Post('webhooks/telegram-wallet')
  @HttpCode(HttpStatus.OK)
  async handleTelegramWalletWebhook(
    @Body() payload: any,
    @Headers('x-signature') signature: string,
  ) {
    return this.paymentGatewayService.handleWebhook(
      PaymentProviderType.TELEGRAM_WALLET,
      payload,
      signature,
    );
  }

  /**
   * Webhook для Telegram Stars
   * POST /payments/webhooks/telegram-stars
   */
  @Post('webhooks/telegram-stars')
  @HttpCode(HttpStatus.OK)
  async handleTelegramStarsWebhook(
    @Body() payload: any,
    @Headers('x-signature') signature: string,
  ) {
    return this.paymentGatewayService.handleWebhook(
      PaymentProviderType.TELEGRAM_STARS,
      payload,
      signature,
    );
  }

  /**
   * Проверка статуса платежа
   * GET /payments/:id/status
   */
  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  async checkPaymentStatus(@Param('id') transactionId: string) {
    return this.paymentGatewayService.checkPaymentStatus(transactionId);
  }

  /**
   * Получение транзакций пользователя
   * GET /payments/transactions
   */
  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  async getTransactions(
    @CurrentUser() user: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.paymentsService.getTransactions(
      user.id,
      parseInt(page),
      parseInt(limit),
    );
  }
}

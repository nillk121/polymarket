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
  NotFoundException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentGatewayService } from './services/payment-gateway.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreatePaymentTelegramDto } from './dto/create-payment-telegram.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PaymentProviderType } from './interfaces/payment-provider.interface';
import { UsersService } from '../users/users.service';
import Decimal from 'decimal.js';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paymentGatewayService: PaymentGatewayService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Создание платежа (для авторизованных пользователей)
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
   * Создание платежа через Telegram Bot (публичный endpoint)
   * POST /payments/telegram
   */
  @Post('telegram')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async createPaymentFromTelegram(
    @Body() createPaymentDto: CreatePaymentTelegramDto,
  ) {
    // Находим пользователя по Telegram ID
    const user = await this.usersService.findByTelegramId(createPaymentDto.telegramId);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Получаем кошельки пользователя
    const wallets = await this.usersService.getUserWallets(createPaymentDto.telegramId);
    const internalWallet = wallets.find((w: any) => (w.type === 'internal' || w.type === 'ton') && (w.isActive !== false));
    
    if (!internalWallet) {
      throw new NotFoundException('Активный кошелек не найден');
    }

    return this.paymentGatewayService.createPayment(
      user.id,
      createPaymentDto.provider,
      new Decimal(createPaymentDto.amount),
      createPaymentDto.currency,
      internalWallet.id,
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

  /**
   * Создание invoice для Mini App (WebApp.openInvoice)
   * POST /payments/invoice
   */
  @Post('invoice')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createInvoice(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @CurrentUser() user: any,
  ) {
    // Получаем кошельки пользователя
    const wallets = await this.usersService.getWalletsByUserId(user.id);
    const internalWallet = wallets.find((w: any) => (w.type === 'internal' || w.type === 'ton') && (w.isActive !== false));
    
    if (!internalWallet) {
      throw new NotFoundException('Активный кошелек не найден');
    }

    // Создаем платеж
    const paymentResult = await this.paymentGatewayService.createPayment(
      user.id,
      createInvoiceDto.provider,
      new Decimal(createInvoiceDto.amount),
      createInvoiceDto.currency,
      internalWallet.id,
      createInvoiceDto.description,
      createInvoiceDto.idempotencyKey,
      createInvoiceDto.metadata,
    );

    // Генерируем invoice URL через Bot API
    const invoiceUrl = await this.paymentsService.createInvoiceUrl(
      paymentResult,
      createInvoiceDto.provider,
      createInvoiceDto.amount,
      createInvoiceDto.currency,
      createInvoiceDto.description,
    );

    return {
      invoiceUrl,
      paymentId: paymentResult.paymentId,
      transactionId: paymentResult.transactionId,
    };
  }
}

import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentMethod } from '../orders/entities/order.entity';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  async verifyPayment(
    @Body() body: { transactionId: string; method: PaymentMethod },
  ) {
    return {
      verified: await this.paymentsService.verifyPayment(
        body.transactionId,
        body.method,
      ),
    };
  }
}


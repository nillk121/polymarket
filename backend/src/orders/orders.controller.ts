import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrderType, PaymentMethod } from './entities/order.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createOrderDto: {
      marketId: string;
      outcomeId: string;
      type: OrderType;
      shares: number;
      paymentMethod: PaymentMethod;
      referralCode?: string;
    },
    @Request() req,
  ) {
    return this.ordersService.createOrder(
      req.user.id,
      createOrderDto.marketId,
      createOrderDto.outcomeId,
      createOrderDto.type,
      createOrderDto.shares,
      createOrderDto.paymentMethod,
      createOrderDto.referralCode,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserOrders(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Request() req,
  ) {
    return this.ordersService.getUserOrders(
      req.user.id,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOrder(@Param('id') id: string) {
    return this.ordersService.getOrder(id);
  }
}


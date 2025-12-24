import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  /**
   * Получение выплат пользователя
   * GET /payouts
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async findByUser(
    @CurrentUser() user: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.payoutsService.findByUser(
      user.id,
      parseInt(page),
      parseInt(limit),
    );
  }

  /**
   * Получение одной выплаты
   * GET /payouts/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const payout = await this.payoutsService.findOne(id);
    
    // Проверка прав доступа
    if (payout.userId !== user.id && !user.roles?.some((r: any) => r.name === 'admin')) {
      throw new Error('Forbidden');
    }
    
    return payout;
  }

  /**
   * Получение аудит-логов выплаты
   * GET /payouts/:id/audit
   */
  @Get(':id/audit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAuditLogs(@Param('id') id: string) {
    return this.payoutsService.getAuditLogs(id);
  }

  /**
   * Повторная попытка выплаты
   * POST /payouts/:id/retry
   */
  @Post(':id/retry')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async retryPayout(@Param('id') id: string) {
    return this.payoutsService.retryPayout(id);
  }
}

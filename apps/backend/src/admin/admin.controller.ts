import { Controller, Get, Post, Query, Body, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.adminService.getAuditLogs(parseInt(page), parseInt(limit));
  }

  /**
   * Пополнение или списание баланса пользователя
   * POST /admin/balance/adjust
   */
  @Post('balance/adjust')
  async adjustBalance(
    @Body() adjustBalanceDto: AdjustBalanceDto,
    @CurrentUser() admin: any,
  ) {
    return this.adminService.adjustBalance(adjustBalanceDto, admin.id);
  }

  /**
   * Получить список пользователей с балансами
   * GET /admin/users/balances
   */
  @Get('users/balances')
  async getUsersBalances(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsersBalances(
      parseInt(page),
      parseInt(limit),
      search,
    );
  }
}

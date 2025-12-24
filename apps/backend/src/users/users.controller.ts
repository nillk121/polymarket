import { Controller, Get, UseGuards, Request, Query, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  /**
   * Получить кошельки текущего пользователя
   * GET /api/users/me/wallets
   */
  @Get('me/wallets')
  @UseGuards(JwtAuthGuard)
  async getMyWallets(@Request() req) {
    const user = await this.usersService.findOne(req.user.id);
    // Получаем кошельки через telegramId для совместимости
    return this.usersService.getUserWallets(user.telegramId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.usersService.findAll(parseInt(page), parseInt(limit));
  }

  /**
   * Получить пользователя по Telegram ID
   * GET /api/users/telegram/:telegramId
   */
  @Get('telegram/:telegramId')
  async findByTelegramId(@Param('telegramId') telegramId: string) {
    return this.usersService.findByTelegramId(telegramId);
  }

  /**
   * Получить кошельки пользователя по Telegram ID
   * GET /api/users/telegram/:telegramId/wallets
   */
  @Get('telegram/:telegramId/wallets')
  async getUserWallets(@Param('telegramId') telegramId: string) {
    return this.usersService.getUserWallets(telegramId);
  }
}

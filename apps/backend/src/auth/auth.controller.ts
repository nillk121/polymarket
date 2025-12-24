import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginResponseDto } from './dto/login-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Авторизация через Telegram WebApp
   * POST /api/auth/telegram
   */
  @Post('telegram')
  @HttpCode(HttpStatus.OK)
  async loginWithTelegram(
    @Body() authData: TelegramAuthDto,
  ): Promise<LoginResponseDto> {
    const user = await this.authService.validateTelegramUser(authData);
    return this.authService.login(user);
  }

  /**
   * Обновление access token
   * POST /api/auth/refresh
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  /**
   * Получить текущего пользователя
   * GET /api/auth/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req) {
    const user = await this.authService.validateUser(req.user.id);
    const roles = user.roles?.map((r: any) => r.role.name) || [];
    const permissions = this.authService.extractPermissions(user);

    return {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isActive: user.isActive,
      isVerified: user.isVerified,
      roles,
      permissions,
      createdAt: user.createdAt,
    };
  }

  /**
   * Выход пользователя
   * POST /api/auth/logout
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req) {
    return this.authService.logout(req.user.id);
  }
}

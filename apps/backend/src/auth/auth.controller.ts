import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { TelegramInitDataDto } from './dto/telegram-init-data.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginResponseDto } from './dto/login-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Авторизация через Telegram WebApp
   * POST /api/auth/telegram
   * Принимает либо initData строку, либо распарсенные данные
   */
  @Post('telegram')
  @HttpCode(HttpStatus.OK)
  async loginWithTelegram(
    @Body() data: TelegramInitDataDto | TelegramAuthDto,
  ): Promise<LoginResponseDto> {
    // Если пришла строка initData, парсим её
    let authData: TelegramAuthDto;
    let initDataString: string | undefined;
    
    if ('initData' in data && typeof data.initData === 'string') {
      if (!data.initData || data.initData.trim() === '') {
        throw new UnauthorizedException('initData не может быть пустым');
      }
      initDataString = data.initData;
      authData = this.authService.parseInitData(initDataString);
    } else {
      authData = data as TelegramAuthDto;
    }
    
    // Логирование для отладки (только в dev режиме)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Telegram auth attempt:', {
        hasInitData: 'initData' in data,
        initDataLength: 'initData' in data ? (data.initData as string).length : 0,
        telegramId: authData.id,
        hasHash: !!authData.hash,
        hashLength: authData.hash?.length || 0,
        authDate: authData.auth_date ? new Date(authData.auth_date * 1000).toISOString() : 'missing',
      });
    }
    
    const user = await this.authService.validateTelegramUser(authData, initDataString);
    console.log('✅ User validated, generating tokens...');
    const loginResponse = await this.authService.login(user);
    console.log('✅ Login response generated, returning to client');
    return loginResponse;
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

  /**
   * Админ логин (username/password)
   * POST /api/auth/admin/login
   */
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() loginDto: AdminLoginDto): Promise<LoginResponseDto> {
    return this.authService.adminLogin(loginDto.username, loginDto.password);
  }
}

import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService, TelegramAuthData } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('telegram')
  async loginWithTelegram(@Body() authData: TelegramAuthData) {
    const user = await this.authService.validateTelegramUser(authData);
    return this.authService.login(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req) {
    return req.user;
  }
}


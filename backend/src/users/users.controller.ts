import { Controller, Get, UseGuards, Request, Put, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Put('referral')
  @UseGuards(JwtAuthGuard)
  async setReferral(@Request() req, @Body('referralCode') referralCode: string) {
    return this.usersService.setReferrer(req.user.id, referralCode);
  }
}


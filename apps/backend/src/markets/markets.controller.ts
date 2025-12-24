import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MarketsService } from './markets.service';
import { CreateMarketDto } from './dto/create-market.dto';
import { UpdateMarketDto } from './dto/update-market.dto';
import { ResolveMarketDto } from './dto/resolve-market.dto';
import { QueryMarketDto } from './dto/query-market.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('markets')
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  /**
   * Создание рынка (только для админов)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createMarketDto: CreateMarketDto,
    @CurrentUser() user: any,
  ) {
    return this.marketsService.create(createMarketDto, user.id);
  }

  /**
   * Получение всех рынков (публичный)
   */
  @Get()
  @Public()
  findAll(@Query() query: QueryMarketDto) {
    return this.marketsService.findAll(query);
  }

  /**
   * Получение рынка по ID (публичный)
   */
  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.marketsService.findOne(id);
  }

  /**
   * Получение рынка по slug (публичный)
   */
  @Get('slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string) {
    return this.marketsService.findBySlug(slug);
  }

  /**
   * Обновление рынка (только для админов)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(
    @Param('id') id: string,
    @Body() updateMarketDto: UpdateMarketDto,
    @CurrentUser() user: any,
  ) {
    return this.marketsService.update(id, updateMarketDto, user.id);
  }

  /**
   * Активация рынка (только для админов)
   */
  @Post(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  activate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.marketsService.activate(id, user.id);
  }

  /**
   * Блокировка рынка (только для админов)
   */
  @Post(':id/lock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  lock(@Param('id') id: string, @CurrentUser() user: any) {
    return this.marketsService.lock(id, user.id);
  }

  /**
   * Разрешение рынка (только для админов)
   */
  @Post(':id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  resolve(
    @Param('id') id: string,
    @Body() resolveMarketDto: ResolveMarketDto,
    @CurrentUser() user: any,
  ) {
    return this.marketsService.resolve(id, resolveMarketDto, user.id);
  }

  /**
   * Отмена рынка (только для админов)
   */
  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.marketsService.cancel(id, user.id);
  }
}

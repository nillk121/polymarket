import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BetsService } from './bets.service';
import { PlaceBetDto } from './dto/place-bet.dto';
import { CancelBetDto } from './dto/cancel-bet.dto';
import { QueryBetDto } from './dto/query-bet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('bets')
@UseGuards(JwtAuthGuard)
export class BetsController {
  constructor(private readonly betsService: BetsService) {}

  /**
   * Размещение ставки
   * POST /bets
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async placeBet(
    @Body() placeBetDto: PlaceBetDto,
    @CurrentUser() user: any,
  ) {
    return this.betsService.placeBet(user.id, placeBetDto);
  }

  /**
   * Отмена ставки
   * POST /bets/:id/cancel
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelBet(
    @Param('id') betId: string,
    @Body() cancelBetDto: CancelBetDto,
    @CurrentUser() user: any,
  ) {
    return this.betsService.cancelBet(user.id, betId, cancelBetDto.reason);
  }

  /**
   * Получение ставок пользователя
   * GET /bets
   */
  @Get()
  async findByUser(
    @Query() query: QueryBetDto,
    @CurrentUser() user: any,
  ) {
    return this.betsService.findByUser(user.id, query);
  }

  /**
   * Получение ставки по ID
   * GET /bets/:id
   */
  @Get(':id')
  async findOne(@Param('id') betId: string, @CurrentUser() user: any) {
    return this.betsService.findOne(betId, user.id);
  }
}

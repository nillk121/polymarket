import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum BetType {
  BUY = 'buy',
  SELL = 'sell',
}

export class PlaceBetDto {
  @IsString()
  @IsNotEmpty()
  marketId: string;

  @IsString()
  @IsNotEmpty()
  outcomeId: string;

  @IsString()
  @IsNotEmpty()
  walletId: string;

  @IsEnum(BetType)
  @IsNotEmpty()
  type: BetType;

  // Либо shares, либо cost - одно из них должно быть указано
  @IsNumber()
  @IsOptional()
  @Min(0.00000001)
  @Type(() => Number)
  shares?: number;

  @IsNumber()
  @IsOptional()
  @Min(0.00000001)
  @Type(() => Number)
  cost?: number; // Максимальная стоимость (для покупки)

  @IsString()
  @IsOptional()
  referralCode?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  maxSlippage?: number; // Максимальное проскальзывание в процентах
}


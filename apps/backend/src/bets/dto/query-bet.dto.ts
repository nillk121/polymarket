import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum BetStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  WON = 'won',
  LOST = 'lost',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export class QueryBetDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(BetStatus)
  status?: BetStatus;

  @IsOptional()
  @IsString()
  marketId?: string;

  @IsOptional()
  @IsString()
  outcomeId?: string;
}


import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateMarketDto } from './create-market.dto';
import { IsOptional, IsEnum, IsDateString, IsUrl } from 'class-validator';

export enum MarketStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  LOCKED = 'locked',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled',
}

export class UpdateMarketDto extends PartialType(
  OmitType(CreateMarketDto, ['outcomes', 'type'] as const),
) {
  @IsEnum(MarketStatus)
  @IsOptional()
  status?: MarketStatus;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}


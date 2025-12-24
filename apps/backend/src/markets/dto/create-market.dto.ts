import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUrl,
  IsArray,
  ValidateNested,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum MarketType {
  BINARY = 'binary',
  MULTI = 'multi',
}

export enum MarketPricingModel {
  LMSR = 'lmsr',
  CONSTANT_PRODUCT = 'constant_product',
}

export class CreateOutcomeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  sortOrder?: number;
}

export class CreateMarketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  slug: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsEnum(MarketType)
  @IsNotEmpty()
  type: MarketType;

  @IsEnum(MarketPricingModel)
  @IsOptional()
  pricingModel?: MarketPricingModel;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOutcomeDto)
  outcomes: CreateOutcomeDto[];

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  telegramChannelId?: string;

  // Для binary рынков автоматически создаются 2 исхода (Yes/No)
  // Для multi рынков нужно передать массив outcomes
}


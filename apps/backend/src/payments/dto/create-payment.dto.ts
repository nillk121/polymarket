import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentProviderType } from '../interfaces/payment-provider.interface';

export class CreatePaymentDto {
  @IsEnum(PaymentProviderType)
  @IsNotEmpty()
  provider: PaymentProviderType;

  @IsString()
  @IsNotEmpty()
  walletId: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0.00000001)
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  currency: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}



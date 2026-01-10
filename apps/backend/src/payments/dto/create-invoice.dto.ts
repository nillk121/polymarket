import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentProviderType } from '../interfaces/payment-provider.interface';

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  walletId: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0.00000001)
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string = 'TON';

  @IsEnum(PaymentProviderType)
  @IsNotEmpty()
  provider: PaymentProviderType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  returnUrl?: string;

  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}


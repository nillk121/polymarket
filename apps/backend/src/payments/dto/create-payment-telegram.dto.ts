import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentTelegramDto {
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

  @IsString()
  @IsOptional()
  description?: string;
}


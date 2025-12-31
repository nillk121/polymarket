import { IsString, IsEnum, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export enum AdjustmentType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export class AdjustBalanceDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  walletId: string;

  @IsEnum(AdjustmentType)
  type: AdjustmentType;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string = 'TON';

  @IsString()
  @IsOptional()
  description?: string;
}


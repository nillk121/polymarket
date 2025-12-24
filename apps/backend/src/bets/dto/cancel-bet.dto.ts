import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CancelBetDto {
  @IsString()
  @IsNotEmpty()
  betId: string;

  @IsString()
  @IsOptional()
  reason?: string;
}


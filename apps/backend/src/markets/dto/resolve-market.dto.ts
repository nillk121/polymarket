import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class ResolveMarketDto {
  @IsString()
  @IsNotEmpty()
  outcomeId: string;

  @IsDateString()
  @IsOptional()
  resolutionDate?: string;
}


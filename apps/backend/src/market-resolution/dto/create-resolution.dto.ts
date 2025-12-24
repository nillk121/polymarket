import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, Min } from 'class-validator';

export class CreateResolutionDto {
  @IsString()
  @IsNotEmpty()
  resolvedOutcomeId: string;

  @IsString()
  @IsOptional()
  resolutionNotes?: string;

  @IsDateString()
  @IsOptional()
  resolutionDate?: string;

  @IsString()
  @IsOptional()
  oracleId?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  disputeWindowHours?: number; // По умолчанию 24 часа
}


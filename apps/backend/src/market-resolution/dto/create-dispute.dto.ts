import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateDisputeDto {
  @IsString()
  @IsNotEmpty()
  disputedOutcomeId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsObject()
  @IsOptional()
  evidence?: Record<string, any>; // URLs, screenshots, etc.
}


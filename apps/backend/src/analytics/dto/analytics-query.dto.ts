import { IsOptional, IsString, IsDateString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AnalyticsQueryDto {
  @IsOptional()
  @Type(() => Date)
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsString()
  marketId?: string;

  @IsOptional()
  @IsString()
  trafficSourceId?: string;
}


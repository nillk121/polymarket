import { IsOptional, IsString, IsDateString, IsNumber, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class AnalyticsQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    // Конвертируем YYYY-MM-DD в ISO формат
    if (value && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(value + 'T00:00:00.000Z').toISOString();
    }
    return value;
  })
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @Transform(({ value }) => {
    // Конвертируем YYYY-MM-DD в ISO формат
    if (value && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(value + 'T23:59:59.999Z').toISOString();
    }
    return value;
  })
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


import { IsString, IsOptional } from 'class-validator';

export class TelegramInitDataDto {
  @IsString()
  @IsOptional()
  initData?: string;

  @IsString()
  @IsOptional()
  hash?: string;

  @IsString()
  @IsOptional()
  user?: string;

  @IsString()
  @IsOptional()
  auth_date?: string;

  @IsString()
  @IsOptional()
  query_id?: string;
}


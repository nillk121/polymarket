import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class TelegramAuthDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  photo_url?: string;

  @IsNumber()
  @IsNotEmpty()
  auth_date: number;

  @IsString()
  @IsNotEmpty()
  hash: string;

  // Дополнительные поля от Telegram WebApp
  @IsString()
  @IsOptional()
  query_id?: string;

  @IsString()
  @IsOptional()
  user?: string;

  @IsString()
  @IsOptional()
  receiver?: string;

  @IsString()
  @IsOptional()
  chat?: string;

  @IsString()
  @IsOptional()
  chat_type?: string;

  @IsString()
  @IsOptional()
  chat_instance?: string;

  @IsString()
  @IsOptional()
  start_param?: string;

  @IsString()
  @IsOptional()
  can_send_after?: string;
}


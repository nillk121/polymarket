import { IsString, IsOptional, IsBoolean, IsNumber, IsObject } from 'class-validator';

export class UpdateChannelDto {
  @IsString()
  @IsOptional()
  channelUsername?: string;

  @IsString()
  @IsOptional()
  channelTitle?: string;

  @IsString()
  @IsOptional()
  channelType?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @IsNumber()
  @IsOptional()
  subscriberCount?: number;

  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}


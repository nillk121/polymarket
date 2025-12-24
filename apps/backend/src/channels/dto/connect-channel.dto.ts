import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class ConnectChannelDto {
  @IsString()
  @IsNotEmpty()
  channelId: string;

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
}


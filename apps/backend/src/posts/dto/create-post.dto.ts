import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsObject,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsOptional()
  channelId?: string;

  @IsString()
  @IsOptional()
  templateId?: string;

  @IsString()
  @IsOptional()
  marketId?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @IsObject()
  @IsOptional()
  templateVariables?: Record<string, any>;
}


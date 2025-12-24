import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class UpdatePostTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsObject()
  @IsOptional()
  variables?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}


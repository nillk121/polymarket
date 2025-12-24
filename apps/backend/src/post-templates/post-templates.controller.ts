import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PostTemplatesService } from './post-templates.service';
import { CreatePostTemplateDto } from './dto/create-post-template.dto';
import { UpdatePostTemplateDto } from './dto/update-post-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('post-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class PostTemplatesController {
  constructor(private readonly postTemplatesService: PostTemplatesService) {}

  /**
   * Создание шаблона
   * POST /post-templates
   */
  @Post()
  async create(
    @Body() createPostTemplateDto: CreatePostTemplateDto,
    @CurrentUser() user: any,
  ) {
    return this.postTemplatesService.create(user.id, createPostTemplateDto);
  }

  /**
   * Получение всех шаблонов
   * GET /post-templates
   */
  @Get()
  async findAll(@Query('includeInactive') includeInactive?: string) {
    return this.postTemplatesService.findAll(includeInactive === 'true');
  }

  /**
   * Получение одного шаблона
   * GET /post-templates/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.postTemplatesService.findOne(id);
  }

  /**
   * Обновление шаблона
   * PUT /post-templates/:id
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePostTemplateDto: UpdatePostTemplateDto,
  ) {
    return this.postTemplatesService.update(id, updatePostTemplateDto);
  }

  /**
   * Удаление шаблона
   * DELETE /post-templates/:id
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.postTemplatesService.remove(id);
  }
}


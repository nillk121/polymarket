import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * Создание поста (только админ)
   * POST /posts
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() user: any,
  ) {
    return this.postsService.create(user.id, createPostDto);
  }

  /**
   * Получение всех постов
   * GET /posts
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async findAll(
    @Query('channelId') channelId?: string,
    @Query('status') status?: string,
    @Query('marketId') marketId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.findAll({
      channelId,
      status,
      marketId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  /**
   * Получение одного поста
   * GET /posts/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  /**
   * Обновление поста (только админ)
   * PUT /posts/:id
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(id, updatePostDto);
  }

  /**
   * Публикация поста (только админ)
   * POST /posts/:id/publish
   */
  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async publish(@Param('id') id: string) {
    return this.postsService.publishPost(id);
  }

  /**
   * Удаление поста (только админ)
   * DELETE /posts/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }

  /**
   * Регистрация клика (публичный endpoint)
   * POST /posts/track/click
   */
  @Post('track/click')
  @Public()
  @HttpCode(HttpStatus.OK)
  async trackClick(
    @Body() body: { trafficSourceId: string; userId?: string },
  ) {
    return this.postsService.trackClick(body.trafficSourceId, body.userId);
  }

  /**
   * Регистрация просмотра (публичный endpoint)
   * POST /posts/:id/track/view
   */
  @Post(':id/track/view')
  @Public()
  @HttpCode(HttpStatus.OK)
  async trackView(
    @Param('id') postId: string,
    @Body() body: { userId?: string },
  ) {
    return this.postsService.trackView(postId, body.userId);
  }

  /**
   * Получение статистики поста (только админ)
   * GET /posts/:id/stats
   */
  @Get(':id/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getStats(@Param('id') id: string) {
    return this.postsService.getPostStats(id);
  }
}


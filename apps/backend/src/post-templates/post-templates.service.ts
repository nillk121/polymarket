import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostTemplateDto } from './dto/create-post-template.dto';
import { UpdatePostTemplateDto } from './dto/update-post-template.dto';

@Injectable()
export class PostTemplatesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Создание шаблона поста
   */
  async create(userId: string, createPostTemplateDto: CreatePostTemplateDto) {
    return this.prisma.postTemplate.create({
      data: {
        ...createPostTemplateDto,
        createdById: userId,
        isActive: createPostTemplateDto.isActive ?? true,
      },
    });
  }

  /**
   * Получение всех шаблонов
   */
  async findAll(includeInactive: boolean = false) {
    return this.prisma.postTemplate.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { posts: true },
        },
      },
    });
  }

  /**
   * Получение одного шаблона
   */
  async findOne(id: string) {
    const template = await this.prisma.postTemplate.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Шаблон не найден');
    }

    return template;
  }

  /**
   * Обновление шаблона
   */
  async update(id: string, updatePostTemplateDto: UpdatePostTemplateDto) {
    const template = await this.findOne(id);

    return this.prisma.postTemplate.update({
      where: { id },
      data: updatePostTemplateDto,
    });
  }

  /**
   * Удаление шаблона
   */
  async remove(id: string) {
    const template = await this.findOne(id);

    return this.prisma.postTemplate.delete({
      where: { id },
    });
  }

  /**
   * Рендеринг шаблона с переменными
   */
  async renderTemplate(templateId: string, variables: Record<string, any>): Promise<string> {
    const template = await this.findOne(templateId);
    let content = template.content;

    // Замена переменных в шаблоне
    // Формат: {{variableName}}
    const variableRegex = /\{\{(\w+)\}\}/g;
    content = content.replace(variableRegex, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });

    return content;
  }
}


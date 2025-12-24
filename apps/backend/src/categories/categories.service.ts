import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Создание категории
   */
  async create(createCategoryDto: CreateCategoryDto) {
    // Проверка уникальности slug
    const existing = await this.prisma.category.findUnique({
      where: { slug: createCategoryDto.slug },
    });

    if (existing) {
      throw new ConflictException('Категория с таким slug уже существует');
    }

    // Проверка родительской категории
    if (createCategoryDto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: createCategoryDto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Родительская категория не найдена');
      }
    }

    return this.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        slug: createCategoryDto.slug,
        description: createCategoryDto.description,
        iconUrl: createCategoryDto.iconUrl,
        parentId: createCategoryDto.parentId,
        sortOrder: createCategoryDto.sortOrder ?? 0,
        isActive: createCategoryDto.isActive ?? true,
      },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  /**
   * Получение всех категорий
   * С кэшированием
   */
  async findAll(query: QueryCategoryDto = {}) {
    // Кэш ключ на основе параметров запроса
    const cacheKey = `categories:list:${JSON.stringify(query)}`;
    
    // Проверяем кэш для активных категорий
    if (!query.includeInactive) {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }
    }
    const where: any = {};

    if (!query.includeInactive) {
      where.isActive = true;
    }

    if (query.parentId) {
      where.parentId = query.parentId;
    } else if (!query.includeChildren) {
      // По умолчанию показываем только корневые категории
      where.parentId = null;
    }

    return this.prisma.category.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
      include: query.includeChildren
        ? {
            parent: true,
            children: {
              where: query.includeInactive ? {} : { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
            _count: {
              select: {
                markets: query.includeInactive
                  ? {}
                  : {
                      where: {
                        status: {
                          in: ['active', 'locked'],
                        },
                      },
                    },
              },
            },
          }
        : {
            parent: true,
            _count: {
              select: {
                markets: query.includeInactive
                  ? {}
                  : {
                      where: {
                        status: {
                          in: ['active', 'locked'],
                        },
                      },
                    },
              },
            },
          },
    });

    // Кэшируем результат на 5 минут для активных категорий
    if (!query.includeInactive) {
      await this.cacheManager.set(cacheKey, categories, 5 * 60 * 1000);
    }

    return categories;
  }

  /**
   * Получение категории по ID
   */
  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            markets: {
              where: {
                status: {
                  in: ['active', 'locked'],
                },
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }

    return category;
  }

  /**
   * Получение категории по slug
   */
  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        markets: {
          where: {
            status: {
              in: ['active', 'locked'],
            },
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            markets: {
              where: {
                status: {
                  in: ['active', 'locked'],
                },
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }

    return category;
  }

  /**
   * Обновление категории
   */
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);

    // Проверка уникальности slug
    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const existing = await this.prisma.category.findUnique({
        where: { slug: updateCategoryDto.slug },
      });

      if (existing) {
        throw new ConflictException('Категория с таким slug уже существует');
      }
    }

    // Проверка родительской категории (избегаем циклических ссылок)
    if (updateCategoryDto.parentId) {
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException(
          'Категория не может быть родителем самой себя',
        );
      }

      // Проверка, что родитель не является потомком текущей категории
      const isDescendant = await this.isDescendant(id, updateCategoryDto.parentId);
      if (isDescendant) {
        throw new BadRequestException(
          'Категория не может быть родителем своего потомка',
        );
      }

      const parent = await this.prisma.category.findUnique({
        where: { id: updateCategoryDto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Родительская категория не найдена');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  /**
   * Удаление категории
   */
  async remove(id: string) {
    const category = await this.findOne(id);
    
    // Инвалидация кэша при удалении
    await this.cacheManager.del(`categories:list:*`);
    await this.cacheManager.del(`categories:${id}`);

    // Проверка наличия дочерних категорий
    const childrenCount = await this.prisma.category.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      throw new BadRequestException(
        'Невозможно удалить категорию с дочерними категориями',
      );
    }

    // Проверка наличия рынков
    const marketsCount = await this.prisma.market.count({
      where: { categoryId: id },
    });

    if (marketsCount > 0) {
      throw new BadRequestException(
        'Невозможно удалить категорию с привязанными рынками',
      );
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  /**
   * Проверка, является ли категория потомком другой
   */
  private async isDescendant(
    ancestorId: string,
    descendantId: string,
  ): Promise<boolean> {
    let currentId = descendantId;
    const visited = new Set<string>();

    while (currentId) {
      if (visited.has(currentId)) {
        break; // Защита от циклических ссылок
      }
      visited.add(currentId);

      if (currentId === ancestorId) {
        return true;
      }

      const category = await this.prisma.category.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });

      if (!category || !category.parentId) {
        break;
      }

      currentId = category.parentId;
    }

    return false;
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Валидатор для категорий
 */
@Injectable()
export class CategoryValidator {
  constructor(private prisma: PrismaService) {}

  /**
   * Проверка существования категории
   */
  async validateCategoryExists(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }

    return category;
  }

  /**
   * Проверка активности категории
   */
  validateCategoryActive(category: any) {
    if (!category.isActive) {
      throw new BadRequestException('Категория неактивна');
    }
  }

  /**
   * Комплексная валидация категории
   */
  async validateCategoryActiveExists(categoryId: string) {
    const category = await this.validateCategoryExists(categoryId);
    this.validateCategoryActive(category);
    return category;
  }
}


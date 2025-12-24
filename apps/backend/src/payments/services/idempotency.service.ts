import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Decimal from 'decimal.js';
import * as crypto from 'crypto';

/**
 * Сервис для обеспечения идемпотентности и защиты от replay атак
 */
@Injectable()
export class IdempotencyService {
  constructor(private prisma: PrismaService) {}

  /**
   * Проверка и сохранение идемпотентного ключа
   * 
   * @param key - Идемпотентный ключ
   * @param operation - Тип операции
   * @param data - Данные операции
   * @returns Существующий результат или null
   */
  async checkAndStore(
    key: string,
    operation: string,
    data: any,
  ): Promise<any | null> {
    // Проверяем существующий ключ
    const existing = await this.prisma.$queryRaw`
      SELECT * FROM idempotency_keys
      WHERE key = ${key} AND operation = ${operation}
      LIMIT 1
    `.catch(() => null);

    if (existing && Array.isArray(existing) && existing.length > 0) {
      // Возвращаем сохраненный результат
      return existing[0].result;
    }

    // Сохраняем новый ключ (если таблица существует)
    // В реальной реализации здесь будет создание записи
    return null;
  }

  /**
   * Сохранение результата операции
   */
  async storeResult(
    key: string,
    operation: string,
    result: any,
    ttl: number = 24 * 60 * 60 * 1000, // 24 часа
  ): Promise<void> {
    // В реальной реализации здесь будет сохранение в БД или Redis
    // Для демонстрации используем простую структуру
    const expiresAt = new Date(Date.now() + ttl);

    // Можно использовать Redis для временного хранения
    // или создать таблицу idempotency_keys в БД
  }

  /**
   * Проверка replay атаки (дублирующий запрос)
   */
  async checkReplay(
    key: string,
    operation: string,
    timestamp: number,
    window: number = 5 * 60 * 1000, // 5 минут
  ): Promise<boolean> {
    const since = new Date(timestamp - window);

    // Проверяем наличие запроса в окне времени
    const existing = await this.prisma.$queryRaw`
      SELECT * FROM idempotency_keys
      WHERE key = ${key} 
        AND operation = ${operation}
        AND created_at >= ${since}
      LIMIT 1
    `.catch(() => null);

    return existing && Array.isArray(existing) && existing.length > 0;
  }

  /**
   * Генерация идемпотентного ключа
   */
  generateKey(userId: string, operation: string, data: any): string {
    const dataString = JSON.stringify(data);
    const hash = require('crypto')
      .createHash('sha256')
      .update(`${userId}:${operation}:${dataString}`)
      .digest('hex');
    
    return `${operation}:${hash}`;
  }
}


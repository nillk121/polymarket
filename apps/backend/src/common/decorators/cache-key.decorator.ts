import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY = 'cache:key';
export const CACHE_TTL = 'cache:ttl';

/**
 * Декоратор для установки ключа кэша
 */
export const CacheKey = (key: string) => SetMetadata(CACHE_KEY, key);

/**
 * Декоратор для установки TTL кэша (в секундах)
 */
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL, ttl);


import Decimal from 'decimal.js';

/**
 * Форматирование чисел
 */
export function formatNumber(value: number | string, decimals: number = 2): string {
  return new Decimal(value).toFixed(decimals);
}

/**
 * Форматирование валюты
 */
export function formatCurrency(value: number | string, currency: string = 'TON'): string {
  return `${formatNumber(value)} ${currency}`;
}

/**
 * Форматирование процентов
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Генерация реферального кода
 */
export function generateReferralCode(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Валидация Telegram hash
 */
export function validateTelegramHash(
  initData: string,
  botToken: string,
): boolean {
  // В production здесь должна быть реальная валидация hash
  // Используя crypto.createHmac('sha256', botToken)
  return true;
}

/**
 * Парсинг initData от Telegram
 */
export function parseTelegramInitData(initData: string): Record<string, string> {
  const params = new URLSearchParams(initData);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/**
 * Округление до указанного количества знаков
 */
export function roundTo(value: number | string, decimals: number): number {
  return new Decimal(value).toDecimalPlaces(decimals).toNumber();
}

/**
 * Проверка, является ли значение валидным числом
 */
export function isValidNumber(value: any): boolean {
  if (value === null || value === undefined) return false;
  const num = Number(value);
  return !isNaN(num) && isFinite(num);
}

/**
 * Безопасное преобразование в число
 */
export function toNumber(value: any, defaultValue: number = 0): number {
  if (!isValidNumber(value)) return defaultValue;
  return Number(value);
}

/**
 * Форматирование даты
 */
export function formatDate(date: Date | string, locale: string = 'ru-RU'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale);
}

/**
 * Форматирование даты и времени
 */
export function formatDateTime(date: Date | string, locale: string = 'ru-RU'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(locale);
}

/**
 * Вычисление разницы во времени
 */
export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} дн. назад`;
  if (hours > 0) return `${hours} ч. назад`;
  if (minutes > 0) return `${minutes} мин. назад`;
  return 'только что';
}

/**
 * Обрезка текста
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Дебаунс функция
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}


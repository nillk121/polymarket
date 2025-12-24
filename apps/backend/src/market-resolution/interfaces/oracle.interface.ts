/**
 * Интерфейс для внешних оракулов
 * Готов для будущей интеграции с Chainlink, Band Protocol и другими
 */
export interface IOracle {
  /**
   * ID оракула
   */
  id: string;

  /**
   * Название оракула
   */
  name: string;

  /**
   * Тип оракула (chainlink, band, custom, api)
   */
  type: string;

  /**
   * Получение данных для разрешения рынка
   */
  resolveMarket(marketId: string, params?: any): Promise<{
    outcomeId: string;
    confidence: number;
    data: any;
  }>;

  /**
   * Проверка доступности оракула
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Абстрактный класс для реализации оракулов
 */
export abstract class BaseOracle implements IOracle {
  abstract id: string;
  abstract name: string;
  abstract type: string;

  abstract resolveMarket(
    marketId: string,
    params?: any,
  ): Promise<{
    outcomeId: string;
    confidence: number;
    data: any;
  }>;

  abstract isAvailable(): Promise<boolean>;
}


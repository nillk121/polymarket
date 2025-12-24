import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IOracle } from '../interfaces/oracle.interface';

/**
 * Сервис для управления оракулами
 * В будущем здесь будет интеграция с внешними оракулами
 */
@Injectable()
export class OracleService {
  private readonly logger = new Logger(OracleService.name);
  private oracles: Map<string, IOracle> = new Map();

  constructor(private prisma: PrismaService) {}

  /**
   * Регистрация оракула
   */
  registerOracle(oracle: IOracle) {
    this.oracles.set(oracle.id, oracle);
    this.logger.log(`Oracle registered: ${oracle.name} (${oracle.type})`);
  }

  /**
   * Получение оракула по ID
   */
  getOracle(oracleId: string): IOracle | undefined {
    return this.oracles.get(oracleId);
  }

  /**
   * Получение всех зарегистрированных оракулов
   */
  getAllOracles(): IOracle[] {
    return Array.from(this.oracles.values());
  }

  /**
   * Получение оракулов из базы данных
   */
  async getDatabaseOracles() {
    return this.prisma.oracle.findMany({
      where: {
        isActive: true,
      },
    });
  }

  /**
   * Создание оракула в базе данных
   */
  async createOracle(data: {
    name: string;
    description?: string;
    type: string;
    endpoint?: string;
    apiKey?: string;
    metadata?: any;
  }) {
    return this.prisma.oracle.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        endpoint: data.endpoint,
        apiKey: data.apiKey,
        metadata: data.metadata || {},
        isActive: true,
      },
    });
  }

  /**
   * Обновление оракула
   */
  async updateOracle(id: string, data: Partial<{
    name: string;
    description: string;
    type: string;
    endpoint: string;
    isActive: boolean;
    metadata: any;
  }>) {
    return this.prisma.oracle.update({
      where: { id },
      data,
    });
  }

  /**
   * Удаление оракула
   */
  async deleteOracle(id: string) {
    return this.prisma.oracle.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }
}


import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Decimal from 'decimal.js';

/**
 * Сервис для аудита выплат
 */
@Injectable()
export class PayoutAuditService {
  private readonly logger = new Logger(PayoutAuditService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Создание аудит-лога выплаты
   */
  async logPayoutCreation(
    payoutId: string,
    userId: string,
    betId: string,
    amount: Decimal,
    currency: string,
    metadata?: Record<string, any>,
  ) {
    const auditLog = {
      payoutId,
      userId,
      betId,
      amount: amount.toString(),
      currency,
      action: 'payout_created',
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    };

    this.logger.log(`Payout created: ${JSON.stringify(auditLog)}`);

    // Сохранение в admin_audit_logs
    try {
      await this.prisma.adminAuditLog.create({
        data: {
          userId,
          action: 'payout_created',
          resourceType: 'payout',
          resourceId: payoutId,
          details: auditLog as any,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to save audit log: ${error.message}`);
    }

    return auditLog;
  }

  /**
   * Логирование обработки выплаты
   */
  async logPayoutProcessing(
    payoutId: string,
    status: string,
    metadata?: Record<string, any>,
  ) {
    const auditLog = {
      payoutId,
      status,
      action: 'payout_processed',
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    };

    this.logger.log(`Payout processed: ${JSON.stringify(auditLog)}`);

    return auditLog;
  }

  /**
   * Логирование завершения выплаты
   */
  async logPayoutCompletion(
    payoutId: string,
    userId: string,
    amount: Decimal,
    currency: string,
    externalPayoutId?: string,
    metadata?: Record<string, any>,
  ) {
    const auditLog = {
      payoutId,
      userId,
      amount: amount.toString(),
      currency,
      externalPayoutId,
      action: 'payout_completed',
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    };

    this.logger.log(`Payout completed: ${JSON.stringify(auditLog)}`);

    try {
      await this.prisma.adminAuditLog.create({
        data: {
          userId,
          action: 'payout_completed',
          resourceType: 'payout',
          resourceId: payoutId,
          details: auditLog as any,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to save audit log: ${error.message}`);
    }

    return auditLog;
  }

  /**
   * Логирование ошибки выплаты
   */
  async logPayoutError(
    payoutId: string,
    userId: string,
    error: Error,
    metadata?: Record<string, any>,
  ) {
    const auditLog = {
      payoutId,
      userId,
      error: error.message,
      stack: error.stack,
      action: 'payout_failed',
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    };

    this.logger.error(`Payout failed: ${JSON.stringify(auditLog)}`);

    try {
      await this.prisma.adminAuditLog.create({
        data: {
          userId,
          action: 'payout_failed',
          resourceType: 'payout',
          resourceId: payoutId,
          details: auditLog as any,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to save audit log: ${err.message}`);
    }

    return auditLog;
  }

  /**
   * Получение истории аудита выплаты
   */
  async getPayoutAuditHistory(payoutId: string) {
    return this.prisma.adminAuditLog.findMany({
      where: {
        resourceType: 'payout',
        resourceId: payoutId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}


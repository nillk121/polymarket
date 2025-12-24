import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent, EventType } from './entities/analytics-event.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private eventsRepository: Repository<AnalyticsEvent>,
  ) {}

  async trackEvent(
    userId: string | null,
    eventType: EventType,
    metadata: Record<string, any> = {},
    context?: {
      ipAddress?: string;
      userAgent?: string;
      referrer?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      referralCode?: string;
      marketId?: string;
    },
  ): Promise<AnalyticsEvent> {
    const event = this.eventsRepository.create({
      userId: userId || undefined,
      marketId: context?.marketId,
      eventType,
      metadata,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      referrer: context?.referrer,
      utmSource: context?.utmSource,
      utmMedium: context?.utmMedium,
      utmCampaign: context?.utmCampaign,
      referralCode: context?.referralCode,
    });

    return this.eventsRepository.save(event);
  }

  async getStats() {
    const totalEvents = await this.eventsRepository.count();
    const orderEvents = await this.eventsRepository.count({
      where: { eventType: EventType.ORDER_COMPLETE },
    });

    const totalVolumeResult = await this.eventsRepository
      .createQueryBuilder('event')
      .select('SUM((event.metadata->>\'amount\')::numeric)', 'total')
      .where('event.eventType = :type', { type: EventType.ORDER_COMPLETE })
      .getRawOne();

    return {
      totalEvents,
      totalOrders: orderEvents,
      totalVolume: parseFloat(totalVolumeResult?.total || '0'),
    };
  }

  async getAttributionStats(referralCode?: string) {
    const query = this.eventsRepository
      .createQueryBuilder('event')
      .where('event.referralCode IS NOT NULL');

    if (referralCode) {
      query.andWhere('event.referralCode = :code', { code: referralCode });
    }

    const events = await query.getMany();

    const stats = events.reduce((acc, event) => {
      const code = event.referralCode;
      if (!acc[code]) {
        acc[code] = { clicks: 0, conversions: 0, revenue: 0 };
      }
      acc[code].clicks++;
      if (event.eventType === EventType.ORDER_COMPLETE) {
        acc[code].conversions++;
        acc[code].revenue += parseFloat(event.metadata?.amount || '0');
      }
      return acc;
    }, {} as Record<string, { clicks: number; conversions: number; revenue: number }>);

    return stats;
  }
}


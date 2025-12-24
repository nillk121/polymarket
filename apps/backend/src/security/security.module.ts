import { Module } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { MultiAccountDetectionService } from './services/multi-account-detection.service';
import { SuspiciousBettingService } from './services/suspicious-betting.service';
import { MarketFreezeService } from './services/market-freeze.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SecurityController],
  providers: [
    MultiAccountDetectionService,
    SuspiciousBettingService,
    MarketFreezeService,
  ],
  exports: [
    MultiAccountDetectionService,
    SuspiciousBettingService,
    MarketFreezeService,
  ],
})
export class SecurityModule {}


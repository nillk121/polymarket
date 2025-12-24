import { Module } from '@nestjs/common';
import { MarketResolutionService } from './market-resolution.service';
import { MarketResolutionController } from './market-resolution.controller';
import { OracleService } from './oracles/oracle.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MarketResolutionController],
  providers: [MarketResolutionService, OracleService],
  exports: [MarketResolutionService, OracleService],
})
export class MarketResolutionModule {}


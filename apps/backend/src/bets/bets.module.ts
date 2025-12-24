import { Module } from '@nestjs/common';
import { BetsService } from './bets.service';
import { BetsController } from './bets.controller';
import { BalanceService } from './services/balance.service';
import { TransactionService } from './services/transaction.service';
import { BetsGateway } from './gateways/bets.gateway';
import { MarketsModule } from '../markets/markets.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SecurityModule } from '../security/security.module';
import { CommonModule } from '../common/common.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    MarketsModule,
    SecurityModule,
    CommonModule,
    JwtModule,
    ConfigModule,
  ],
  controllers: [BetsController],
  providers: [
    BetsService,
    BalanceService,
    TransactionService,
    BetsGateway,
  ],
  exports: [BetsService, BalanceService, TransactionService, BetsGateway],
})
export class BetsModule {}

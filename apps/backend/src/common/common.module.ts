import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MarketValidator } from './validators/market.validator';
import { UserValidator } from './validators/user.validator';
import { WalletValidator } from './validators/wallet.validator';
import { CategoryValidator } from './validators/category.validator';

/**
 * Общий модуль для валидаторов и утилит
 */
@Module({
  imports: [PrismaModule],
  providers: [
    MarketValidator,
    UserValidator,
    WalletValidator,
    CategoryValidator,
  ],
  exports: [
    MarketValidator,
    UserValidator,
    WalletValidator,
    CategoryValidator,
  ],
})
export class CommonModule {}


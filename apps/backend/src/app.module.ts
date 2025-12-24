import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import Redis from 'ioredis';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { MarketsModule } from './markets/markets.module';
import { BetsModule } from './bets/bets.module';
import { PaymentsModule } from './payments/payments.module';
import { PayoutsModule } from './payouts/payouts.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';
import { ChannelsModule } from './channels/channels.module';
import { PostTemplatesModule } from './post-templates/post-templates.module';
import { PostsModule } from './posts/posts.module';
import { MarketResolutionModule } from './market-resolution/market-resolution.module';
import { SecurityModule } from './security/security.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Redis cache
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const redis = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
        });
        
        const store = await redisStore({
          client: redis,
        });
        
        return {
          store,
          ttl: 300, // 5 minutes default TTL
        };
      },
    }),

    // Application modules
    PrismaModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    MarketsModule,
    BetsModule,
    PaymentsModule,
    PayoutsModule,
    AnalyticsModule,
    AdminModule,
    ChannelsModule,
    PostTemplatesModule,
    PostsModule,
    MarketResolutionModule,
    SecurityModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { DeeplinkService } from './services/deeplink.service';
import { TrafficTrackingService } from './services/traffic-tracking.service';
import { TelegramPostingService } from './services/telegram-posting.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PostTemplatesModule } from '../post-templates/post-templates.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, PostTemplatesModule, ConfigModule],
  controllers: [PostsController],
  providers: [
    PostsService,
    DeeplinkService,
    TrafficTrackingService,
    TelegramPostingService,
  ],
  exports: [
    PostsService,
    DeeplinkService,
    TrafficTrackingService,
    TelegramPostingService,
  ],
})
export class PostsModule {}


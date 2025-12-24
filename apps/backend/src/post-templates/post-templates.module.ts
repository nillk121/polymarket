import { Module } from '@nestjs/common';
import { PostTemplatesService } from './post-templates.service';
import { PostTemplatesController } from './post-templates.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PostTemplatesController],
  providers: [PostTemplatesService],
  exports: [PostTemplatesService],
})
export class PostTemplatesModule {}


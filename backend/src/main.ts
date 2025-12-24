import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: configService.get('CORS_ORIGIN'),
    credentials: true,
  });

  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  
  console.log(`🚀 Сервер запущен на порту ${port}`);
}

bootstrap();


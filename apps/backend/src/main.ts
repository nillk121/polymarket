import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  
  const configService = app.get(ConfigService);
  
  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN') || '*',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  
  logger.log(`🚀 Сервер запущен на порту ${port}`);
  logger.log(`📚 API доступен по адресу: http://localhost:${port}/api`);
}

bootstrap();

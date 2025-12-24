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
  const corsOrigin = configService.get('CORS_ORIGIN');
  const defaultOrigins = [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://localhost:5173',
    // Cloudflare Tunnel URLs (для разработки)
    'https://details-cluster-marco-others.trycloudflare.com', // Mini App
    'https://premier-patient-concert-matthew.trycloudflare.com', // Dashboard
  ];
  const allowedOrigins = corsOrigin 
    ? [...defaultOrigins, ...corsOrigin.split(',').map(origin => origin.trim())]
    : defaultOrigins;
  
  // Удаляем дубликаты
  const uniqueOrigins = [...new Set(allowedOrigins)];
  
  logger.log(`🌐 CORS разрешенные origins: ${uniqueOrigins.join(', ')}`);
  
  app.enableCors({
    origin: (origin, callback) => {
      // Разрешаем запросы без origin (например, Postman, curl, мобильные приложения)
      if (!origin) {
        logger.debug('CORS: запрос без origin - разрешен');
        return callback(null, true);
      }
      
      // Разрешаем все Cloudflare Tunnel URLs (для разработки)
      if (origin.includes('.trycloudflare.com')) {
        logger.debug(`CORS: origin ${origin} разрешен (Cloudflare Tunnel)`);
        return callback(null, true);
      }
      
      // Разрешаем запросы с разрешенных origins
      if (uniqueOrigins.includes(origin)) {
        logger.debug(`CORS: origin ${origin} разрешен`);
        return callback(null, true);
      }
      
      // Если в списке есть '*', разрешаем все
      if (uniqueOrigins.includes('*')) {
        logger.debug(`CORS: origin ${origin} разрешен (wildcard)`);
        return callback(null, true);
      }
      
      logger.warn(`CORS: origin ${origin} не разрешен`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Methods',
    ],
    exposedHeaders: ['Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  const port = configService.get('PORT') || 3002;
  await app.listen(port);
  
  logger.log(`🚀 Сервер запущен на порту ${port}`);
  logger.log(`📚 API доступен по адресу: http://localhost:${port}/api`);
}

bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');

  // ── Dynamic CORS from environment ──
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:4200');
  const origins = corsOrigin.split(',').map((o: string) => o.trim());

  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-empresa-id'],
  });

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`🚀 Backend running on port ${port} | ENV: ${configService.get('NODE_ENV')}`);
}
bootstrap();


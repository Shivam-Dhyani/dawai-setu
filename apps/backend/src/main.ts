import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.use(helmet());
  app.useLogger(app.get(Logger));

  // Validate and strip all request bodies at the API boundary (PRD §15).
  // Internal service calls trust their own data — no re-validation there.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: [
      process.env.HOSPITAL_PORTAL_URL ?? 'http://localhost:5173',
      process.env.PHARMACY_PORTAL_URL ?? 'http://localhost:5174',
    ],
    credentials: true,
  });

  // OpenAPI spec — consumed by packages/api-types codegen
  const config = new DocumentBuilder()
    .setTitle('DawaiSetu API')
    .setDescription('Shared backend for Hospital Portal and Pharmacy Portal')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();

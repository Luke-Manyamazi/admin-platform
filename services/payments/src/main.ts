/**
 * Payments Service — entry point
 *
 * Port:    3013  (configurable via PORT env var)
 * Prefix:  /api/v1
 *
 * Architecture:
 *   - Escrow-based payment flow: PENDING → HELD → RELEASED / REFUNDED
 *   - Peach Payments (ZA primary) and Flutterwave (pan-African) gateways
 *   - Camluk 8% platform commission deducted from each order payment
 *   - Internal HTTP endpoints consumed by EventBridge-to-HTTP targets
 *     for order-completed and order-cancelled cross-service triggers
 */

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggerService } from './common/logger/logger.service';

const PORT = parseInt(process.env['PORT'] ?? '3013', 10);
const SERVICE = 'payments-service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });

  const logger = new LoggerService(SERVICE);
  app.useLogger(logger);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.useGlobalInterceptors(new ResponseInterceptor());

  if (process.env['NODE_ENV'] !== 'production') {
    app.enableCors();
  }

  await app.listen(PORT);
  logger.log(`${SERVICE} listening on port ${PORT}`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  process.stderr.write(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'fatal',
      service: SERVICE,
      message: 'Failed to start payments service',
      error: error instanceof Error ? error.message : String(error),
    }) + '\n',
  );
  process.exit(1);
});

/**
 * Factory Service — entry point
 *
 * Port:    3010  (configurable via PORT env var)
 * Prefix:  /api/v1
 *
 * Architecture:
 *   - All routes versioned under /api/v1/
 *   - Global ValidationPipe (whitelist, transform, forbidNonWhitelisted)
 *   - Global AllExceptionsFilter → standard { success: false, error: {...} } shape
 *   - Global ResponseInterceptor → standard { success: true, data, meta } shape
 *   - Structured JSON logging via LoggerService (CloudWatch compatible)
 */

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggerService } from './common/logger/logger.service';

const PORT = parseInt(process.env['PORT'] ?? '3010', 10);
const SERVICE = 'factory-service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    // Disable built-in logger — we replace it with LoggerService below
    logger: false,
  });

  // ── Structured JSON logger ──────────────────────────────────────────────────
  const logger = new LoggerService();
  app.useLogger(logger);

  // ── Global route prefix ────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Validation ────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,                      // strip unknown properties
      forbidNonWhitelisted: true,           // throw on unknown properties
      transform: true,                      // auto-transform to DTO class instances
      transformOptions: {
        enableImplicitConversion: true,     // convert query string numbers/booleans
      },
    }),
  );

  // ── Global filters & interceptors ─────────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.useGlobalInterceptors(new ResponseInterceptor());

  // ── CORS ──────────────────────────────────────────────────────────────────
  // API Gateway handles CORS in production — enable permissively for local dev
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
      message: 'Failed to start factory service',
      error: error instanceof Error ? error.message : String(error),
    }) + '\n',
  );
  process.exit(1);
});

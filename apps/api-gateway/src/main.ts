/**
 * API Gateway — entry point
 *
 * Port:   3001  (configurable via PORT env var)
 * Prefix: /api/v1
 *
 * Responsibilities:
 *   - Auth: register, login, JWT issuance (handled locally)
 *   - Proxy: transparent forwarding to downstream microservices
 *       /api/v1/factories/**     → factory-service   :3010
 *       /api/v1/orders/**        → orders-service    :3011
 *       /api/v1/suborders/**     → orders-service    :3011
 *       /api/v1/payments/**      → payments-service  :3013
 *       /api/v1/notifications/** → notifications-service :3012
 *   - CORS: permissive in dev, locked to portal origins in prod
 *   - Rate limiting: @nestjs/throttler on all routes
 *   - Health: GET /health (gateway + downstream liveness)
 *
 * JWT strategy:
 *   Gateway issues tokens (login/register). Downstream services re-verify
 *   the same token independently using the shared JWT_SECRET. The gateway
 *   forwards the Authorization header unchanged.
 */

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggerService } from './common/logger/logger.service';

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const SERVICE = 'api-gateway';

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

  // CORS — in production lock to specific portal origins
  if (process.env['NODE_ENV'] !== 'production') {
    app.enableCors();
  } else {
    app.enableCors({
      origin: [
        process.env['BUYER_PORTAL_ORIGIN'] ?? 'https://admin-platform.camluk.com',
        process.env['ADMIN_PORTAL_ORIGIN'] ?? 'https://admin.camluk.com',
      ],
      credentials: true,
    });
  }

  await app.listen(PORT);
  logger.log(`${SERVICE} listening on port ${PORT}`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  process.stderr.write(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'fatal',
      service: SERVICE,
      message: 'Failed to start API gateway',
      error: message,
      ...(stack ? { stack } : {}),
    }) + '\n',
  );

  // Let Node flush stderr naturally instead of terminating synchronously.
  process.exitCode = 1;
});

import 'reflect-metadata';

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const SERVICE = 'api-gateway';

async function bootstrap(): Promise<void> {
  // Keep module loading inside the guarded bootstrap so dependency-load failures
  // (including Prisma/generated-client problems) are reported instead of looking
  // like a silent process exit.
  const { NestFactory } = await import('@nestjs/core');
  const { ValidationPipe } = await import('@nestjs/common');
  const { AppModule } = await import('./app.module');
  const { AllExceptionsFilter } = await import('./common/filters/all-exceptions.filter');
  const { ResponseInterceptor } = await import('./common/interceptors/response.interceptor');
  const { LoggerService } = await import('./common/logger/logger.service');

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

process.on('uncaughtException', (error: Error) => {
  process.stderr.write(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'fatal',
      service: SERVICE,
      message: 'Uncaught exception',
      error: error.message,
      ...(error.stack ? { stack: error.stack } : {}),
    }) + '\\n',
  );
  process.exitCode = 1;
});

process.on('unhandledRejection', (reason: unknown) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  process.stderr.write(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'fatal',
      service: SERVICE,
      message: 'Unhandled promise rejection',
      error: error.message,
      ...(error.stack ? { stack: error.stack } : {}),
    }) + '\\n',
  );
  process.exitCode = 1;
});

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
    }) + '\\n',
  );

  process.exitCode = 1;
});

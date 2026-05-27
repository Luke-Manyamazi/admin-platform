import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { FactoryModule } from './factory/factory.module';

/**
 * AppModule — root NestJS module for the factory service.
 *
 * JwtModule is registered globally so JwtAuthGuard can inject JwtService
 * without needing to re-declare it in every feature module.
 *
 * Guards (JwtAuthGuard, RolesGuard) are applied per-controller via @UseGuards()
 * rather than globally with APP_GUARD, so @Public() can selectively skip them.
 */
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env['JWT_SECRET'] ?? 'dev-secret-CHANGE-IN-PROD',
      signOptions: {
        expiresIn: process.env['JWT_EXPIRES_IN'] ?? '7d',
      },
    }),
    FactoryModule,
  ],
})
export class AppModule {}

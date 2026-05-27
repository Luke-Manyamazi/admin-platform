import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationModule } from './notification/notification.module';

/**
 * AppModule — root NestJS module for the notifications service.
 *
 * JwtModule is registered globally for admin API routes.
 * Internal event webhooks use X-Internal-Secret header instead of JWT.
 */
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env['JWT_SECRET'] ?? 'dev-secret-CHANGE-IN-PROD',
      signOptions: { expiresIn: process.env['JWT_EXPIRES_IN'] ?? '7d' },
    }),
    NotificationModule,
  ],
})
export class AppModule {}

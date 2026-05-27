import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PaymentModule } from './payment/payment.module';

/**
 * AppModule — root NestJS module for the payments service.
 *
 * JwtModule is registered globally so JwtAuthGuard can validate
 * buyer and admin Bearer tokens on payment endpoints.
 *
 * Webhook endpoints are @Public() — they validate HMAC/hash signatures
 * instead of JWT tokens.
 */
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env['JWT_SECRET'] ?? 'dev-secret-CHANGE-IN-PROD',
      signOptions: { expiresIn: process.env['JWT_EXPIRES_IN'] ?? '7d' },
    }),
    PaymentModule,
  ],
})
export class AppModule {}

import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AllExceptionsFilter }  from './common/filters/all-exceptions.filter';
import { JwtAuthGuard }         from './common/guards/jwt-auth.guard';
import { RolesGuard }           from './common/guards/roles.guard';
import { ResponseInterceptor }  from './common/interceptors/response.interceptor';
import { LoggerService }        from './common/logger/logger.service';

import { AuthModule }           from './auth/auth.module';
import { HealthModule }         from './health/health.module';

import { ProxyService }                  from './proxy/proxy.service';
import { FactoryProxyMiddleware }        from './proxy/factory.proxy.middleware';
import { OrdersProxyMiddleware }         from './proxy/orders.proxy.middleware';
import { PaymentsProxyMiddleware }       from './proxy/payments.proxy.middleware';
import { NotificationsProxyMiddleware }  from './proxy/notifications.proxy.middleware';

@Module({
  imports: [
    // JWT — global so JwtAuthGuard works in every module without re-importing
    JwtModule.register({
      global: true,
      secret: process.env['JWT_SECRET'] ?? 'change-me-in-production',
      signOptions: { expiresIn: process.env['JWT_EXPIRES_IN'] ?? '7d' },
    }),

    // Rate limiting — 100 req / 60 s per IP by default; override via env
    ThrottlerModule.forRoot([
      {
        ttl:   Number(process.env['THROTTLE_TTL_MS']  ?? 60_000),
        limit: Number(process.env['THROTTLE_LIMIT']   ?? 100),
      },
    ]),

    AuthModule,
    HealthModule,
  ],

  providers: [
    LoggerService,

    // Proxy service — used by all proxy middlewares
    ProxyService,

    // Global exception filter
    { provide: APP_FILTER,       useClass: AllExceptionsFilter  },

    // Global guards — order matters: throttle first, then JWT, then roles
    { provide: APP_GUARD,        useClass: ThrottlerGuard   },
    { provide: APP_GUARD,        useClass: JwtAuthGuard     },
    { provide: APP_GUARD,        useClass: RolesGuard       },

    // Global response envelope interceptor
    { provide: APP_INTERCEPTOR,  useClass: ResponseInterceptor },
  ],
})
export class AppModule implements NestModule {
  /**
   * Proxy middleware routing:
   *
   *  /api/v1/factories/**     → FactoryProxyMiddleware       → :3010
   *  /api/v1/orders/**        → OrdersProxyMiddleware        → :3011
   *  /api/v1/suborders/**     → OrdersProxyMiddleware        → :3011
   *  /api/v1/payments/**      → PaymentsProxyMiddleware      → :3013
   *  /api/v1/notifications/** → NotificationsProxyMiddleware → :3012
   *
   * Note: these middlewares bypass NestJS routing entirely — they operate
   * at the Express layer and call res.send() directly, so guards / interceptors
   * do NOT run on proxied routes.  Auth is enforced by the downstream service.
   *
   * The `path` strings here match AFTER the global prefix (api/v1) has already
   * been stripped by NestJS, so we match on the remainder.
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(FactoryProxyMiddleware)
      .forRoutes({ path: 'factories*', method: RequestMethod.ALL });

    consumer
      .apply(OrdersProxyMiddleware)
      .forRoutes(
        { path: 'orders*',    method: RequestMethod.ALL },
        { path: 'suborders*', method: RequestMethod.ALL },
      );

    consumer
      .apply(PaymentsProxyMiddleware)
      .forRoutes({ path: 'payments*', method: RequestMethod.ALL });

    consumer
      .apply(NotificationsProxyMiddleware)
      .forRoutes({ path: 'notifications*', method: RequestMethod.ALL });
  }
}

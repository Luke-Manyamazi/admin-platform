import { Injectable, type NestMiddleware } from '@nestjs/common';
import { type Request, type Response, type NextFunction } from 'express';
import { ProxyService } from './proxy.service';

/**
 * Forwards /api/v1/payments/** to the payments-service (port 3013).
 */
@Injectable()
export class PaymentsProxyMiddleware implements NestMiddleware {
  private readonly targetBase =
    process.env['PAYMENTS_SERVICE_URL'] ?? 'http://localhost:3013';

  constructor(private readonly proxy: ProxyService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    void this.proxy.forward(req, res, this.targetBase);
  }
}

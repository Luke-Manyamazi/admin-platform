import { Injectable, type NestMiddleware } from '@nestjs/common';
import { type Request, type Response, type NextFunction } from 'express';
import { ProxyService } from './proxy.service';

/**
 * Forwards /api/v1/orders/** and /api/v1/suborders/** to the orders-service (port 3011).
 */
@Injectable()
export class OrdersProxyMiddleware implements NestMiddleware {
  private readonly targetBase =
    process.env['ORDERS_SERVICE_URL'] ?? 'http://localhost:3011';

  constructor(private readonly proxy: ProxyService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    void this.proxy.forward(req, res, this.targetBase);
  }
}

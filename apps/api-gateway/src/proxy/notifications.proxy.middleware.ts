import { Injectable, type NestMiddleware } from '@nestjs/common';
import { type Request, type Response, type NextFunction } from 'express';
import { ProxyService } from './proxy.service';

/**
 * Forwards /api/v1/notifications/** to the notifications-service (port 3012).
 */
@Injectable()
export class NotificationsProxyMiddleware implements NestMiddleware {
  private readonly targetBase =
    process.env['NOTIFICATIONS_SERVICE_URL'] ?? 'http://localhost:3012';

  constructor(private readonly proxy: ProxyService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    void this.proxy.forward(req, res, this.targetBase);
  }
}

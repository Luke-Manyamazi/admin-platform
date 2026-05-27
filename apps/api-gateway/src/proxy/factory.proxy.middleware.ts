import { Injectable, type NestMiddleware } from '@nestjs/common';
import { type Request, type Response, type NextFunction } from 'express';
import { ProxyService } from './proxy.service';

/**
 * Forwards /api/v1/factories/** to the factory-service (port 3010).
 */
@Injectable()
export class FactoryProxyMiddleware implements NestMiddleware {
  private readonly targetBase =
    process.env['FACTORY_SERVICE_URL'] ?? 'http://localhost:3010';

  constructor(private readonly proxy: ProxyService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    void this.proxy.forward(req, res, this.targetBase);
  }
}

import { Injectable } from '@nestjs/common';
import axios, { type Method } from 'axios';
import { type Request, type Response } from 'express';
import { LoggerService } from '../common/logger/logger.service';

/**
 * ProxyService — transparent HTTP forwarding to downstream microservices.
 *
 * Forwards: method, path, query string, body, Authorization header,
 *           content-type, and a standard set of safe headers.
 *
 * Does NOT forward hop-by-hop headers (connection, transfer-encoding, etc.)
 * that are specific to the client↔gateway connection.
 *
 * Error handling: downstream errors (4xx, 5xx) are forwarded as-is.
 * Network errors (downstream unreachable) return 502 Bad Gateway.
 */
@Injectable()
export class ProxyService {
  private static readonly CTX = 'ProxyService';

  // Headers to strip before forwarding to downstream
  private static readonly HOP_BY_HOP = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailers',
    'transfer-encoding',
    'upgrade',
    'host',                // rewritten by axios to the target host
  ]);

  constructor(private readonly logger: LoggerService) {}

  async forward(req: Request, res: Response, targetBaseUrl: string): Promise<void> {
    // Construct full target URL: base + original path (includes query string)
    const targetUrl = `${targetBaseUrl}${req.originalUrl}`;

    // Filter headers
    const forwardHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (!ProxyService.HOP_BY_HOP.has(key.toLowerCase()) && typeof value === 'string') {
        forwardHeaders[key] = value;
      }
    }

    this.logger.log(
      `→ ${req.method} ${targetUrl}`,
      ProxyService.CTX,
    );

    try {
      const response = await axios.request({
        method:         req.method as Method,
        url:            targetUrl,
        data:           req.body,
        headers:        forwardHeaders,
        validateStatus: () => true,   // forward 4xx/5xx as-is
        timeout:        30_000,
        // Don't decompress — forward the raw response body
        decompress:     false,
      });

      // Forward response headers that are safe to expose to the client
      const safeResponseHeaders = ['content-type', 'x-trace-id', 'cache-control', 'etag'];
      for (const header of safeResponseHeaders) {
        const value = response.headers[header];
        if (value !== undefined) {
          res.setHeader(header, value as string);
        }
      }

      res.status(response.status).send(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Proxy error forwarding to ${targetUrl}: ${message}`,
        err instanceof Error ? err.stack : undefined,
        ProxyService.CTX,
      );

      res.status(502).json({
        success: false,
        error: {
          code:    'BAD_GATEWAY',
          message: `Downstream service unavailable`,
        },
      });
    }
  }
}

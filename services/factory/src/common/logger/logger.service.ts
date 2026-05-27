import { Injectable, type LoggerService as NestLoggerService } from '@nestjs/common';

// ─── Log entry shape ──────────────────────────────────────────────────────────

interface LogEntry {
  readonly timestamp: string;
  readonly level: string;
  readonly service: string;
  readonly context?: string;
  readonly message: string;
  readonly trace?: string;
  readonly [key: string]: unknown;
}

// ─── Logger ───────────────────────────────────────────────────────────────────

/**
 * Structured JSON logger for the factory service.
 *
 * Implements NestJS LoggerService so it can replace the built-in logger
 * via app.useLogger(). Every line is a valid JSON object — compatible with
 * AWS CloudWatch Logs Insights and any JSON-aware log aggregator.
 *
 * Errors and warnings go to stderr; info/debug/verbose go to stdout.
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private static readonly SERVICE = 'factory-service';

  private emit(level: string, message: unknown, context?: string, trace?: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: LoggerService.SERVICE,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      ...(context !== undefined ? { context } : {}),
      ...(trace !== undefined ? { trace } : {}),
    };

    const line = JSON.stringify(entry) + '\n';
    if (level === 'error' || level === 'warn') {
      process.stderr.write(line);
    } else {
      process.stdout.write(line);
    }
  }

  log(message: unknown, context?: string): void {
    this.emit('info', message, context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.emit('error', message, context, trace);
  }

  warn(message: unknown, context?: string): void {
    this.emit('warn', message, context);
  }

  debug(message: unknown, context?: string): void {
    if (process.env['NODE_ENV'] !== 'production') {
      this.emit('debug', message, context);
    }
  }

  verbose(message: unknown, context?: string): void {
    this.emit('verbose', message, context);
  }
}

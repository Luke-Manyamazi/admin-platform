import { Injectable, type LoggerService as NestLoggerService } from '@nestjs/common';

interface LogEntry {
  readonly timestamp: string;
  readonly level: string;
  readonly service: string;
  readonly context?: string;
  readonly message: string;
  readonly trace?: string;
}

/**
 * Structured JSON logger — shared across all ADMIN microservices.
 *
 * Every line is valid JSON compatible with AWS CloudWatch Logs Insights.
 * Errors and warnings → stderr; everything else → stdout.
 *
 * Consuming service must set LoggerService.SERVICE before use, or pass the
 * service name via useLogger().
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  constructor(readonly serviceName: string = 'admin-service') {}

  private emit(level: string, message: unknown, context?: string, trace?: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
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

  log(message: unknown, context?: string): void    { this.emit('info',    message, context); }
  warn(message: unknown, context?: string): void   { this.emit('warn',    message, context); }
  verbose(message: unknown, context?: string): void { this.emit('verbose', message, context); }

  error(message: unknown, trace?: string, context?: string): void {
    this.emit('error', message, context, trace);
  }

  debug(message: unknown, context?: string): void {
    if (process.env['NODE_ENV'] !== 'production') this.emit('debug', message, context);
  }
}

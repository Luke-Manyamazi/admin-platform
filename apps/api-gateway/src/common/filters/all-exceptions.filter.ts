import {
  Catch,
  type ArgumentsHost,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
} from '@nestjs/common';
import { type Response } from 'express';
import { LoggerService } from '../logger/logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private static readonly CTX = 'ExceptionFilter';

  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const { status, code, message } = this.resolve(exception);

    this.logger.error(
      `${status} [${code}] ${message}`,
      exception instanceof Error ? exception.stack : String(exception),
      AllExceptionsFilter.CTX,
    );

    res.status(status).json({ success: false, error: { code, message } });
  }

  private resolve(ex: unknown): { status: number; code: string; message: string } {
    if (ex instanceof HttpException) {
      const body = ex.getResponse();
      const raw = typeof body === 'string' ? body : (body as { message?: string | string[] }).message;
      const message = Array.isArray(raw) ? raw.join('; ') : (raw ?? ex.message);
      const code = ex.constructor.name.replace(/Exception$/, '').toUpperCase().replace(/^_/, '');
      return { status: ex.getStatus(), code, message };
    }
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, code: 'INTERNAL_ERROR', message: 'Unexpected error' };
  }
}

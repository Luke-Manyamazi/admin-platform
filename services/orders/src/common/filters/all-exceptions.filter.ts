import {
  Catch,
  type ArgumentsHost,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
} from '@nestjs/common';
import { Prisma } from '@admin-platform/database';
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

    const traceId = res.getHeader('x-trace-id');
    res.status(status).json({
      success: false,
      error: {
        code,
        message,
        ...(typeof traceId === 'string' ? { traceId } : {}),
      },
    });
  }

  private resolve(ex: unknown): { status: number; code: string; message: string } {
    if (ex instanceof HttpException) {
      const body = ex.getResponse();
      const raw = typeof body === 'string' ? body : (body as { message?: string | string[] }).message;
      const message = Array.isArray(raw) ? raw.join('; ') : (raw ?? ex.message);
      const code = ex.constructor.name.replace(/Exception$/, '').toUpperCase().replace(/^_/, '');
      return { status: ex.getStatus(), code, message };
    }
    if (ex instanceof Prisma.PrismaClientKnownRequestError) {
      const map: Record<string, { status: number; code: string; message: string }> = {
        P2002: { status: HttpStatus.CONFLICT,     code: 'DUPLICATE_ENTRY',       message: 'Record already exists' },
        P2025: { status: HttpStatus.NOT_FOUND,    code: 'NOT_FOUND',             message: 'Record not found' },
        P2003: { status: HttpStatus.BAD_REQUEST,  code: 'FOREIGN_KEY_VIOLATION', message: 'Related record not found' },
      };
      return map[ex.code] ?? { status: HttpStatus.BAD_REQUEST, code: 'DATABASE_ERROR', message: 'Database error' };
    }
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, code: 'INTERNAL_ERROR', message: 'Unexpected error' };
  }
}

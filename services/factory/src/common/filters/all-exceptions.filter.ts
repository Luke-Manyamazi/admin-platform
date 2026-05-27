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

// ─── Error response shape ─────────────────────────────────────────────────────

interface ErrorBody {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly traceId?: string;
  };
}

// ─── Filter ───────────────────────────────────────────────────────────────────

/**
 * Global exception filter — catches every unhandled exception and returns the
 * standard ADMIN error envelope: { success: false, error: { code, message, traceId } }.
 *
 * Prisma known errors (P2002, P2025) are mapped to appropriate HTTP status codes.
 * Everything else becomes a 500 Internal Server Error.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private static readonly CONTEXT = 'ExceptionFilter';

  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, code, message } = this.resolveError(exception);

    this.logger.error(
      `${status} [${code}] ${message}`,
      exception instanceof Error ? exception.stack : String(exception),
      AllExceptionsFilter.CONTEXT,
    );

    const traceId = response.getHeader('x-trace-id');

    const body: ErrorBody = {
      success: false,
      error: {
        code,
        message,
        ...(typeof traceId === 'string' ? { traceId } : {}),
      },
    };

    response.status(status).json(body);
  }

  private resolveError(exception: unknown): {
    status: number;
    code: string;
    message: string;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : (res as { message?: string | string[] }).message !== undefined
            ? Array.isArray((res as { message: string[] }).message)
              ? (res as { message: string[] }).message.join('; ')
              : String((res as { message: string }).message)
            : exception.message;

      const code = exception.constructor.name
        .replace(/Exception$/, '')
        .replace(/([A-Z])/g, '_$1')
        .toUpperCase()
        .replace(/^_/, '');

      return { status, code, message };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return {
            status: HttpStatus.CONFLICT,
            code: 'DUPLICATE_ENTRY',
            message: 'A record with this value already exists',
          };
        case 'P2025':
          return {
            status: HttpStatus.NOT_FOUND,
            code: 'NOT_FOUND',
            message: 'The requested record was not found',
          };
        case 'P2003':
          return {
            status: HttpStatus.BAD_REQUEST,
            code: 'FOREIGN_KEY_VIOLATION',
            message: 'Related record not found',
          };
        default:
          return {
            status: HttpStatus.BAD_REQUEST,
            code: 'DATABASE_ERROR',
            message: 'A database error occurred',
          };
      }
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    };
  }
}

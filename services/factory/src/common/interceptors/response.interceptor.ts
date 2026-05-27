import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from '@nestjs/common';
import { type Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * ResponseInterceptor — globally wraps every successful controller response in
 * the ADMIN success envelope: { success: true, data: <original>, meta: {} }.
 *
 * If the controller explicitly returns an object with a `success` key (i.e.
 * it already built the envelope), the response is passed through unchanged
 * to avoid double-wrapping.
 *
 * Pagination responses should return:
 *   { data: items[], meta: { page, limit, total, totalPages } }
 * from the service/controller; this interceptor will wrap it correctly.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(_ctx: ExecutionContext, next: CallHandler<T>): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        if (
          data !== null &&
          data !== undefined &&
          typeof data === 'object' &&
          'success' in (data as Record<string, unknown>)
        ) {
          return data;
        }

        return {
          success: true as const,
          data,
          meta: {},
        };
      }),
    );
  }
}

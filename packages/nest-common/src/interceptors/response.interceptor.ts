import { Injectable, type NestInterceptor, type ExecutionContext, type CallHandler } from '@nestjs/common';
import { type Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(_: ExecutionContext, next: CallHandler<T>): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        if (data !== null && data !== undefined && typeof data === 'object' && 'success' in (data as Record<string, unknown>))
          return data;
        return { success: true as const, data, meta: {} };
      }),
    );
  }
}

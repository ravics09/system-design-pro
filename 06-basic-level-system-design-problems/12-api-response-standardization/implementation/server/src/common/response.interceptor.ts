import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Request } from 'express';
import { getRequestId } from './trace-context';
import { config } from '../config';
import { Paginated, versionFromUrl, type ApiSuccess, type Meta } from './envelope';

/**
 * Wraps EVERY successful controller return value in the standard success
 * envelope and injects `meta` (requestId from the trace context, version from
 * the URL, timestamp). A `Paginated` return lifts its page info into
 * `meta.pagination`. Controllers just return plain data.
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiSuccess<unknown>> {
    const req = context.switchToHttp().getRequest<Request>();
    return next.handle().pipe(
      map((payload): ApiSuccess<unknown> => {
        const meta: Meta = {
          requestId: getRequestId() ?? 'unknown',
          timestamp: new Date().toISOString(),
          version: versionFromUrl(req.originalUrl, config.DEFAULT_VERSION),
        };
        if (payload instanceof Paginated) {
          meta.pagination = payload.pageInfo;
          return { success: true, data: payload.items, meta };
        }
        return { success: true, data: payload, meta };
      }),
    );
  }
}

import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Response } from 'express';
import { config } from '../config';

/**
 * Advertises deprecation on a version's responses (RFC 8594): the endpoint still
 * works, but clients/monitoring can detect it and migrate before the sunset date.
 * Applied to the v1 controller via @UseInterceptors.
 */
@Injectable()
export class DeprecationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const res = context.switchToHttp().getResponse<Response>();
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', config.V1_SUNSET);
    res.setHeader('Link', '<https://docs.example.com/api/migrate/v2>; rel="deprecation"');
    return next.handle().pipe(tap(() => undefined));
  }
}

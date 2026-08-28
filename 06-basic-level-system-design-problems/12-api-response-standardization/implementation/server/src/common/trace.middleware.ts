import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { runWithContext } from './trace-context';
import { logger } from './logger';

/** Accept a safe inbound id or fall back to a generated one (bounded charset/length). */
function resolveRequestId(req: Request): string {
  const inbound = req.header('x-request-id');
  if (inbound && /^[\w.-]{1,128}$/.test(inbound)) return inbound; // honor upstream id
  return `req_${randomUUID()}`;
}

/**
 * The entry point for tracing. Establishes the request id, exposes it on the
 * response header, and runs the ENTIRE downstream pipeline inside an
 * AsyncLocalStorage context so any code (services, logger, filters) can read it.
 * Also logs request start/finish with duration.
 */
@Injectable()
export class TraceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = resolveRequestId(req);
    res.setHeader('X-Request-Id', requestId);

    const start = Date.now();
    runWithContext({ requestId }, () => {
      logger.info('request.start', { method: req.method, path: req.originalUrl });
      res.on('finish', () => {
        logger.info('request.finish', {
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode,
          ms: Date.now() - start,
        });
      });
      next();
    });
  }
}

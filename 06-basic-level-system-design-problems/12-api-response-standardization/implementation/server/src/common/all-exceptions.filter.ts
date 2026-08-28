import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppError } from './app-error';
import { getRequestId } from './trace-context';
import { logger } from './logger';
import { config } from '../config';
import { versionFromUrl, type ApiError, type Meta } from './envelope';

/** Map an HTTP status to a default machine-readable code. */
const STATUS_CODE: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'TOO_MANY_REQUESTS',
};

/**
 * Turns ANY thrown error into the standard error envelope:
 *  - AppError      → its status/code/message/details
 *  - HttpException → status + derived code + message
 *  - anything else → 500 INTERNAL (generic message; real error logged, not leaked)
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = 500;
    let code = 'INTERNAL';
    let message = 'Internal server error';
    let details: unknown;

    if (exception instanceof AppError) {
      status = exception.status;
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = STATUS_CODE[status] ?? 'HTTP_ERROR';
      const body = exception.getResponse();
      message =
        typeof body === 'string'
          ? body
          : ((body as { message?: string | string[] }).message as string) ?? exception.message;
      if (Array.isArray(message)) message = message.join('; ');
    } else {
      // Unknown error: log the real thing (correlated by requestId), leak nothing.
      logger.error('unhandled.exception', {
        err: exception instanceof Error ? exception.stack : String(exception),
      });
    }

    const meta: Meta = {
      requestId: getRequestId() ?? 'unknown',
      timestamp: new Date().toISOString(),
      version: versionFromUrl(req.originalUrl, config.DEFAULT_VERSION),
    };
    const envelope: ApiError = {
      success: false,
      error: { code, message, ...(details !== undefined ? { details } : {}) },
      meta,
    };
    res.status(status).json(envelope);
  }
}

import type { Request, Response, NextFunction } from "express";
import { HttpError, TooManyRequestsError } from "../errors/httpErrors.js";
import { logger } from "../lib/logger.js";

/** 404 handler for unmatched routes. */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
}

/**
 * Central error handler. Translates thrown HttpErrors into clean JSON and hides
 * internal details for unexpected errors.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    if (err instanceof TooManyRequestsError && err.retryAfterSeconds) {
      res.setHeader("Retry-After", String(err.retryAfterSeconds));
    }
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  logger.error("Unhandled error", { err: err instanceof Error ? err.message : String(err) });
  res.status(500).json({ error: { code: "INTERNAL", message: "Internal server error" } });
}

/** Wrap async route handlers so rejected promises reach the error handler. */
export function asyncHandler<T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: T, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

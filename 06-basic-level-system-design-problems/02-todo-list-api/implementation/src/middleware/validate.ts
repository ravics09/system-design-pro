import type { Request, Response, NextFunction } from "express";
import { type ZodType } from "zod";
import { BadRequestError } from "../errors/httpErrors.js";

/** Validate `req.body` against a Zod schema, replacing it with the parsed value. */
export function validateBody<S extends ZodType>(schema: S) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new BadRequestError("Validation failed", result.error.flatten().fieldErrors);
    }
    req.body = result.data;
    next();
  };
}

/** Validate `req.query` against a Zod schema, storing the parsed value on `res.locals.query`. */
export function validateQuery<S extends ZodType>(schema: S) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      throw new BadRequestError("Invalid query parameters", result.error.flatten().fieldErrors);
    }
    // req.query is read-only in Express 5 typings; stash the parsed value instead.
    res.locals.query = result.data;
    next();
  };
}

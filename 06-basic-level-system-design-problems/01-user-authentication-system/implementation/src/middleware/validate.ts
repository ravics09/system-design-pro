import type { Request, Response, NextFunction } from "express";
import { type ZodType } from "zod";
import { BadRequestError } from "../errors/httpErrors.js";

/**
 * Validate `req.body` against a Zod schema, replacing it with the parsed
 * (typed, stripped) value. Rejects with a 400 + field details on failure.
 */
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

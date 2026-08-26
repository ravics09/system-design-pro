import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../types/index.js";
import type { Role } from "../config/index.js";
import { ForbiddenError, UnauthorizedError } from "../errors/httpErrors.js";

/**
 * Authorization middleware — answers *"what are you allowed to do?"*.
 *
 * Deliberately separate from `authenticate`: 401 means "we don't know who you
 * are", 403 means "we know you, but you can't do this". Use after `authenticate`.
 */
export function authorize(...roles: Role[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError("Not authenticated");
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      throw new ForbiddenError("Insufficient permissions");
    }
    next();
  };
}

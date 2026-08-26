import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../types/index.js";
import { UnauthorizedError } from "../errors/httpErrors.js";

/**
 * Authentication middleware.
 *
 * In a real system this verifies a signed JWT (see Problem 01) and attaches the
 * resolved principal to `req.user`. To keep this reference implementation
 * runnable without an auth server, we accept the user id via a Bearer token
 * (`Authorization: Bearer <userId>`) or the `x-user-id` header.
 *
 * The critical property: `userId` comes from the token, NEVER the request body.
 */
export function authenticate(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7).trim() : undefined;
  const userId = bearer ?? req.header("x-user-id");

  if (!userId) throw new UnauthorizedError();
  req.user = { id: userId };
  next();
}

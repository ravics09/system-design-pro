import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../types/index.js";
import { UnauthorizedError } from "../errors/httpErrors.js";
import { verifyAccessToken } from "../utils/jwt.js";

/**
 * Authentication middleware — answers *"who is this?"*.
 *
 * It verifies the signed access token LOCALLY (signature + expiry + issuer +
 * audience), with the algorithm pinned. No DB or Redis lookup happens on this
 * hot path, which is what lets the service scale statelessly across instances.
 *
 * Immediate global revocation is handled elsewhere (short access-token TTL +
 * bumping the user's tokenVersion, enforced on refresh); the version is carried
 * in the token so a per-request check could be added if ever required.
 */
export function authenticate(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Authentication required");
  }

  const token = header.slice(7).trim();
  const claims = verifyAccessToken(token);

  req.user = { id: claims.sub, role: claims.role, tokenVersion: claims.tokenVersion };
  next();
}

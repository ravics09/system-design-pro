import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import type { AccessTokenClaims } from "../types/index.js";
import { UnauthorizedError } from "../errors/httpErrors.js";

/**
 * Access tokens are short-lived, stateless JWTs verified locally on every
 * request (no DB/Redis round-trip on the hot path). We pin the algorithm on
 * verify to prevent `alg: none` and algorithm-confusion attacks.
 *
 * Only non-sensitive claims go in the token (id, role, tokenVersion). A JWT is
 * signed, not encrypted — treat its payload as public.
 */
const ALGORITHM = "HS256" as const;

export function signAccessToken(claims: AccessTokenClaims): string {
  return jwt.sign(
    { role: claims.role, tokenVersion: claims.tokenVersion },
    config.JWT_ACCESS_SECRET,
    {
      algorithm: ALGORITHM,
      subject: claims.sub,
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE,
      expiresIn: config.ACCESS_TOKEN_TTL_SECONDS,
    },
  );
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  let decoded: jwt.JwtPayload;
  try {
    decoded = jwt.verify(token, config.JWT_ACCESS_SECRET, {
      algorithms: [ALGORITHM], // allow-list — never trust the token's own "alg"
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE,
    }) as jwt.JwtPayload;
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }

  if (!decoded.sub || typeof decoded.tokenVersion !== "number" || typeof decoded.role !== "string") {
    throw new UnauthorizedError("Malformed token");
  }

  return {
    sub: String(decoded.sub),
    role: decoded.role as AccessTokenClaims["role"],
    tokenVersion: decoded.tokenVersion,
  };
}

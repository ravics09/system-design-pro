import type { Request } from "express";
import type { Role } from "../config/index.js";

/** Claims embedded in the signed access token. */
export interface AccessTokenClaims {
  sub: string; // user id
  role: Role;
  tokenVersion: number; // enables "logout everywhere" / invalidate-on-password-change
}

/** The principal attached to a request after `authenticate`. */
export interface AuthUser {
  id: string;
  role: Role;
  tokenVersion: number;
}

/** Express request that has passed through the auth middleware. */
export interface AuthedRequest extends Request {
  user?: AuthUser;
}

/** A freshly issued token pair returned to the caller. */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // access-token lifetime in seconds
}

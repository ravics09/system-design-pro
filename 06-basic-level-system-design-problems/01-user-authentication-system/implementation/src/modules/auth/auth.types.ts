import type { Role } from "../../config/index.js";
import type { TokenPair } from "../../types/index.js";

/** Request metadata captured for a session (device fingerprinting / audit). */
export interface RequestContext {
  userAgent?: string;
  ipAddress?: string;
}

/** User fields safe to return to clients (never includes the password hash). */
export interface SanitizedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  isEmailVerified: boolean;
}

/** Result of a successful login / registration / refresh. */
export interface AuthResult {
  user: SanitizedUser;
  tokens: TokenPair;
}

import { config, type Role } from "../../config/index.js";
import { UserModel, type UserDoc } from "../../models/user.model.js";
import { SessionModel } from "../../models/session.model.js";
import { PasswordResetTokenModel } from "../../models/passwordResetToken.model.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { signAccessToken } from "../../utils/jwt.js";
import { generateOpaqueToken, hashToken, newFamilyId } from "../../utils/tokens.js";
import { logger } from "../../lib/logger.js";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from "../../errors/httpErrors.js";
import type { TokenPair } from "../../types/index.js";
import type {
  AuthResult,
  RequestContext,
  SanitizedUser,
} from "./auth.types.js";
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
} from "./auth.validation.js";

export class AuthService {
  /**
   * Register a new user. The unique index on `email` is the real guard against
   * duplicates under concurrency; we still translate the duplicate-key error into
   * a clean 409. On success we auto-login (issue a token pair).
   */
  async register(input: RegisterInput, ctx: RequestContext): Promise<AuthResult> {
    const passwordHash = await hashPassword(input.password);
    let user: UserDoc;
    try {
      user = await UserModel.create({
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
      });
    } catch (err) {
      if (isDuplicateKey(err)) throw new ConflictError("Email already registered");
      throw err;
    }

    logger.info("User registered", { userId: String(user._id) });
    const tokens = await this.issueSession(user, newFamilyId(), ctx);
    return { user: sanitize(user), tokens };
  }

  /**
   * Verify credentials and start a session. Uses a single GENERIC error whether
   * the email is unknown or the password is wrong, so attackers can't enumerate
   * valid accounts.
   */
  async login(input: LoginInput, ctx: RequestContext): Promise<AuthResult> {
    const user = await UserModel.findOne({ email: input.email.toLowerCase() }).select(
      "+passwordHash",
    );

    // Verify a password even when the user is missing to keep timing uniform.
    const hash = user?.passwordHash ?? DUMMY_HASH;
    const ok = await verifyPassword(hash, input.password);

    if (!user || !ok) throw new UnauthorizedError("Invalid email or password");
    if (!user.isActive) throw new UnauthorizedError("Account is disabled");

    logger.info("User logged in", { userId: String(user._id) });
    const tokens = await this.issueSession(user, newFamilyId(), ctx);
    return { user: sanitize(user), tokens };
  }

  /**
   * Rotate a refresh token.
   *
   * Reuse detection: if a token that has ALREADY been rotated (revoked) is
   * presented again, that signals theft — we revoke the entire token family.
   * Otherwise we revoke the presented token and issue a fresh one in the same
   * family, linking old → new via `replacedBy`.
   */
  async refresh(rawToken: string, ctx: RequestContext): Promise<AuthResult> {
    const tokenHash = hashToken(rawToken);
    const session = await SessionModel.findOne({ tokenHash });
    if (!session) throw new UnauthorizedError("Invalid refresh token");

    if (session.revokedAt) {
      // Replay of an already-rotated token → revoke the whole family.
      await SessionModel.updateMany(
        { family: session.family, revokedAt: null },
        { $set: { revokedAt: new Date() } },
      );
      logger.warn("Refresh token reuse detected; family revoked", { family: session.family });
      throw new UnauthorizedError("Refresh token reuse detected");
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedError("Refresh token expired");
    }

    const user = await UserModel.findById(session.userId);
    if (!user || !user.isActive) throw new UnauthorizedError("Account unavailable");

    // Issue the successor in the same family, then revoke the old one.
    const tokens = await this.issueSession(user, session.family, ctx, (newHash) => {
      session.revokedAt = new Date();
      session.replacedBy = newHash;
      return session.save();
    });

    return { user: sanitize(user), tokens };
  }

  /** Revoke the current session (logout on this device). Idempotent. */
  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    const tokenHash = hashToken(rawToken);
    await SessionModel.updateOne(
      { tokenHash, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
  }

  /**
   * Log out everywhere: bump the user's tokenVersion (invalidates all access
   * tokens carrying the old version) and revoke every active session.
   */
  async logoutAll(userId: string): Promise<void> {
    await UserModel.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
    await this.revokeAllSessions(userId);
  }

  /** Change password: verify current, store new hash, and invalidate all sessions. */
  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await UserModel.findById(userId).select("+passwordHash");
    if (!user) throw new UnauthorizedError("Not authenticated");

    const ok = await verifyPassword(user.passwordHash, input.currentPassword);
    if (!ok) throw new BadRequestError("Current password is incorrect");

    user.passwordHash = await hashPassword(input.newPassword);
    user.tokenVersion += 1; // invalidate existing access tokens
    await user.save();
    await this.revokeAllSessions(userId);
    logger.info("Password changed", { userId });
  }

  /**
   * Begin a password reset. Always returns without revealing whether the email
   * exists (prevents account enumeration). The raw token is emailed out-of-band;
   * here we log it. Only the hash is persisted.
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) return; // silent no-op — do not leak existence

    const rawToken = generateOpaqueToken();
    await PasswordResetTokenModel.create({
      userId: user._id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + config.RESET_TOKEN_TTL_SECONDS * 1000),
    });

    // In production: send an email containing a link with `rawToken`.
    logger.info("Password reset requested", { userId: String(user._id), rawToken });
  }

  /** Complete a password reset with a single-use token. */
  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const record = await PasswordResetTokenModel.findOne({ tokenHash: hashToken(rawToken) });
    if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestError("Invalid or expired reset token");
    }

    const user = await UserModel.findById(record.userId).select("+passwordHash");
    if (!user) throw new BadRequestError("Invalid or expired reset token");

    user.passwordHash = await hashPassword(newPassword);
    user.tokenVersion += 1;
    await user.save();

    record.usedAt = new Date();
    await record.save();

    await this.revokeAllSessions(String(user._id));
    logger.info("Password reset completed", { userId: String(user._id) });
  }

  /** Return the current user's profile. */
  async getMe(userId: string): Promise<SanitizedUser> {
    const user = await UserModel.findById(userId);
    if (!user) throw new UnauthorizedError("Not authenticated");
    return sanitize(user);
  }

  // ── internals ────────────────────────────────────────────────────────────

  /**
   * Create a session (persisting only the refresh-token hash) and return the
   * access + refresh token pair. `onIssued` lets the caller atomically revoke the
   * predecessor during rotation once the successor's hash is known.
   */
  private async issueSession(
    user: UserDoc,
    family: string,
    ctx: RequestContext,
    onIssued?: (newTokenHash: string) => Promise<unknown>,
  ): Promise<TokenPair> {
    const refreshToken = generateOpaqueToken();
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + config.REFRESH_TOKEN_TTL_SECONDS * 1000);

    await SessionModel.create({
      userId: user._id,
      tokenHash,
      family,
      userAgent: ctx.userAgent,
      ipAddress: ctx.ipAddress,
      expiresAt,
    });

    if (onIssued) await onIssued(tokenHash);

    const accessToken = signAccessToken({
      sub: String(user._id),
      role: user.role as Role,
      tokenVersion: user.tokenVersion,
    });

    return { accessToken, refreshToken, expiresIn: config.ACCESS_TOKEN_TTL_SECONDS };
  }

  private async revokeAllSessions(userId: string): Promise<void> {
    await SessionModel.updateMany(
      { userId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
  }
}

/** Map a user document to the client-safe shape. */
function sanitize(user: UserDoc): SanitizedUser {
  return {
    id: String(user._id),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as Role,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
  };
}

function isDuplicateKey(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}

/**
 * A fixed dummy Argon2id hash used to keep login timing uniform when the email
 * is unknown (mitigates user-enumeration via response timing). Generated once.
 */
const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$3s2v3xkQdVh0m2s3f0k9Zt7m8oXn8m2q3r4s5t6u7v8";

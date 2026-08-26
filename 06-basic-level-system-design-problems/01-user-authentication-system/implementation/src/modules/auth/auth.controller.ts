import type { Request, Response } from "express";
import {
  config,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
} from "../../config/index.js";
import type { AuthedRequest, TokenPair } from "../../types/index.js";
import { UnauthorizedError } from "../../errors/httpErrors.js";
import { AuthService } from "./auth.service.js";
import type { RequestContext } from "./auth.types.js";
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "./auth.validation.js";

const service = new AuthService();

function ctxOf(req: Request): RequestContext {
  return { userAgent: req.header("user-agent"), ipAddress: req.ip };
}

/**
 * Set the refresh token in a Secure, HttpOnly, SameSite cookie scoped to the
 * auth path. JavaScript cannot read it (mitigating XSS token theft), and the
 * browser only sends it to the refresh/logout endpoints.
 */
function setRefreshCookie(res: Response, tokens: TokenPair): void {
  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
    httpOnly: true,
    secure: config.COOKIE_SECURE,
    sameSite: "strict",
    path: REFRESH_COOKIE_PATH,
    maxAge: config.REFRESH_TOKEN_TTL_SECONDS * 1000,
    ...(config.COOKIE_DOMAIN ? { domain: config.COOKIE_DOMAIN } : {}),
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}

/** The access token is returned in the body; the refresh token lives in the cookie. */
function authBody(result: { user: unknown; tokens: TokenPair }) {
  return {
    user: result.user,
    accessToken: result.tokens.accessToken,
    expiresIn: result.tokens.expiresIn,
  };
}

export async function register(req: Request, res: Response): Promise<void> {
  const result = await service.register(req.body as RegisterInput, ctxOf(req));
  setRefreshCookie(res, result.tokens);
  res.status(201).json(authBody(result));
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await service.login(req.body as LoginInput, ctxOf(req));
  setRefreshCookie(res, result.tokens);
  res.status(200).json(authBody(result));
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const raw = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  if (!raw) throw new UnauthorizedError("Missing refresh token");
  const result = await service.refresh(raw, ctxOf(req));
  setRefreshCookie(res, result.tokens);
  res.status(200).json(authBody(result));
}

export async function logout(req: Request, res: Response): Promise<void> {
  const raw = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  await service.logout(raw);
  clearRefreshCookie(res);
  res.status(204).send();
}

export async function logoutAll(req: AuthedRequest, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  await service.logoutAll(req.user.id);
  clearRefreshCookie(res);
  res.status(204).send();
}

export async function me(req: AuthedRequest, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const user = await service.getMe(req.user.id);
  res.status(200).json({ user });
}

export async function changePassword(req: AuthedRequest, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  await service.changePassword(req.user.id, req.body as ChangePasswordInput);
  clearRefreshCookie(res);
  res.status(204).send();
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  await service.requestPasswordReset((req.body as ForgotPasswordInput).email);
  // Always 200 — never reveal whether the email exists.
  res.status(200).json({ message: "If that email exists, a reset link has been sent" });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, newPassword } = req.body as ResetPasswordInput;
  await service.resetPassword(token, newPassword);
  clearRefreshCookie(res);
  res.status(200).json({ message: "Password has been reset" });
}

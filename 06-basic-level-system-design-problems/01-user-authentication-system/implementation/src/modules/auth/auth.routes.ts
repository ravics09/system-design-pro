import { Router } from "express";
import { config } from "../../config/index.js";
import { authenticate } from "../../middleware/authenticate.js";
import { rateLimit } from "../../middleware/rateLimiter.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import type { AuthedRequest } from "../../types/index.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth.validation.js";
import * as ctrl from "./auth.controller.js";

export const authRouter = Router();

const loginLimiter = rateLimit(
  "login",
  config.LOGIN_RATE_LIMIT,
  config.LOGIN_RATE_WINDOW_SECONDS,
  "ip-email",
);
const registerLimiter = rateLimit("register", 5, 60, "ip");
const forgotLimiter = rateLimit("forgot", 5, 300, "ip-email");
const refreshLimiter = rateLimit("refresh", 60, 60, "ip");

authRouter.post("/register", registerLimiter, validateBody(registerSchema), asyncHandler(ctrl.register));
authRouter.post("/login", loginLimiter, validateBody(loginSchema), asyncHandler(ctrl.login));
authRouter.post("/refresh", refreshLimiter, asyncHandler(ctrl.refresh));
authRouter.post("/logout", asyncHandler(ctrl.logout));

authRouter.post("/logout-all", authenticate, asyncHandler<AuthedRequest>(ctrl.logoutAll));
authRouter.get("/me", authenticate, asyncHandler<AuthedRequest>(ctrl.me));
authRouter.post(
  "/change-password",
  authenticate,
  validateBody(changePasswordSchema),
  asyncHandler<AuthedRequest>(ctrl.changePassword),
);

authRouter.post(
  "/forgot-password",
  forgotLimiter,
  validateBody(forgotPasswordSchema),
  asyncHandler(ctrl.forgotPassword),
);
authRouter.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  asyncHandler(ctrl.resetPassword),
);

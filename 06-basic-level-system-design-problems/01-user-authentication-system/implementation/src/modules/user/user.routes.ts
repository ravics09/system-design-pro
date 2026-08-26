import { Router, type Response } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import type { AuthedRequest } from "../../types/index.js";

/**
 * Sample protected business routes demonstrating the authenticate/authorize
 * split. These are not part of auth itself — they show how other endpoints
 * consume the authenticated identity.
 */
export const userRouter = Router();

// Any authenticated user.
userRouter.get(
  "/profile",
  authenticate,
  asyncHandler<AuthedRequest>(async (req: AuthedRequest, res: Response) => {
    res.json({ message: "Your profile", user: req.user });
  }),
);

// Admins only — 401 if unauthenticated, 403 if authenticated without ADMIN.
userRouter.get(
  "/admin/report",
  authenticate,
  authorize("ADMIN"),
  asyncHandler<AuthedRequest>(async (_req: AuthedRequest, res: Response) => {
    res.json({ message: "Secret admin report" });
  }),
);

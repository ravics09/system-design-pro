import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { rateLimit } from "../../middleware/rateLimiter.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { createUploadSchema } from "./upload.validation.js";
import { createUpload, completeUpload } from "./upload.controller.js";
import type { AuthedRequest } from "../../types/index.js";

export const uploadRouter = Router();

// Issuing URLs is the abuse-prone endpoint → rate limit it (10/min/user).
uploadRouter.post(
  "/",
  authenticate,
  rateLimit("upload-create", 10, 60),
  validateBody(createUploadSchema),
  asyncHandler<AuthedRequest>(createUpload),
);

uploadRouter.post(
  "/:imageId/complete",
  authenticate,
  rateLimit("upload-complete", 30, 60),
  asyncHandler<AuthedRequest>(completeUpload),
);

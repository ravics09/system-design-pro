import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { getImage, deleteImage } from "./image.controller.js";
import type { AuthedRequest } from "../../types/index.js";

export const imageRouter = Router();

// Reading metadata is public here; gate it behind `authenticate` if images are private.
imageRouter.get("/:imageId", asyncHandler<AuthedRequest>(getImage));

imageRouter.delete("/:imageId", authenticate, asyncHandler<AuthedRequest>(deleteImage));

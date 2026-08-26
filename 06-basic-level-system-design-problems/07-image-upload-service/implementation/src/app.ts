import express, { type Express } from "express";
import { uploadRouter } from "./modules/upload/upload.routes.js";
import { imageRouter } from "./modules/image/image.routes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

/** Build and configure the Express application (no listening here). */
export function createApp(): Express {
  const app = express();

  // Bodies are small JSON control messages — the image bytes never touch us.
  app.use(express.json({ limit: "16kb" }));

  // Trust the proxy so req.ip reflects the real client for rate limiting.
  app.set("trust proxy", true);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", ts: new Date().toISOString() });
  });

  app.use("/api/v1/uploads", uploadRouter);
  app.use("/api/v1/images", imageRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

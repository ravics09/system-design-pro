import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import { authRouter } from "./modules/auth/auth.routes.js";
import { userRouter } from "./modules/user/user.routes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

/** Build and configure the Express application (no listening here). */
export function createApp(): Express {
  const app = express();

  app.use(express.json({ limit: "16kb" }));
  app.use(cookieParser());

  // Trust the proxy so req.ip reflects the real client for rate limiting and
  // so Secure cookies work behind a TLS-terminating load balancer.
  app.set("trust proxy", true);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", ts: new Date().toISOString() });
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", userRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

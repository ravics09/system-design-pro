import express, { type Express } from "express";
import { todoRouter } from "./modules/todo/todo.routes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

/** Build and configure the Express application (no listening here). */
export function createApp(): Express {
  const app = express();

  app.use(express.json({ limit: "64kb" }));
  app.set("trust proxy", true);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", ts: new Date().toISOString() });
  });

  app.use("/api/v1/todos", todoRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

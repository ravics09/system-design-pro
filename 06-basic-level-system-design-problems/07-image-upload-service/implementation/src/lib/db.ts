import mongoose from "mongoose";
import { config } from "../config/index.js";
import { logger } from "./logger.js";

let connected = false;

/** Connect to MongoDB once; safe to call from both the API and the worker. */
export async function connectDb(): Promise<void> {
  if (connected) return;
  mongoose.set("strictQuery", true);
  await mongoose.connect(config.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  connected = true;
  logger.info("Connected to MongoDB", { uri: redact(config.MONGODB_URI) });
}

export async function disconnectDb(): Promise<void> {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}

function redact(uri: string): string {
  // Hide credentials if present in the connection string.
  return uri.replace(/\/\/[^@]*@/, "//***:***@");
}

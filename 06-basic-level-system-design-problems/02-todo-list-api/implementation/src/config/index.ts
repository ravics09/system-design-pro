import "dotenv/config";
import { z } from "zod";

/**
 * Centralised, validated configuration. All environment access happens here so
 * the rest of the codebase depends on a strongly-typed `config` object.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),

  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/todo-list-api"),

  // List pagination bounds.
  DEFAULT_PAGE_SIZE: z.coerce.number().int().positive().default(20),
  MAX_PAGE_SIZE: z.coerce.number().int().positive().default(100),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;

export const STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];

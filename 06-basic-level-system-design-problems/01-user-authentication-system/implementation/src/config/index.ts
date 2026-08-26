import "dotenv/config";
import { z } from "zod";

/**
 * Centralised, validated configuration. All environment access happens here so
 * the rest of the codebase depends on a strongly-typed `config` object.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),

  // Persistence
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/user-auth"),

  // Rate limiting / caching store
  RATE_LIMIT_DRIVER: z.enum(["redis", "memory"]).default("memory"),
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),

  // JWT (access token). Refresh tokens are opaque + stored hashed, NOT JWTs.
  JWT_ACCESS_SECRET: z.string().min(16).default("dev-access-secret-change-me-please"),
  JWT_ISSUER: z.string().default("user-auth-service"),
  JWT_AUDIENCE: z.string().default("user-auth-clients"),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900), // 15 min
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 30), // 30 days

  // Password reset
  RESET_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 30), // 30 min

  // Cookie behaviour for the refresh token
  COOKIE_SECURE: z.coerce.boolean().default(false), // true behind HTTPS in prod
  COOKIE_DOMAIN: z.string().optional(),

  // Auth endpoint rate limits (requests per window)
  LOGIN_RATE_LIMIT: z.coerce.number().int().positive().default(10),
  LOGIN_RATE_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;

/** Path the refresh cookie is scoped to — the browser only sends it to /refresh. */
export const REFRESH_COOKIE_NAME = "refresh_token";
export const REFRESH_COOKIE_PATH = "/api/v1/auth";

/** Roles supported by the RBAC layer. */
export const ROLES = ["USER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

import "dotenv/config";
import { z } from "zod";

/**
 * Centralised, validated configuration.
 *
 * All environment access happens here so the rest of the codebase can depend on
 * a strongly-typed `config` object instead of reading `process.env` directly.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),

  // Persistence
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/image-upload-service"),

  // Object storage (S3)
  AWS_REGION: z.string().default("us-east-1"),
  UPLOAD_BUCKET: z.string().default("image-upload-service-dev"),
  DERIVED_BUCKET: z.string().default("image-upload-service-dev"),
  S3_ENDPOINT: z.string().optional(), // set for LocalStack / MinIO
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(false),

  // Async processing queue
  QUEUE_DRIVER: z.enum(["sqs", "memory"]).default("memory"),
  SQS_QUEUE_URL: z.string().optional(),

  // Rate limiting
  RATE_LIMIT_DRIVER: z.enum(["redis", "memory"]).default("memory"),
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),

  // CDN delivery
  CDN_DOMAIN: z.string().optional(), // e.g. https://cdn.example.com
  CDN_SIGNING_KEY_ID: z.string().optional(),
  CDN_PRIVATE_KEY: z.string().optional(),

  // Upload policy
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024), // 10 MB
  PRESIGN_EXPIRES_SECONDS: z.coerce.number().int().positive().default(300), // 5 min
  SIGNED_VIEW_EXPIRES_SECONDS: z.coerce.number().int().positive().default(3600),

  // How long a PENDING record may live before the reaper deletes it (seconds).
  PENDING_TTL_SECONDS: z.coerce.number().int().positive().default(900),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast on misconfiguration rather than crashing deep in a request.
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;

/** Content types we accept for upload. Enforced before signing AND after upload. */
export const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

/** File extension used for the stored object, keyed by content type. */
export const EXTENSION_BY_TYPE: Record<AllowedContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

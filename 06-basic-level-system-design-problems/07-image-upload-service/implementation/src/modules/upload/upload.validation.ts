import { z } from "zod";
import { ALLOWED_CONTENT_TYPES, config } from "../../config/index.js";

/** Body for requesting a pre-signed upload URL. */
export const createUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.enum(ALLOWED_CONTENT_TYPES),
  size: z
    .number()
    .int()
    .positive()
    .max(config.MAX_UPLOAD_BYTES, `File exceeds max size of ${config.MAX_UPLOAD_BYTES} bytes`),
});

export type CreateUploadInput = z.infer<typeof createUploadSchema>;

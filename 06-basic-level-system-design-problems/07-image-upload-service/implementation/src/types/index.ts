import type { Request } from "express";
import type { AllowedContentType } from "../config/index.js";

/** An authenticated principal resolved by the auth middleware. */
export interface AuthUser {
  id: string;
}

/** Express request that has passed through the auth middleware. */
export interface AuthedRequest extends Request {
  user?: AuthUser;
}

/** Lifecycle states for an image record. */
export type ImageStatus = "PENDING" | "UPLOADED" | "PROCESSING" | "READY" | "FAILED";

/** A derived rendition produced by the async processor. */
export interface Variant {
  label: string; // e.g. "thumb" | "medium" | "webp"
  s3Key: string;
  width: number;
  height: number;
  contentType: AllowedContentType;
  size: number;
}

/**
 * Message payload placed on the processing queue.
 *
 * We keep it small (just an id + key); the worker re-reads authoritative state
 * from the database so the queue never becomes a source of truth.
 */
export interface ProcessImageJob {
  imageId: string;
  s3Key: string;
}

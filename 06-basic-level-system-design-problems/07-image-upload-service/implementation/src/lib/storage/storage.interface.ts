/** Metadata returned by a HEAD request against a stored object. */
export interface ObjectHead {
  size: number;
  contentType: string | undefined;
}

/**
 * Storage abstraction. The rest of the app depends only on this interface, so the
 * S3 implementation could be swapped for GCS/Azure/MinIO without touching callers.
 */
export interface StorageProvider {
  /**
   * Create a short-lived, scoped pre-signed URL that lets a client PUT bytes
   * directly to storage without seeing our credentials.
   */
  presignPut(params: {
    key: string;
    contentType: string;
    expiresInSeconds: number;
  }): Promise<string>;

  /** Verify an object exists and read its authoritative size/content-type. */
  head(key: string): Promise<ObjectHead | null>;

  /** Download an object's bytes (used by the async processor). */
  getBytes(key: string): Promise<Buffer>;

  /** Upload derived bytes (thumbnails, transcodes) produced by the processor. */
  putBytes(params: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<void>;

  /** Best-effort delete; used for cleanup / reaping orphans. */
  delete(key: string): Promise<void>;
}

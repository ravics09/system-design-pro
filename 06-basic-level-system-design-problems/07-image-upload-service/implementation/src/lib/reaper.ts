import { config } from "../config/index.js";
import { ImageModel } from "../models/image.model.js";
import { getStorage } from "../lib/storage/index.js";
import { logger } from "./logger.js";

/**
 * Reap orphaned uploads: records still PENDING after the pre-signed URL has long
 * expired almost certainly never completed. We delete the record (and any stray
 * bytes) to keep metadata and storage consistent.
 *
 * Run this on a schedule (cron / setInterval).
 */
export async function reapStalePending(): Promise<number> {
  const cutoff = new Date(Date.now() - config.PENDING_TTL_SECONDS * 1000);
  const stale = await ImageModel.find({ status: "PENDING", createdAt: { $lt: cutoff } }).limit(500);

  const storage = getStorage();
  let reaped = 0;
  for (const image of stale) {
    // The object usually doesn't exist (upload never happened) — delete is best-effort.
    await storage.delete(image.s3Key).catch(() => undefined);
    await ImageModel.deleteOne({ imageId: image.imageId });
    reaped += 1;
  }

  if (reaped > 0) logger.info("Reaped stale PENDING uploads", { reaped });
  return reaped;
}

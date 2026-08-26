import { createHash } from "node:crypto";
import sharp from "sharp";
import { connectDb } from "../lib/db.js";
import { getStorage } from "../lib/storage/index.js";
import { getQueue } from "../lib/queue/index.js";
import { logger } from "../lib/logger.js";
import { ImageModel } from "../models/image.model.js";
import type { ProcessImageJob, Variant } from "../types/index.js";
import type { AllowedContentType } from "../config/index.js";

/** Derived renditions we generate for every uploaded image. */
interface VariantSpec {
  label: string;
  width: number;
  format: "jpeg" | "webp";
  contentType: AllowedContentType;
}

const VARIANT_SPECS: VariantSpec[] = [
  { label: "thumb", width: 150, format: "jpeg", contentType: "image/jpeg" },
  { label: "medium", width: 800, format: "jpeg", contentType: "image/jpeg" },
  { label: "webp", width: 800, format: "webp", contentType: "image/webp" },
];

const storage = getStorage();
const queue = getQueue();

/**
 * Process a single job. Idempotent by design:
 *  - Re-processing overwrites the same derived object keys.
 *  - A job for an already-READY image is skipped.
 * This tolerates at-least-once delivery (SQS) and duplicate S3 events.
 */
export async function processJob(job: ProcessImageJob): Promise<void> {
  const image = await ImageModel.findOne({ imageId: job.imageId });
  if (!image) {
    logger.warn("Job for unknown image; dropping", { imageId: job.imageId });
    return;
  }
  if (image.status === "READY") {
    logger.info("Image already processed; skipping", { imageId: job.imageId });
    return;
  }

  image.status = "PROCESSING";
  await image.save();

  try {
    const original = await storage.getBytes(image.s3Key);

    // Validate the ACTUAL bytes, not the client-declared type. sharp reads the
    // real header; if it can't, the file isn't a supported image.
    const meta = await sharp(original).metadata();
    if (!meta.width || !meta.height || !meta.format) {
      throw new Error("Unrecognised or corrupt image");
    }

    const checksum = createHash("sha256").update(original).digest("hex");

    const variants: Variant[] = [];
    for (const spec of VARIANT_SPECS) {
      const derivedKey = deriveKey(image.s3Key, spec.label, spec.format);
      const pipeline = sharp(original)
        .rotate() // auto-orient using EXIF, then...
        .resize({ width: spec.width, withoutEnlargement: true });

      const buffer =
        spec.format === "webp"
          ? await pipeline.webp({ quality: 82 }).toBuffer()
          : await pipeline.jpeg({ quality: 85, mozjpeg: true }).toBuffer();

      // Re-read dimensions of the derived image (aspect ratio preserved).
      const derivedMeta = await sharp(buffer).metadata();

      await storage.putBytes({
        key: derivedKey,
        body: buffer,
        contentType: spec.contentType,
      });

      variants.push({
        label: spec.label,
        s3Key: derivedKey,
        width: derivedMeta.width ?? spec.width,
        height: derivedMeta.height ?? 0,
        contentType: spec.contentType,
        size: buffer.byteLength,
      });
    }

    image.width = meta.width;
    image.height = meta.height;
    image.checksum = checksum;
    // `set` accepts a plain array for the Mongoose DocumentArray field.
    image.set("variants", variants);
    image.status = "READY";
    image.failureReason = undefined;
    await image.save();

    logger.info("Image processed", { imageId: image.imageId, variants: variants.length });
  } catch (err) {
    image.status = "FAILED";
    image.failureReason = err instanceof Error ? err.message : "processing failed";
    await image.save();
    logger.error("Image processing failed", { imageId: image.imageId, err: image.failureReason });
    // Rethrow so the queue can retry / eventually route to a DLQ.
    throw err;
  }
}

/** Build a derived object key alongside the original, e.g. .../img_x_thumb.jpg */
function deriveKey(originalKey: string, label: string, format: string): string {
  const withoutExt = originalKey.replace(/\.[^./]+$/, "");
  return `derived/${withoutExt}_${label}.${format}`;
}

/** Long-running consumer loop. Run as a separate process in production. */
export async function runWorker(): Promise<void> {
  await connectDb();
  logger.info("Image processor worker started");

  let running = true;
  const stop = () => {
    running = false;
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  while (running) {
    const jobs = await queue.receive(10);
    if (jobs.length === 0) {
      await sleep(1000);
      continue;
    }
    for (const { job, ack } of jobs) {
      try {
        await processJob(job);
        await ack(); // only delete the message after successful processing
      } catch {
        // Leave the message for redelivery; SQS visibility timeout handles retry.
      }
    }
  }

  logger.info("Image processor worker stopped");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Allow running directly: `node dist/workers/imageProcessor.js`
if (import.meta.url === `file://${process.argv[1]}`) {
  runWorker().catch((err) => {
    logger.error("Worker crashed", { err: err instanceof Error ? err.message : String(err) });
    process.exit(1);
  });
}

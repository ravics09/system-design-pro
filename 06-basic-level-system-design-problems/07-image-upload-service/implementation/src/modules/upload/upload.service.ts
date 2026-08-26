import { randomUUID } from "node:crypto";
import { config, EXTENSION_BY_TYPE, type AllowedContentType } from "../../config/index.js";
import { ImageModel } from "../../models/image.model.js";
import { getStorage } from "../../lib/storage/index.js";
import { getQueue } from "../../lib/queue/index.js";
import { logger } from "../../lib/logger.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../errors/httpErrors.js";
import type { CreateUploadInput } from "./upload.validation.js";

/**
 * The upload service orchestrates the three-step direct-to-S3 flow:
 *   1. createUploadUrl  → PENDING record + pre-signed PUT URL
 *   2. (client PUTs bytes straight to S3)
 *   3. completeUpload   → verify object exists, mark UPLOADED, enqueue processing
 *
 * Bytes never pass through this process.
 */
export class UploadService {
  private readonly storage = getStorage();
  private readonly queue = getQueue();

  /** Step 1: authorize an upload by issuing a scoped, expiring pre-signed URL. */
  async createUploadUrl(userId: string, input: CreateUploadInput) {
    const imageId = `img_${randomUUID()}`;
    const ext = EXTENSION_BY_TYPE[input.contentType as AllowedContentType];
    // Namespace the key by user for clear ownership and efficient listing.
    const key = `uploads/${userId}/${imageId}.${ext}`;

    // Record intent BEFORE handing out the URL, so we can later reconcile/reap.
    await ImageModel.create({
      imageId,
      s3Key: key,
      userId,
      contentType: input.contentType,
      size: input.size,
      status: "PENDING",
    });

    const uploadUrl = await this.storage.presignPut({
      key,
      contentType: input.contentType,
      expiresInSeconds: config.PRESIGN_EXPIRES_SECONDS,
    });

    logger.info("Issued pre-signed upload URL", { imageId, userId });

    return {
      imageId,
      key,
      uploadUrl,
      expiresIn: config.PRESIGN_EXPIRES_SECONDS,
      // The exact headers the client must send on the PUT for the signature to match.
      requiredHeaders: { "Content-Type": input.contentType },
    };
  }

  /**
   * Step 3: confirm the direct upload finished.
   *
   * We verify the object truly exists in S3 (HEAD) and that its real size matches
   * what we recorded — never trusting the client's word — then flip PENDING →
   * UPLOADED and enqueue async processing. Idempotent: re-confirming a record that
   * is already past PENDING simply returns its current state.
   */
  async completeUpload(userId: string, imageId: string) {
    const image = await ImageModel.findOne({ imageId });
    if (!image) throw new NotFoundError("Image not found");
    if (image.userId !== userId) throw new ForbiddenError("Not your image");

    // Idempotency: a retried /complete after success is a no-op.
    if (image.status !== "PENDING") {
      return this.toSummary(image);
    }

    const head = await this.storage.head(image.s3Key);
    if (!head) {
      throw new BadRequestError("Upload not found in storage; did the PUT succeed?");
    }
    if (head.size > config.MAX_UPLOAD_BYTES) {
      // Defensive: with a plain PUT URL the client controls size, so re-check.
      await this.storage.delete(image.s3Key).catch(() => undefined);
      image.status = "FAILED";
      image.failureReason = "Object exceeds max allowed size";
      await image.save();
      throw new BadRequestError("Uploaded object exceeds max allowed size");
    }

    // Trust the storage's reported size over the client-declared value.
    image.size = head.size;
    image.status = "UPLOADED";
    await image.save();

    // Enqueue processing. If this throws, the record stays UPLOADED and a
    // reconciler / S3 event can re-drive processing later.
    await this.queue.publish({ imageId: image.imageId, s3Key: image.s3Key });

    logger.info("Upload completed and queued for processing", { imageId });
    return this.toSummary(image);
  }

  /**
   * Alternative entry point: driven by an S3 "object created" event instead of the
   * client confirm call. This is the more reliable signal (fires even if the client
   * disconnects). Included to show the reconcile path.
   */
  async markUploadedFromEvent(s3Key: string) {
    const image = await ImageModel.findOne({ s3Key });
    if (!image) {
      logger.warn("S3 event for unknown key; possible orphan object", { s3Key });
      throw new NotFoundError("No metadata for uploaded object");
    }
    if (image.status === "PENDING") {
      image.status = "UPLOADED";
      await image.save();
      await this.queue.publish({ imageId: image.imageId, s3Key: image.s3Key });
    }
    return this.toSummary(image);
  }

  private toSummary(image: {
    imageId: string;
    status: string;
    contentType: string;
    size: number;
  }) {
    return {
      imageId: image.imageId,
      status: image.status,
      contentType: image.contentType,
      size: image.size,
    };
  }
}

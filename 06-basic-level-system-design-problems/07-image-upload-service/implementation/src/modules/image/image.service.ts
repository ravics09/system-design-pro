import { ImageModel } from "../../models/image.model.js";
import { getStorage } from "../../lib/storage/index.js";
import { buildDeliveryUrl } from "../../lib/cdn.js";
import { ForbiddenError, NotFoundError } from "../../errors/httpErrors.js";

/** Read-side service: fetch metadata + delivery URLs, and delete images. */
export class ImageService {
  private readonly storage = getStorage();

  /**
   * Return image metadata plus CDN delivery URLs for the original and each
   * derived variant. `signed` controls whether we mint short-lived signed URLs
   * (private content) or plain CDN URLs (public content).
   */
  async getImage(imageId: string, opts?: { signed?: boolean }) {
    const image = await ImageModel.findOne({ imageId });
    if (!image) throw new NotFoundError("Image not found");

    const signed = opts?.signed ?? false;
    const variants = image.variants.map((v) => ({
      label: v.label,
      width: v.width,
      height: v.height,
      contentType: v.contentType,
      url: buildDeliveryUrl(v.s3Key, { signed }),
    }));

    return {
      imageId: image.imageId,
      status: image.status,
      contentType: image.contentType,
      size: image.size,
      width: image.width ?? null,
      height: image.height ?? null,
      // Only expose the original URL once the object actually exists.
      url: image.status === "PENDING" ? null : buildDeliveryUrl(image.s3Key, { signed }),
      variants,
      createdAt: image.get("createdAt") as Date,
    };
  }

  /**
   * Soft-delete for auditability. We mark the record and best-effort remove the
   * bytes; a background job can hard-delete later. Only the owner may delete.
   */
  async deleteImage(userId: string, imageId: string): Promise<void> {
    const image = await ImageModel.findOne({ imageId });
    if (!image) throw new NotFoundError("Image not found");
    if (image.userId !== userId) throw new ForbiddenError("Not your image");

    await this.storage.delete(image.s3Key).catch(() => undefined);
    for (const v of image.variants) {
      await this.storage.delete(v.s3Key).catch(() => undefined);
    }
    await ImageModel.deleteOne({ imageId });
  }
}

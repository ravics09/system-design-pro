import type { Response } from "express";
import type { AuthedRequest } from "../../types/index.js";
import { UnauthorizedError } from "../../errors/httpErrors.js";
import { ImageService } from "./image.service.js";

const service = new ImageService();

/** GET /api/v1/images/:imageId — metadata + delivery URLs. */
export async function getImage(req: AuthedRequest, res: Response): Promise<void> {
  const { imageId } = req.params as { imageId: string };
  // `?signed=true` requests short-lived signed URLs for private content.
  const signed = req.query.signed === "true";
  const result = await service.getImage(imageId, { signed });
  res.status(200).json(result);
}

/** DELETE /api/v1/images/:imageId — owner-only delete. */
export async function deleteImage(req: AuthedRequest, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const { imageId } = req.params as { imageId: string };
  await service.deleteImage(req.user.id, imageId);
  res.status(204).send();
}

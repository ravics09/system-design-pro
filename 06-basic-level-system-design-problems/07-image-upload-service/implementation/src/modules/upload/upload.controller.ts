import type { Response } from "express";
import type { AuthedRequest } from "../../types/index.js";
import { UnauthorizedError } from "../../errors/httpErrors.js";
import { UploadService } from "./upload.service.js";
import type { CreateUploadInput } from "./upload.validation.js";

const service = new UploadService();

/** POST /api/v1/uploads — issue a pre-signed upload URL. */
export async function createUpload(req: AuthedRequest, res: Response): Promise<void> {
  const user = requireUser(req);
  const result = await service.createUploadUrl(user.id, req.body as CreateUploadInput);
  res.status(201).json(result);
}

/** POST /api/v1/uploads/:imageId/complete — confirm the direct upload. */
export async function completeUpload(req: AuthedRequest, res: Response): Promise<void> {
  const user = requireUser(req);
  const { imageId } = req.params as { imageId: string };
  const result = await service.completeUpload(user.id, imageId);
  res.status(200).json(result);
}

function requireUser(req: AuthedRequest) {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}

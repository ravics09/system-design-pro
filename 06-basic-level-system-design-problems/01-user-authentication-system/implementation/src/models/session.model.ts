import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

/**
 * A Session represents one refresh-token lifetime for one device.
 *
 * We store only the SHA-256 HASH of the refresh token (`tokenHash`), never the
 * token itself — a DB leak must not hand out usable tokens. `family` ties
 * together the chain of rotated tokens so we can detect reuse: if a token that
 * has already been rotated (revoked) is presented again, that signals theft and
 * we revoke the whole family.
 */
const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    family: { type: String, required: true, index: true }, // rotation lineage
    userAgent: { type: String },
    ipAddress: { type: String },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedBy: { type: String, default: null }, // tokenHash of the successor
  },
  { timestamps: true },
);

// TTL index: MongoDB removes the document shortly after it expires.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type SessionAttrs = InferSchemaType<typeof sessionSchema>;
export type SessionDoc = HydratedDocument<SessionAttrs>;

export const SessionModel = model("Session", sessionSchema);

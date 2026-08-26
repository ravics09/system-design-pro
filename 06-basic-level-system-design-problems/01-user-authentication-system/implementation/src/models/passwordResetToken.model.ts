import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

/**
 * A single-use password reset token. As with refresh tokens, we store only the
 * HASH; the raw token is emailed to the user out-of-band and never persisted.
 */
const passwordResetTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// TTL index cleans up expired reset tokens automatically.
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PasswordResetTokenAttrs = InferSchemaType<typeof passwordResetTokenSchema>;
export type PasswordResetTokenDoc = HydratedDocument<PasswordResetTokenAttrs>;

export const PasswordResetTokenModel = model("PasswordResetToken", passwordResetTokenSchema);

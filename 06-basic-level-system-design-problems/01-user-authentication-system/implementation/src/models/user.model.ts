import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { ROLES } from "../config/index.js";

/**
 * The User is the identity record. We store only a password HASH, never the
 * plaintext. `passwordHash` is `select: false` so it is never returned by
 * accident — login opts in explicitly with `.select("+passwordHash")`.
 *
 * `tokenVersion` is the lever for global invalidation: bumping it (on password
 * change, "log out everywhere", or a security incident) makes every previously
 * issued access token that embeds the old version invalid.
 */
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true, // enforced by a MongoDB unique index, not just app logic
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned by default queries
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: { type: String, enum: ROLES, default: "USER" },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type UserAttrs = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<UserAttrs>;

export const UserModel = model("User", userSchema);

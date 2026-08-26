import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

/**
 * Image metadata is the source of truth for *what exists* and its lifecycle.
 * The bytes themselves live in S3; this record ties an owner, a key, and a
 * processing status together.
 */
const variantSchema = new Schema(
  {
    label: { type: String, required: true }, // "thumb" | "medium" | "webp"
    s3Key: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false },
);

const imageSchema = new Schema(
  {
    imageId: { type: String, required: true, unique: true, index: true },
    s3Key: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    width: { type: Number },
    height: { type: Number },
    checksum: { type: String, index: true }, // content hash for dedup
    status: {
      type: String,
      enum: ["PENDING", "UPLOADED", "PROCESSING", "READY", "FAILED"],
      default: "PENDING",
      index: true,
    },
    failureReason: { type: String },
    variants: { type: [variantSchema], default: [] },
  },
  { timestamps: true },
);

// Support the reaper query: find stale PENDING records efficiently.
imageSchema.index({ status: 1, createdAt: 1 });

export type ImageDoc = HydratedDocument<InferSchemaType<typeof imageSchema>>;

export const ImageModel = model("Image", imageSchema);

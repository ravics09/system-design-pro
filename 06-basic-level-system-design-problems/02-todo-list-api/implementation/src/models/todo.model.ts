import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { STATUSES, PRIORITIES } from "../config/index.js";

/**
 * Sub-tasks are EMBEDDED in the parent todo: they are few, always loaded with
 * the parent, and updated together (one atomic document write). Each keeps its
 * own `_id` so the API can target a single sub-task. Switch to a referenced
 * collection only if sub-tasks become unbounded or need independent querying.
 */
const subTaskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    isDone: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true },
);

const todoSchema = new Schema(
  {
    userId: { type: String, required: true, index: true }, // owner — scopes every query
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    status: { type: String, enum: STATUSES, default: "TODO", index: true },
    priority: { type: String, enum: PRIORITIES, default: "MEDIUM" },
    dueDate: { type: Date, default: null },
    tags: { type: [String], default: [] },
    subTasks: { type: [subTaskSchema], default: [] },
    version: { type: Number, default: 0 }, // optimistic concurrency

    // soft delete
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Backs the default "my active todos, newest first" list AND the cursor
// (keyset) pagination on (createdAt, _id). ESR: equality → sort.
todoSchema.index({ userId: 1, isDeleted: 1, createdAt: -1, _id: -1 });

export type TodoAttrs = InferSchemaType<typeof todoSchema>;
export type TodoDoc = HydratedDocument<TodoAttrs>;

export const TodoModel = model("Todo", todoSchema);

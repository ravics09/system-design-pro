import { z } from "zod";
import { Types } from "mongoose";
import { STATUSES, PRIORITIES, config } from "../../config/index.js";

/** A MongoDB ObjectId string — guards against NoSQL-injection via bad ids. */
export const objectId = z
  .string()
  .refine((v) => Types.ObjectId.isValid(v), { message: "Invalid id" });

const title = z.string().trim().min(1).max(200);
const description = z.string().trim().max(2000);
const tags = z.array(z.string().trim().min(1).max(40)).max(20);

/** POST /todos — create. Client can never set userId / soft-delete flags. */
export const createTodoSchema = z.object({
  title,
  description: description.optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  dueDate: z.coerce.date().nullable().optional(),
  tags: tags.optional(),
});

/** PATCH /todos/:id — partial update (at least one field). */
export const patchTodoSchema = z
  .object({
    title,
    description,
    status: z.enum(STATUSES),
    priority: z.enum(PRIORITIES),
    dueDate: z.coerce.date().nullable(),
    tags,
  })
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, { message: "No fields to update" });

/** PUT /todos/:id — full replace (all replaceable fields required-ish). */
export const replaceTodoSchema = z.object({
  title,
  description: description.default(""),
  status: z.enum(STATUSES).default("TODO"),
  priority: z.enum(PRIORITIES).default("MEDIUM"),
  dueDate: z.coerce.date().nullable().default(null),
  tags: tags.default([]),
});

/** GET /todos — list query: filters + sort + cursor pagination. */
export const listTodosSchema = z.object({
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  tag: z.string().trim().min(1).max(40).optional(),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional(),
  sort: z.enum(["createdAt", "-createdAt", "dueDate", "-dueDate"]).default("-createdAt"),
  limit: z.coerce.number().int().positive().max(config.MAX_PAGE_SIZE).default(config.DEFAULT_PAGE_SIZE),
  cursor: z.string().optional(),
});

export const addSubTaskSchema = z.object({ title });
export const updateSubTaskSchema = z
  .object({ title, isDone: z.boolean() })
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, { message: "No fields to update" });

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type PatchTodoInput = z.infer<typeof patchTodoSchema>;
export type ReplaceTodoInput = z.infer<typeof replaceTodoSchema>;
export type ListTodosInput = z.infer<typeof listTodosSchema>;
export type AddSubTaskInput = z.infer<typeof addSubTaskSchema>;
export type UpdateSubTaskInput = z.infer<typeof updateSubTaskSchema>;

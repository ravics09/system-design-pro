import { Types, type FilterQuery, type SortOrder } from "mongoose";
import { TodoModel } from "../../models/todo.model.js";
import { NotFoundError, BadRequestError } from "../../errors/httpErrors.js";
import type { Paginated } from "../../types/index.js";
import type {
  AddSubTaskInput,
  CreateTodoInput,
  ListTodosInput,
  PatchTodoInput,
  ReplaceTodoInput,
  UpdateSubTaskInput,
} from "./todo.validation.js";

/** Shape returned to clients (ids as strings, no internal flags). */
interface SubTaskDTO {
  id: string;
  title: string;
  isDone: boolean;
}
interface TodoDTO {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  tags: string[];
  subTasks: SubTaskDTO[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/** A lean todo row as returned by Mongoose `.lean()`. */
interface LeanTodo {
  _id: Types.ObjectId;
  userId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  tags: string[];
  subTasks: Array<{ _id: Types.ObjectId; title: string; isDone: boolean }>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Cursor {
  v: string | null; // serialized sort-field value (ISO date or null)
  id: string; // tiebreaker _id
}

/**
 * All business logic for todos. Every method takes `userId` and scopes the query
 * by it, so ownership is enforced at the data layer — a non-owner simply gets a
 * 404 and can never read or mutate another user's data.
 */
export class TodoService {
  async create(userId: string, input: CreateTodoInput): Promise<TodoDTO> {
    // userId is set from the token here — never from the request body.
    const doc = await TodoModel.create({ ...input, userId });
    return toDTO(doc.toObject() as unknown as LeanTodo);
  }

  /** Cursor (keyset) paginated, filtered, sorted list of the user's active todos. */
  async list(userId: string, input: ListTodosInput): Promise<Paginated<TodoDTO>> {
    const sortField = input.sort.replace(/^-/, "") as "createdAt" | "dueDate";
    const dir: 1 | -1 = input.sort.startsWith("-") ? -1 : 1;

    const filter: FilterQuery<LeanTodo> = { userId, isDeleted: false };
    if (input.status) filter.status = input.status;
    if (input.priority) filter.priority = input.priority;
    if (input.tag) filter.tags = input.tag;
    if (input.dueBefore || input.dueAfter) {
      filter.dueDate = {};
      if (input.dueAfter) (filter.dueDate as Record<string, Date>).$gte = input.dueAfter;
      if (input.dueBefore) (filter.dueDate as Record<string, Date>).$lte = input.dueBefore;
    }

    // Keyset predicate from the cursor. createdAt (the default) is always present,
    // so the default sort is fully stable; dueDate sorting is best-effort when
    // values are null.
    if (input.cursor) {
      const c = decodeCursor(input.cursor);
      const op = dir === -1 ? "$lt" : "$gt";
      const boundary = sortField === "dueDate" && c.v === null ? null : c.v ? new Date(c.v) : null;
      filter.$or = [
        { [sortField]: { [op]: boundary } } as FilterQuery<LeanTodo>,
        { [sortField]: boundary, _id: { [op]: new Types.ObjectId(c.id) } } as FilterQuery<LeanTodo>,
      ];
    }

    const sort: Record<string, SortOrder> = { [sortField]: dir, _id: dir };
    const rows = (await TodoModel.find(filter)
      .sort(sort)
      .limit(input.limit + 1) // fetch one extra to detect hasMore
      .lean()
      .exec()) as unknown as LeanTodo[];

    const hasMore = rows.length > input.limit;
    const page = hasMore ? rows.slice(0, input.limit) : rows;
    const last = page[page.length - 1];
    const nextCursor = hasMore && last ? encodeCursor(last, sortField) : null;

    return {
      data: page.map(toDTO),
      pageInfo: { nextCursor, hasMore, limit: input.limit },
    };
  }

  async getById(userId: string, id: string): Promise<TodoDTO> {
    const doc = (await TodoModel.findOne({ _id: id, userId, isDeleted: false })
      .lean()
      .exec()) as unknown as LeanTodo | null;
    if (!doc) throw new NotFoundError("Todo not found");
    return toDTO(doc);
  }

  async patch(userId: string, id: string, input: PatchTodoInput): Promise<TodoDTO> {
    const doc = (await TodoModel.findOneAndUpdate(
      { _id: id, userId, isDeleted: false },
      { $set: input, $inc: { version: 1 } },
      { new: true, runValidators: true },
    )
      .lean()
      .exec()) as unknown as LeanTodo | null;
    if (!doc) throw new NotFoundError("Todo not found");
    return toDTO(doc);
  }

  async replace(userId: string, id: string, input: ReplaceTodoInput): Promise<TodoDTO> {
    const doc = (await TodoModel.findOneAndUpdate(
      { _id: id, userId, isDeleted: false },
      { $set: input, $inc: { version: 1 } },
      { new: true, runValidators: true },
    )
      .lean()
      .exec()) as unknown as LeanTodo | null;
    if (!doc) throw new NotFoundError("Todo not found");
    return toDTO(doc);
  }

  async softDelete(userId: string, id: string): Promise<void> {
    const res = await TodoModel.updateOne(
      { _id: id, userId, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() }, $inc: { version: 1 } },
    );
    if (res.matchedCount === 0) throw new NotFoundError("Todo not found");
  }

  async addSubTask(userId: string, id: string, input: AddSubTaskInput): Promise<TodoDTO> {
    const doc = (await TodoModel.findOneAndUpdate(
      { _id: id, userId, isDeleted: false },
      { $push: { subTasks: { title: input.title } }, $inc: { version: 1 } },
      { new: true, runValidators: true },
    )
      .lean()
      .exec()) as unknown as LeanTodo | null;
    if (!doc) throw new NotFoundError("Todo not found");
    return toDTO(doc);
  }

  async updateSubTask(
    userId: string,
    id: string,
    subId: string,
    input: UpdateSubTaskInput,
  ): Promise<TodoDTO> {
    const set: Record<string, unknown> = {};
    if (input.title !== undefined) set["subTasks.$[st].title"] = input.title;
    if (input.isDone !== undefined) set["subTasks.$[st].isDone"] = input.isDone;

    const doc = (await TodoModel.findOneAndUpdate(
      { _id: id, userId, isDeleted: false, "subTasks._id": new Types.ObjectId(subId) },
      { $set: set, $inc: { version: 1 } },
      {
        new: true,
        runValidators: true,
        arrayFilters: [{ "st._id": new Types.ObjectId(subId) }],
      },
    )
      .lean()
      .exec()) as unknown as LeanTodo | null;
    if (!doc) throw new NotFoundError("Todo or sub-task not found");
    return toDTO(doc);
  }

  async removeSubTask(userId: string, id: string, subId: string): Promise<TodoDTO> {
    const doc = (await TodoModel.findOneAndUpdate(
      { _id: id, userId, isDeleted: false },
      { $pull: { subTasks: { _id: new Types.ObjectId(subId) } }, $inc: { version: 1 } },
      { new: true },
    )
      .lean()
      .exec()) as unknown as LeanTodo | null;
    if (!doc) throw new NotFoundError("Todo not found");
    return toDTO(doc);
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function toDTO(t: LeanTodo): TodoDTO {
  return {
    id: String(t._id),
    userId: t.userId,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ?? null,
    tags: t.tags ?? [],
    subTasks: (t.subTasks ?? []).map((s) => ({
      id: String(s._id),
      title: s.title,
      isDone: s.isDone,
    })),
    version: t.version ?? 0,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

function encodeCursor(row: LeanTodo, sortField: "createdAt" | "dueDate"): string {
  const raw = row[sortField];
  const v = raw instanceof Date ? raw.toISOString() : null;
  const payload: Cursor = { v, id: String(row._id) };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeCursor(cursor: string): Cursor {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as Cursor;
    if (typeof parsed.id !== "string" || !Types.ObjectId.isValid(parsed.id)) {
      throw new Error("bad cursor");
    }
    return parsed;
  } catch {
    throw new BadRequestError("Invalid cursor");
  }
}

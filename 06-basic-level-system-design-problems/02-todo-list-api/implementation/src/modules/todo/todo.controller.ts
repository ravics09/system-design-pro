import type { Response } from "express";
import type { AuthedRequest } from "../../types/index.js";
import { UnauthorizedError, BadRequestError } from "../../errors/httpErrors.js";
import { TodoService } from "./todo.service.js";
import { objectId } from "./todo.validation.js";
import type {
  AddSubTaskInput,
  CreateTodoInput,
  ListTodosInput,
  PatchTodoInput,
  ReplaceTodoInput,
  UpdateSubTaskInput,
} from "./todo.validation.js";

const service = new TodoService();

function userId(req: AuthedRequest): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
}

/** Validate a path param is a real ObjectId (blocks NoSQL-injection via bad ids). */
function param(req: AuthedRequest, name: string): string {
  const raw = req.params[name];
  const parsed = objectId.safeParse(raw);
  if (!parsed.success) throw new BadRequestError(`Invalid ${name}`);
  return parsed.data;
}

export async function createTodo(req: AuthedRequest, res: Response): Promise<void> {
  const todo = await service.create(userId(req), req.body as CreateTodoInput);
  res.status(201).json({ data: todo });
}

export async function listTodos(req: AuthedRequest, res: Response): Promise<void> {
  const query = res.locals.query as ListTodosInput;
  const page = await service.list(userId(req), query);
  res.status(200).json(page);
}

export async function getTodo(req: AuthedRequest, res: Response): Promise<void> {
  const todo = await service.getById(userId(req), param(req, "id"));
  res.status(200).json({ data: todo });
}

export async function patchTodo(req: AuthedRequest, res: Response): Promise<void> {
  const todo = await service.patch(userId(req), param(req, "id"), req.body as PatchTodoInput);
  res.status(200).json({ data: todo });
}

export async function replaceTodo(req: AuthedRequest, res: Response): Promise<void> {
  const todo = await service.replace(userId(req), param(req, "id"), req.body as ReplaceTodoInput);
  res.status(200).json({ data: todo });
}

export async function deleteTodo(req: AuthedRequest, res: Response): Promise<void> {
  await service.softDelete(userId(req), param(req, "id"));
  res.status(204).send();
}

export async function addSubTask(req: AuthedRequest, res: Response): Promise<void> {
  const todo = await service.addSubTask(userId(req), param(req, "id"), req.body as AddSubTaskInput);
  res.status(201).json({ data: todo });
}

export async function updateSubTask(req: AuthedRequest, res: Response): Promise<void> {
  const todo = await service.updateSubTask(
    userId(req),
    param(req, "id"),
    param(req, "subId"),
    req.body as UpdateSubTaskInput,
  );
  res.status(200).json({ data: todo });
}

export async function removeSubTask(req: AuthedRequest, res: Response): Promise<void> {
  const todo = await service.removeSubTask(userId(req), param(req, "id"), param(req, "subId"));
  res.status(200).json({ data: todo });
}

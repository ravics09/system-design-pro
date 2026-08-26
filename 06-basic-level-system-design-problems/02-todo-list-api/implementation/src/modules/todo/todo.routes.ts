import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import type { AuthedRequest } from "../../types/index.js";
import {
  addSubTaskSchema,
  createTodoSchema,
  listTodosSchema,
  patchTodoSchema,
  replaceTodoSchema,
  updateSubTaskSchema,
} from "./todo.validation.js";
import * as ctrl from "./todo.controller.js";

export const todoRouter = Router();

// Every todo route requires authentication; userId comes from the token.
todoRouter.use(authenticate);

todoRouter.post("/", validateBody(createTodoSchema), asyncHandler<AuthedRequest>(ctrl.createTodo));
todoRouter.get("/", validateQuery(listTodosSchema), asyncHandler<AuthedRequest>(ctrl.listTodos));
todoRouter.get("/:id", asyncHandler<AuthedRequest>(ctrl.getTodo));
todoRouter.patch("/:id", validateBody(patchTodoSchema), asyncHandler<AuthedRequest>(ctrl.patchTodo));
todoRouter.put("/:id", validateBody(replaceTodoSchema), asyncHandler<AuthedRequest>(ctrl.replaceTodo));
todoRouter.delete("/:id", asyncHandler<AuthedRequest>(ctrl.deleteTodo));

// Sub-tasks — nested sub-resource reflecting ownership hierarchy.
todoRouter.post(
  "/:id/subtasks",
  validateBody(addSubTaskSchema),
  asyncHandler<AuthedRequest>(ctrl.addSubTask),
);
todoRouter.patch(
  "/:id/subtasks/:subId",
  validateBody(updateSubTaskSchema),
  asyncHandler<AuthedRequest>(ctrl.updateSubTask),
);
todoRouter.delete("/:id/subtasks/:subId", asyncHandler<AuthedRequest>(ctrl.removeSubTask));

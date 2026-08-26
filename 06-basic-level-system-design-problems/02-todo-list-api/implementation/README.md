# Todo List API — Reference Implementation

A runnable TypeScript/Node.js implementation of the design in
[`../02-todo-list-api.md`](../02-todo-list-api.md).

It demonstrates a clean, multi-user REST API:

- **Per-user CRUD** on todos — `userId` always comes from the auth token, never the body.
- **Embedded sub-tasks** with add / toggle / rename / remove.
- **Cursor (keyset) pagination** plus **filtering** (status, priority, tag, due date) and **sorting**.
- **Ownership enforced by query** — a non-owner gets `404`, never another user's data.
- **Soft delete**, request **validation** (zod), typed errors, and a consistent response envelope.

## Design decisions (mapped to the write-up)

| Decision | Where | Why |
|---|---|---|
| Embedded sub-tasks + indexes | `src/models/todo.model.ts` | Few, always loaded & updated with the parent |
| Ownership scoped into every query | `src/modules/todo/todo.service.ts` | Authorization enforced by the query (404 for non-owners) |
| Cursor (keyset) pagination | `TodoService.list` + `encode/decodeCursor` | Stable under inserts; constant-time at any depth |
| Filtering & sorting | `todo.service.ts` query builder | Backed by the compound index (ESR) |
| Sub-task ops via array operators | `$push` / `arrayFilters` / `$pull` | Atomic single-document updates |
| Soft delete | `softDelete` + `isDeleted:false` reads | Recoverable / auditable |
| Validation → 400 | `todo.validation.ts` + `validate` middleware | Clean field-level errors; NoSQL-injection guard on ids |
| Mass-assignment guard | schemas omit `userId`/flags | Client can't set owner or soft-delete fields |

## Project layout

```
src/
├── config/            # zod-validated env config, status/priority enums
├── types/             # AuthedRequest, Paginated<T>, PageInfo
├── errors/            # typed HTTP errors
├── lib/               # db (mongoose), logger
├── models/            # todo.model.ts (embedded sub-tasks + indexes)
├── middleware/        # authenticate, validate, errorHandler
├── modules/todo/      # validation, service, controller, routes
├── app.ts             # express wiring
└── server.ts          # bootstrap + graceful shutdown
```

## Running locally

Requires Node ≥ 20 and a MongoDB instance.

```bash
npm install
cp .env.example .env
npm run typecheck        # tsc --noEmit
npm run dev              # start on :3000
```

## API

All routes are under `/api/v1/todos` and require auth. This reference accepts the
user id via `Authorization: Bearer <userId>` (or the `x-user-id` header) to stay
runnable without an auth server — swap `middleware/authenticate.ts` for real JWT
verification (see Problem 01).

### Create

```http
POST /api/v1/todos
Authorization: Bearer user-123
Content-Type: application/json

{ "title": "Ship the API", "priority": "HIGH", "tags": ["work"] }
```

```json
// 201
{ "data": { "id": "665f...", "title": "Ship the API", "status": "TODO", "subTasks": [], ... } }
```

### List (paginated / filtered / sorted)

```http
GET /api/v1/todos?status=TODO&priority=HIGH&sort=-createdAt&limit=20
GET /api/v1/todos?limit=20&cursor=<nextCursor>   # next page
```

```json
{
  "data": [ { "id": "...", "title": "..." } ],
  "pageInfo": { "nextCursor": "eyJ2Ijoi...", "hasMore": true, "limit": 20 }
}
```

### Read / update / delete

```http
GET    /api/v1/todos/:id          # 200 (404 if not yours)
PATCH  /api/v1/todos/:id          # partial update
PUT    /api/v1/todos/:id          # full replace
DELETE /api/v1/todos/:id          # 204 (soft delete)
```

### Sub-tasks

```http
POST   /api/v1/todos/:id/subtasks            # { title }           → 201
PATCH  /api/v1/todos/:id/subtasks/:subId     # { title?, isDone? } → 200
DELETE /api/v1/todos/:id/subtasks/:subId     # → 200 (returns updated todo)
```

## Notes & simplifications

- **Auth** uses a demo Bearer-`<userId>` scheme so the API runs without an auth server; replace with
  real JWT verification in production.
- **Optimistic concurrency**: a `version` field is maintained (incremented on every write). Enforcing
  `If-Match`/version on updates is a small extension.
- **dueDate cursor**: keyset pagination is fully stable for the default `createdAt` sort; sorting by
  `dueDate` is best-effort when values are null (documented in `todo.service.ts`).
- Teaching code — production-shaped but favouring clarity over exhaustive hardening (rate limiting,
  caching, metrics), all discussed in the write-up.
```

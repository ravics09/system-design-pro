# Server — database-indexing engine (NestJS + Zod)

In-memory dataset with hash / B-tree / compound / unique indexes and a cost-based query planner that
picks an index scan or a full scan and returns an `EXPLAIN`. No database — `npm install` is all it needs.

## Run

> npm is under nvm here; if `npm` is missing, run `export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"` first.

```bash
npm install
npm run build && npm start   # http://localhost:3010
npm run start:dev            # hot reload
npm run typecheck
```

Config (`.env`, validated by `src/config.ts`): `PORT` (3010), `CORS_ORIGIN`, `SEED_SIZE` (rows seeded on
boot), `MAX_RESULT`.

## How it maps to the concepts

- `engine/indexes.ts` — `HashIndex` (O(1) equality only) and `BTreeIndex` (sorted, compound, supports
  equality-prefix + range + ordered scan); `search()` returns matching ids **and how many entries it
  examined** (the selectivity signal). Unique indexes throw `UniqueViolationError`.
- `engine/planner.ts` — `planQuery` scores candidate indexes by equality-prefix length (**ESR**), range,
  sort provision, and coverage; hash wins ties for pure equality; falls back to `COLLSCAN`.
- `engine/engine.ts` — executes the chosen plan, applies remaining predicates, sorts only when the index
  doesn't provide order, and reports `EXPLAIN` (`strategy`, `rowsExamined`, `rowsReturned`, `sorted`,
  `covered`, `tookMs`).
- `engine/dataset.ts` — deterministic seed (reproducible), with a unique `email` field for unique indexes.

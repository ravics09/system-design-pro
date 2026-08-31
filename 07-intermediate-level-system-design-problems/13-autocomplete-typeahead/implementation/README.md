# Autocomplete / Typeahead — implementation

A prefix autocomplete service implementing the [design doc](../13-autocomplete-typeahead.md): an
**in-memory trie** returns top-k completions ranked by popularity in O(prefix length), fronted by a
**Redis result cache** for hot prefixes.

## Stack

- **Node.js + TypeScript + Express**
- **Trie** (`src/trie.ts`) — dependency-free prefix tree
- **Redis** (optional) — caches `prefix → suggestions` with a TTL

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness |
| GET | `/api/autocomplete?q=&k=` | Top-k suggestions for a prefix (cached) |
| POST | `/api/terms` `{term, weight}` | Add / boost a term (trending) |

## Design-doc mapping

- **Trie** → prefix lookup independent of corpus size; `topK` ranks completions by weight.
- **Popularity** → each term has a weight; `bump` raises it (e.g., on search) so trending terms surface.
- **Caching** → hot prefixes cached in Redis with a TTL (the client should also debounce keystrokes).
- **Tie-break** → equal weights sort alphabetically (stable results).

## Run it

```bash
docker compose up --build          # http://localhost:3113
curl 'localhost:3113/api/autocomplete?q=re&k=5'
```

```bash
npm install && npm test            # 6 unit tests (trie ranking, prefix, k-limit, bump, ties)
npm run typecheck
```

## Verification

- `npm test` covers weight ranking, prefix matching, k-limit, `bump` promotion, and alphabetical
  tie-breaking. `npm run typecheck` passes. Caching runs against Redis under `docker compose up`.

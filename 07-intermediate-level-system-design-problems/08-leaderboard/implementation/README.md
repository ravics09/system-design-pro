# Leaderboard — implementation

A real-time leaderboard implementing the [design doc](../08-leaderboard.md) on **Redis sorted sets**:
O(log n) score updates, top-N, a player's rank, and the "players around me" window — with time-ordered
tie-breaking.

## Stack

- **Node.js + TypeScript + Express**
- **Redis** sorted set per board (skip list + hash → O(log n) rank/range)

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness |
| POST | `/api/boards/:board/score` `{userId, score}` or `{userId, delta}` | Set (with tie-break) or increment |
| GET | `/api/boards/:board/top?n=` | Top-N |
| GET | `/api/boards/:board/players/:userId?radius=` | Rank, score, and the window around the player |

## Design-doc mapping

- **Sorted set** → `ZADD`/`ZINCRBY` updates, `ZREVRANGE` top-N, `ZREVRANK` rank — all O(log n), never a
  SQL `COUNT`.
- **Players around me** → get rank, then `ZREVRANGE rank-radius .. rank+radius`.
- **Tie-breaking** → `compositeScore(score, ts)` packs an inverted seconds-since-2020 tiebreak into the
  low digits so a higher score always wins and equal scores rank earlier-achiever-first (kept within the
  float safe-integer range).

## Run it

```bash
docker compose up --build          # http://localhost:3108
curl -XPOST localhost:3108/api/boards/global/score -H 'content-type: application/json' -d '{"userId":"alice","score":1500}'
curl localhost:3108/api/boards/global/top?n=10
```

```bash
npm install && npm test            # 4 unit tests (tie-break ordering + precision)
npm run typecheck
```

## Verification

- `npm test` covers higher-score-wins, earlier-achiever-wins on ties, composite decode, and safe-integer
  bounds. `npm run typecheck` passes. Rank/top queries run against Redis under `docker compose up`.

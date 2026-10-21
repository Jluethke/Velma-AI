# Cache Write-Behind Buffer

**One-line description:** Implements write-behind for mergeable high-frequency writes (counters, last-seen timestamps) by buffering them in Redis with atomic `HINCRBY` or `HSET`, flushing them to the database with an atomic `RENAME` snapshot and idempotent upserts, and proves with a kill test exactly what is lost on a crash.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the repository.
- `invalidation_plan` (object[], required): Rows with strategy `write-behind` from `cache-invalidation-strategy-select`, including the product owner's acceptance of loss on crash.
- `stack` (string, required): `python`, `node`, `go` or `java`.

---

## Outputs

- `write_behind_change` (object): Buffer key layout, flush job location and schedule, Redis persistence settings read from the server, the measured loss window from the kill test, and test results.

---

## Phase 1: Confirm Fit and Persistence

### Entry Criteria
- `invalidation_plan` row is `write-behind` and records the product owner's written acceptance of losing unflushed writes.

### Actions
1. Confirm the writes are mergeable with this table. If a write type is not in a "yes" row, stop; write-behind is wrong for it.

   | Write type | Merge operation | Fit |
   |---|---|---|
   | Counter increment | sum (`HINCRBY`) | yes |
   | Last-seen or max timestamp | max (keep latest) | yes |
   | Set membership add (tags seen) | union (`SADD`) | yes |
   | Money, orders, inventory decrement, anything audited | none | no |
   | Field update that other writers also change | last-writer-wins conflicts | no |

2. Read Redis persistence from the server, not from a config file guess: `redis-cli CONFIG GET appendonly`, `redis-cli CONFIG GET appendfsync`, `redis-cli CONFIG GET save`. Per Redis persistence docs, `appendonly yes` with `appendfsync everysec` can lose about one second of writes on a crash; with AOF off, everything since the last RDB snapshot can be lost. Managed services may not allow `CONFIG GET`; read their parameter group instead.
3. Record the loss exposure = Redis persistence window plus one flush interval. Show it to the product owner.

### Output
Fit confirmation and the loss exposure statement.

### Quality Gate
- Every write type is mapped to a "yes" row.
- Persistence values are copied from `CONFIG GET` output or the managed parameter group.

---

## Phase 2: Implement Buffer and Flush

### Entry Criteria
- Fit confirmed.

### Actions
1. Buffer: one hash per time bucket or one rolling hash, for example `shop:wb:views` with field = product id. Write path: `HINCRBY shop:wb:views 42 1`. For max timestamps use a small Lua script that sets the field only if the new value is larger.
2. Flush job, run on a schedule (interval is a user input):
   1. `RENAME shop:wb:views shop:wb:views:flushing:<job-run-id>`. RENAME is atomic: new increments go to a fresh `shop:wb:views`, the job owns the renamed key. If `RENAME` returns `ERR no such key`, there is nothing to flush.
   2. `HGETALL` the renamed key (or `HSCAN` for large hashes).
   3. Upsert into the database in one transaction with an idempotency guard, for example a `flush_runs(run_id PRIMARY KEY)` row inserted in the same transaction: Postgres `INSERT INTO flush_runs VALUES ($1) ON CONFLICT DO NOTHING RETURNING run_id`; apply the increments only if the insert returned a row.
   4. After commit, `DEL` the renamed key.
3. On job start, first look for leftover `shop:wb:views:flushing:*` keys with `SCAN 0 MATCH shop:wb:views:flushing:* COUNT 100` and finish them using their run id. The idempotency row prevents double counting if the earlier run committed but crashed before `DEL`.
4. Run only one flusher at a time (cron with a lock: `SET shop:wb:lock <token> NX PX <ms>`).
5. Readers that need the live total add the database value and the buffered value.

### Output
Buffer and flush code with tests.

### Quality Gate
- Unit tests pass for: increments merged, flush moves totals to the database, a second flush with the same run id adds nothing.
- `grep -rn "KEYS " <changed files>` returns nothing (SCAN only).

---

## Phase 3: Kill Test

### Entry Criteria
- Unit tests pass, staging or local Docker Redis and database available.

### Actions
1. Generate a known number of increments, for example 100,000, with a script.
2. Kill the flusher between step 3 (commit) and step 4 (DEL) once, and between step 2 and step 3 once (inject a crash point via an environment variable read only in tests).
3. Restart the flusher and let it finish.
4. Compare: database total plus remaining buffer must equal the number sent. Any difference is double counting (bug) or loss (must be zero when only the flusher is killed).
5. Separately, kill Redis with `docker kill <redis container>` during load and restart it; the difference now is the persistence loss. Record it.

### Output
`write_behind_change`.

### Quality Gate
- Flusher kill runs show a difference of exactly 0.
- The Redis kill loss is recorded as a measured count and is within what Phase 1 stated.

---

## Worked Example

Illustrative. Product view counters, flush every 10 s (user input).

Phase 1: counters are a "yes" row. `CONFIG GET appendfsync` returns `everysec`, `appendonly` returns `yes`. Loss exposure: about 1 s of Redis writes plus 0 for the flusher (idempotent).

Phase 2: `HINCRBY shop:wb:views 42 1` on each view; flusher renames, upserts `UPDATE products SET views = views + $2 WHERE id = $1` inside the run-id transaction.

Phase 3: 100,000 increments with two injected flusher crashes: database 100,000, buffer 0, difference 0. Redis kill during load: database plus buffer 99,212 of 100,000 sent; 788 lost, inside the stated window.

---

## Exit Criteria

DONE when only mergeable writes are buffered, flushes are atomic and idempotent, flusher crashes lose nothing, and Redis crash loss is measured and accepted.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Write type not mergeable | **Stop**: return it to `cache-invalidation-strategy-select` for a different strategy. |
| Phase 1 | Product owner has not accepted loss | **Stop**: write-behind needs that acceptance in writing. |
| Phase 3 | Database total exceeds increments sent | **Stop**: double counting; the idempotency guard is missing or outside the transaction. |
| Phase 3 | Loss with only the flusher killed | **Adjust**: DEL is running before commit; move it after. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

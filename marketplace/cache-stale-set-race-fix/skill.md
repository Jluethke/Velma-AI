# Cache Stale-Set Race Fix

**One-line description:** Reproduces the cache-aside stale-set race (a reader loads the old row, a writer commits and deletes, the reader then writes the old row back) with a deterministic interleaving test, and closes it with a version-checked Lua set or a lease token, chosen by a decision table.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the repository with the cache-aside code.
- `invalidation_plan` (object[], required): Strategies from `cache-invalidation-strategy-select`; this flow applies to `cache-aside` and `write-through` rows.
- `stack` (string, required): `python`, `node`, `go` or `java`.

---

## Outputs

- `race_test` (object): The test file and name, the interleaving it forces, and its output before the fix (failing) and after (passing).
- `race_fix` (object): The fix chosen with its decision table row, files changed, Lua script text if any, and the full suite result.

---

## Phase 1: Reproduce the Race Deterministically

### Entry Criteria
- The cache-aside read path and after-commit delete exist and their tests pass.

### Actions
1. The race, step by step:
   1. Reader R misses the cache and reads row version 1 from the database.
   2. Writer W updates the row to version 2, commits, and deletes the cache key.
   3. R sets the key to version 1. The cache now serves version 1 until TTL.
2. Make the interleaving deterministic by adding a test-only hook between "load from database" and "set cache" in the read path. One hook, one file. Per stack:
   - Python: a module-level `_after_load_hook = None` called if set; the test sets it to a function that waits on `threading.Event`.
   - Node: an injectable `afterLoad` async callback; the test passes one that awaits a promise the test resolves later.
   - Go: an optional `afterLoad func()` field on the store; the test uses a channel to block and release it.
   - Java: a package-private `Runnable afterLoad` on the service; the test uses `CountDownLatch`.
3. Test steps: start R in a thread, goroutine or un-awaited promise; wait until R reaches the hook; run W to completion (update, commit, delete); release R; then read the cache key directly and assert it holds version 2 or is absent.
4. Run it. It MUST fail now, showing version 1 in the cache. If it passes, the hook is in the wrong place; fix the test, do not move on.
5. Do not use `sleep` to order the steps. Sleeps make the test flaky and hide the race.

### Output
`race_test` failing for the documented reason.

### Quality Gate
- The test fails with an assertion that names version 1 (the stale value), recorded verbatim.
- The test file contains no sleep calls (`grep -nE "sleep|setTimeout|Thread.sleep" <test file>` returns nothing used for ordering).

---

## Phase 2: Choose and Apply the Fix

### Entry Criteria
- `race_test` fails as expected.

### Actions
1. Choose with this table, first match:

   | Row | Condition | Fix |
   |---|---|---|
   | 1 | The row has a monotonically increasing version column (`version`, `xmin` is NOT suitable because it is not monotonic across wraparound, `updated_at` only if strictly increasing per row) and the backend is Redis | Version-checked set via Lua |
   | 2 | No version column, backend is Redis | Lease token |
   | 3 | Backend is Memcached | `add` (set only if absent) for fills plus a short-lived tombstone set on delete; check Memcached `protocol.txt` for `add` and `cas` semantics |
   | 4 | None of the above possible | Keep the race, rely on TTL, and record the TTL as the bound in `race_fix` |

2. Row 1, store `{"v": <version>, "data": ...}` and set through this script (EVAL or a loaded script via SCRIPT LOAD / EVALSHA):

   ```lua
   -- KEYS[1]=key ARGV[1]=new_version ARGV[2]=payload ARGV[3]=ttl_seconds
   local cur = redis.call('GET', KEYS[1])
   if cur then
     local cv = tonumber(cjson.decode(cur)['v'])
     if cv and cv >= tonumber(ARGV[1]) then return 0 end
   end
   redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
   return 1
   ```
   This blocks overwriting a newer value, but after W deletes the key, R's old value still gets in. So row 1 also requires that W, instead of DEL, writes a tombstone `{"v": <new version>, "data": null}` through the same script, so R's older version is refused. The tombstone TTL must be longer than the slowest read path (p99 database load time, measured), or a very slow reader can still land after the tombstone expires. Readers treat `data: null` with a version as a miss.
3. Row 2, lease token:
   - On miss, R runs `SET lease:<key> <random token> NX PX <lease_ms>` before reading the database. `lease_ms` must exceed the p99 database load time measured in `cache-stampede-risk-assess` or your own trace.
   - W deletes both `<key>` and `lease:<key>` after commit.
   - R sets the value with a Lua script that writes only if `GET lease:<key>` still equals its token, then deletes the lease. If W deleted the lease, R's set is refused.
4. Implement only in the cache module and the writer hook. Run `race_test`; it must pass. Then run the full suite.

### Output
`race_fix`.

### Quality Gate
- `race_test` now passes, and its output is recorded.
- The full suite exits 0.
- The Lua script is exercised by a test against a real Redis (fakeredis and miniredis support EVAL with their own Lua engines; confirm on real Redis 7 with Docker once).

---

## Worked Example

Illustrative. Python, Postgres table `products` with an integer `version` column incremented on every update, Redis 7.

Phase 1: `pytest tests/test_product_race.py -q` fails: `AssertionError: cached version 1, expected 2 or absent`.

Phase 2: row 1. Writer replaces `DEL` with a tombstone set `{"v":2,"data":null}` `EX 30` after commit; reader sets through the Lua script. The race test passes; `pytest -q` prints `221 passed`. Real Redis run: `docker run --rm -d -p 6379:6379 redis:7` then the same test with `REDIS_URL` set passes.

---

## Exit Criteria

DONE when a deterministic test proves the stale-set race existed and now passes with the chosen fix, or the TTL is recorded as the accepted bound under row 4.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Race test passes before the fix | **Adjust**: the hook is not between database load and cache set; move it. |
| Phase 1 | Cannot add a test hook without touching many files | **Adjust**: inject the hook through the existing constructor or DI container; one file only. |
| Phase 2 | Lua `cjson` decode error | **Adjust**: some cached values predate the versioned format; bump the key schema version so old values are never read. |
| Phase 2 | Lease TTL shorter than the slowest load | **Retry**: remeasure load p99 and set `lease_ms` above it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

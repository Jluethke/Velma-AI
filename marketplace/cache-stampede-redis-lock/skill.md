# Cache Stampede Redis Lock

**One-line description:** Limits recomputation of a hot key to one caller across all processes with a Redis `SET key token NX PX ms` lock, a compare-and-delete Lua release, a lock TTL derived from measured recompute time, and a defined loser behavior (poll the value with backoff or serve stale), verified by a concurrency test that counts database calls.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the repository.
- `key_schema` (object[], required): Key templates from `cache-key-schema-design`; lock keys follow the same namespace.
- `stampede_plan` (object[], required): Rows from `cache-stampede-risk-assess` that include `lock`, with recompute d_p99.
- `stack` (string, required): `python`, `node`, `go` or `java`.

---

## Outputs

- `lock_guard_change` (object): Files changed, lock key template, lock TTL and its derivation, loser behavior, release script, and the concurrency test result (database calls before and after).

---

## Phase 1: Specify the Lock

### Entry Criteria
- `stampede_plan` row includes `lock`, and `cache_backend` is Redis.

### Actions
1. Lock key: `<service>:lock:<entity>:v<n>:<identifier>`, built in the key builder module. Do not reuse the value key.
2. Lock TTL (`PX`, milliseconds) must be longer than the p99 recompute time from `stampede_plan`, so the lock does not expire while the holder is still working. It must also be short enough that a crashed holder blocks others only briefly. Record the measured d_p99 and the chosen TTL; if d_max is far above d_p99, record d_max too and state which tail you accept.
3. Token: a random value per acquisition (`secrets.token_hex(16)` in Python, `crypto.randomUUID()` in Node, `uuid` or `crypto/rand` in Go, `UUID.randomUUID()` in Java). The token lets the holder delete only its own lock.
4. Loser behavior, first match:

   | Condition | Loser does |
   |---|---|
   | A stale copy exists (kept under a second key or with a logical expiry inside the value) | Return the stale copy immediately |
   | No stale copy | Poll the value key with backoff until it appears or until a wait limit equal to the lock TTL passes, then compute it directly (fail open) |

5. This is an efficiency lock: if it fails, two processes recompute, which is safe. It is not a correctness lock, so a single Redis instance is enough. Do not implement Redlock for this.

### Output
Lock specification.

### Quality Gate
- Lock TTL is greater than the recorded d_p99, with both numbers written.
- The loser behavior row is chosen and recorded.

---

## Phase 2: Implement

### Entry Criteria
- Specification recorded.

### Actions
1. Acquire: `SET <lock_key> <token> NX PX <ttl_ms>`. A reply of `OK` means acquired; a nil reply means another caller holds it. Client calls:
   - redis-py: `r.set(lock_key, token, nx=True, px=ttl_ms)` returns `True` or `None`.
   - node-redis: `client.set(lockKey, token, { NX: true, PX: ttlMs })` returns `'OK'` or `null`.
   - go-redis v9: `rdb.SetNX(ctx, lockKey, token, ttl).Result()` returns `true` or `false`.
   - Spring Data Redis: `redisTemplate.opsForValue().setIfAbsent(lockKey, token, Duration.ofMillis(ttlMs))`.
   Do not use `SETNX` followed by `EXPIRE`; a crash between them leaves a lock with no expiry.
2. Holder: re-check the value key first (another holder may have just filled it), then recompute, set the value, then release.
3. Release with the compare-and-delete script from the Redis `SET` command documentation:

   ```lua
   if redis.call("get", KEYS[1]) == ARGV[1] then
     return redis.call("del", KEYS[1])
   else
     return 0
   end
   ```
   Never release with a plain `DEL`; if your lock already expired and another caller acquired it, a plain `DEL` removes their lock.
4. Release in a `finally` / `defer` block so an exception still releases.
5. Change only the cache module (and key builder for the lock key).

### Output
Lock guard code.

### Quality Gate
- `grep -n "SETNX\|setnx" <changed files>` finds no SETNX plus EXPIRE pair.
- Release goes through the Lua script (`grep -n "redis.call(\"get\"" <changed files>` or the loaded script reference).

---

## Phase 3: Concurrency Test

### Entry Criteria
- Code compiles and unit tests pass.

### Actions
1. Against a real Redis (`docker run --rm -d -p 6379:6379 redis:7`), start K concurrent callers on one missing key, where K is at least the N from `stampede_plan`. Use a thread pool (Python `concurrent.futures.ThreadPoolExecutor`), `Promise.all` (Node), goroutines with `sync.WaitGroup` (Go), or `ExecutorService` (Java), across 2 or more processes if you can.
2. Count calls on a fake or instrumented loader. Expected: 1 (or a small number if the loser wait limit expired). Before the change, the same test gives about K.
3. Kill test: make the holder sleep past the lock TTL; confirm a second caller acquires after expiry and the first holder's release script returns 0 (did not delete the new lock).
4. Run the full suite.

### Output
`lock_guard_change`.

### Quality Gate
- Loader call count is recorded before (about K) and after (1 or close).
- The kill test shows release returned 0 for the expired holder.

---

## Worked Example

Illustrative. Python, category counts, d_p99 450 ms, d_max 900 ms.

Phase 1: lock key `shop:lock:catcounts:v1`, TTL 1,000 ms (above d_max), no stale copy so losers poll with backoff for up to 1,000 ms.

Phase 2: `r.set("shop:lock:catcounts:v1", token, nx=True, px=1000)`; release via `r.eval(RELEASE_LUA, 1, lock_key, token)`.

Phase 3: 60 threads: loader called 60 times before, 1 time after. Kill test: holder sleeps 1,200 ms, second caller acquires at about 1,000 ms, first holder's release returns 0. `pytest -q` prints `224 passed`.

---

## Exit Criteria

DONE when one caller recomputes per expiry across processes, release is token-checked, the lock TTL exceeds measured recompute time, and the concurrency and kill tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Backend is Memcached | **Adjust**: use Memcached `add` with an expiry as the lock; it is set-if-absent. There is no compare-and-delete, so accept that a late holder may delete a newer lock, or skip the lock and use `early_expiry`. |
| Phase 2 | Lock never released in tests | **Adjust**: release is not in `finally` or `defer`. |
| Phase 3 | Loader count still about K | **Adjust**: losers are computing instead of polling; check the nil reply branch. |
| Phase 3 | Callers time out waiting | **Retry**: lock TTL is below the real recompute time; remeasure and raise it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

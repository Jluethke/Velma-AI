# Sliding Window Rate Limiter in Redis

**One-line description:** Implements a distributed sliding window rate limiter in Redis, choosing by decision table between the exact sliding log (sorted set with ZREMRANGEBYSCORE, ZCARD, ZADD and unique members) and the approximate sliding window counter (two weighted fixed windows in one hash), each as an atomic Lua script, and proves the window boundary behavior that fixed windows get wrong.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Path to the service repository.
- `rate_limit_spec` (object, required): `algorithm` (= `sliding_window`), `key_by`, `limit` (requests per window), `window_s`, `routes`, `exact_required` (true when the limit is contractual or billed), `redis_down_behavior` (`fail_open` or `fail_closed`). User or product decisions.
- `redis_url` (string, required): Redis URL for a non-production instance.

---

## Outputs

- `sliding_window_limiter` (object): Variant chosen with reason, script path and SHA1, middleware file:line, memory estimate, boundary test output, and test results.

---

## Phase 1: Choose the Variant

### Entry Criteria
- `rate_limit_spec.algorithm` = `sliding_window`.
- Redis 5.0 or later (`redis-cli -u <redis_url> INFO server | rg redis_version`).

### Actions
1. Apply this table:

| Condition | Variant |
|---|---|
| `exact_required` is true | sliding log |
| `exact_required` is false and the user accepts an approximation | sliding window counter |
| `exact_required` not given | sliding log, and record an open question about memory |

2. Memory estimate for the sliding log: each request in the window is one sorted set member. Measure it rather than guessing: after Phase 2 step 3, run `redis-cli -u <redis_url> MEMORY USAGE rl:test` with the key full at `limit` members and multiply by the expected number of active keys. Record the number.
3. The counter variant stores two integers per key. Cloudflare's 2017 post "How we built rate limiting capable of scaling to millions of domains" measured its error on real traffic; it assumes requests in the previous window were evenly spread, so a burst at the end of the previous window is under-weighted or over-weighted. Record this property in the output.

### Output
Variant with reason.

### Quality Gate
- The chosen variant matches the table row for the inputs; the row is quoted in the output.

---

## Phase 2: Write and Prove the Script

### Entry Criteria
- Variant chosen.

### Actions
1. Sliding log (`ratelimit/sliding_log.lua`):
   ```lua
   -- KEYS[1] key; ARGV[1] window_ms; ARGV[2] limit; ARGV[3] unique member id
   local t = redis.call('TIME')
   local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)
   local w, limit = tonumber(ARGV[1]), tonumber(ARGV[2])
   redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now - w)
   local n = redis.call('ZCARD', KEYS[1])
   if n < limit then
     redis.call('ZADD', KEYS[1], now, ARGV[3])
     redis.call('PEXPIRE', KEYS[1], w)
     return { 1, limit - n - 1, 0 }
   end
   local oldest = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')
   return { 0, 0, tonumber(oldest[2]) + w - now }
   ```
   The member must be unique per request (a UUID from the app). Using the timestamp as member makes two requests in the same millisecond collapse into one, under-counting. The third reply value is the exact milliseconds until the oldest entry leaves the window.
2. Sliding window counter (`ratelimit/sliding_counter.lua`), one hash per key with a field per window index:
   ```lua
   -- KEYS[1] key; ARGV[1] window_ms; ARGV[2] limit
   local t = redis.call('TIME')
   local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)
   local w, limit = tonumber(ARGV[1]), tonumber(ARGV[2])
   local cur = math.floor(now / w)
   local elapsed = now - cur * w
   local c = tonumber(redis.call('HGET', KEYS[1], tostring(cur)) or '0')
   local p = tonumber(redis.call('HGET', KEYS[1], tostring(cur - 1)) or '0')
   local est = p * (w - elapsed) / w + c
   if est + 1 > limit then return { 0, tostring(est), w - elapsed } end
   redis.call('HINCRBY', KEYS[1], tostring(cur), 1)
   redis.call('HDEL', KEYS[1], tostring(cur - 2))
   redis.call('PEXPIRE', KEYS[1], 2 * w)
   return { 1, tostring(est + 1), 0 }
   ```
   Keys are never built inside the script, so it is safe on Redis Cluster. The third value when denied is the time to the end of the current window, an upper-bound estimate, not exact.
3. Prove the log: `for i in $(seq 1 7); do redis-cli -u <redis_url> --eval ratelimit/sliding_log.lua rl:test , 2000 5 "m$i"; done`. Expect 5 replies starting `1`, then 2 starting `0`. Then `sleep 2` and one more call with a new member: expect `1`.
4. Do NOT reuse the member id across calls in this test; that reproduces the collision bug.

### Output
Script and redis-cli proof.

### Quality Gate
- The proof shows exactly `limit` allowed then denials, and allowance after the window passes. Output saved.

---

## Phase 3: Wire and Test the Boundary

### Entry Criteria
- Script proven.

### Actions
1. Load and call the script the same way as `res-redis-token-bucket` Phase 2 (redis-py `register_script`, ioredis `defineCommand`, go-redis `NewScript(...).Run`, Spring `RedisScript`), passing a UUID member for the log variant.
2. Deny with 429 and `Retry-After: <ceil(ms/1000)>`. Follow `redis_down_behavior` on Redis errors with a bounded Redis timeout.
3. Boundary test (the case a fixed window fails): with `limit` L and window W, send L requests just before a fixed-window boundary and L right after it. A fixed window allows 2L in about one second; the sliding log must allow only L in any W-long span. Script it: `sleep` until `date +%s` mod W equals W-1, send L requests, sleep 1, send L requests; count 200s. Expect the second burst to be denied for the log variant.
4. For the counter variant, record the boundary result as measured (it will allow some of the second burst, proportional to the elapsed fraction); do not label it exact.
5. Add automated tests for allowance up to L, denial at L+1, `Retry-After` present, and per-key isolation.

### Output
`sliding_window_limiter` with test output.

### Quality Gate
- Boundary test output saved; for the log variant the second burst shows 0 allowed within the window.
- Automated tests pass.

---

## Worked Example

Illustrative. `rate_limit_spec` = `{algorithm: sliding_window, key_by: user_id, limit: 100, window_s: 60, exact_required: true, redis_down_behavior: fail_closed}`.

Phase 1: sliding log. `MEMORY USAGE rl:user:42` at 100 members prints `9312` (bytes); with 20,000 active users: about 186 MB, recorded for the capacity owner.

Phase 3 boundary test: 100 requests at second 59 then 100 at second 0 of the next minute: first burst `200 x100`, second burst `429 x100`. A fixed window counter in the same test returned `200 x200`.

---

## Exit Criteria

DONE when the variant chosen by the table is implemented as an atomic Lua script, wired with 429 and Retry-After, its memory measured (log) or approximation recorded (counter), and the boundary behavior measured.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Memory estimate too large for the Redis instance | **Return**: report the number and offer the counter variant as a user decision. |
| Phase 2 | Log allows more than `limit` | **Adjust**: members are not unique; pass a UUID. |
| Phase 3 | Boundary test inconclusive due to clock drift | **Retry**: align with the Redis clock (`redis-cli TIME`) instead of the local clock. |
| Phase 3 | Redis down behavior unspecified | **Return**: ask the user. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

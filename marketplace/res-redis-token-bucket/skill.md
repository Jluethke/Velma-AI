# Token Bucket Rate Limiter in Redis Lua

**One-line description:** Implements a distributed token bucket rate limiter as one atomic Redis Lua script using server time (TIME), refill-on-read arithmetic, PEXPIRE cleanup and a Retry-After value, loads it with EVALSHA from the service, returns HTTP 429 with Retry-After, and proves burst and refill behavior with redis-cli and a timed test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Path to the service repository.
- `rate_limit_spec` (object, required): `algorithm` (= `token_bucket` for this flow), `key_by` (for example API key, user id, client IP), `rate_per_s` (sustained rate), `burst` (bucket capacity), `routes` (which endpoints), `redis_down_behavior` (`fail_open` or `fail_closed`). All values are user or product decisions, not derived here.
- `redis_url` (string, required): Redis connection URL for a non-production instance used to test.

---

## Outputs

- `token_bucket_limiter` (object): Script path, script SHA1, the middleware file:line, response contract (status, headers), Redis timeout used, redis-cli proof output, and test results.

---

## Phase 1: Write and Prove the Script

### Entry Criteria
- `redis-cli -u <redis_url> INFO server | rg redis_version` prints 5.0 or later (`TIME` inside scripts needs effects replication, the default from 5.0 and the only mode from 7.0).

### Actions
1. Save `token_bucket.lua` in the service repo (for example `ratelimit/token_bucket.lua`):
   ```lua
   -- KEYS[1] = bucket key; ARGV[1] = rate tokens/s; ARGV[2] = capacity; ARGV[3] = tokens requested
   local t = redis.call('TIME')
   local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)
   local rate, cap, req = tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3])
   local b = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
   local tokens = tonumber(b[1]) or cap
   local ts = tonumber(b[2]) or now
   tokens = math.min(cap, tokens + math.max(0, now - ts) * rate / 1000)
   local allowed, retry_ms = 0, 0
   if tokens >= req then
     tokens = tokens - req; allowed = 1
   else
     retry_ms = math.ceil((req - tokens) * 1000 / rate)
   end
   redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
   redis.call('PEXPIRE', KEYS[1], math.ceil(cap * 1000 / rate))
   return { allowed, tostring(tokens), retry_ms }
   ```
2. Why each line: `TIME` uses the Redis clock so app servers with skewed clocks agree; one script runs atomically, so no `WATCH`/`MULTI` race; the TTL equals the time to refill from empty to full, after which a missing key and a full bucket are the same; `tostring` because Redis converts Lua numbers to integers in replies.
3. Prove burst: run `for i in $(seq 1 15); do redis-cli -u <redis_url> --eval ratelimit/token_bucket.lua rl:test , 5 10 1; done`. Expect the first 10 replies to start with `1` and the next 5 with `0` and a positive `retry_ms`.
4. Prove refill: wait 1 second (`sleep 1`), run once more, expect `1` (5 tokens per second refilled).
5. Do NOT use `INCR` plus `EXPIRE` from the app; that is a fixed window, not a token bucket, and the two calls are not atomic.

### Output
Script file and redis-cli proof.

### Quality Gate
- The 15-call loop shows exactly `burst` allowed then denials; the post-sleep call is allowed. Save the output.

---

## Phase 2: Call It From the Service

### Entry Criteria
- Script proven.

### Actions
1. Load once and call by SHA, with the library's script helper (it retries with `EVAL` on `NOSCRIPT`):
   - python redis-py: `bucket = r.register_script(open(path).read())`; `allowed, tokens, retry_ms = bucket(keys=[key], args=[rate, burst, 1])`.
   - node ioredis: `redis.defineCommand('tokenBucket', { numberOfKeys: 1, lua: src })`; `await redis.tokenBucket(key, rate, burst, 1)`.
   - go-redis v9: `var tb = redis.NewScript(src)`; `res, err := tb.Run(ctx, rdb, []string{key}, rate, burst, 1).Slice()`.
   - java Spring Data Redis: `RedisScript<List> s = RedisScript.of(new ClassPathResource("token_bucket.lua"), List.class)`; `redisTemplate.execute(s, List.of(key), rate, burst, 1)`.
2. Key format: `rl:{<key_by value>}:<route group>`. One key per script call, so Redis Cluster routing works.
3. Response when denied: HTTP 429 (RFC 6585) with `Retry-After: <ceil(retry_ms / 1000)>` seconds (RFC 9110 section 10.2.3). Optionally add the `RateLimit` headers from the IETF httpapi draft; check the current draft's header names before using them.
4. Redis call timeout: use the redis timeout from `res-*-timeouts` (or the plan). On Redis error or timeout follow `redis_down_behavior`: `fail_open` allows the request and increments `ratelimit_redis_errors_total`; `fail_closed` returns 503. Never block the request waiting on Redis without a timeout.
5. Apply the middleware only to `routes`. Do NOT apply it to health checks.

### Output
Middleware calling the script.

### Quality Gate
- `rg -n "token_bucket.lua|tokenBucket|NewScript" <source>` shows a single load site.
- Middleware returns 429 with `Retry-After` (checked in Phase 3).

---

## Phase 3: Test End to End

### Entry Criteria
- Middleware deployed to a local or test environment with `redis_url`.

### Actions
1. Burst test: `for i in $(seq 1 $((BURST+5))); do curl -s -o /dev/null -w "%{http_code} " -H "X-Api-Key: test" http://localhost:<port>/<route>; done; echo`. Expect `BURST` 200s then 429s.
2. Header test: `curl -si -H "X-Api-Key: test" http://localhost:<port>/<route> | rg -i "retry-after"` right after the burst shows a positive integer.
3. Isolation: a different `key_by` value is not limited during the burst of the first.
4. Redis-down test: stop Redis or point to a closed port; confirm the configured `redis_down_behavior` and that latency stays under the Redis timeout.
5. Add an automated test in the project's runner for the 429 status, the header, and key isolation.

### Output
`token_bucket_limiter` with outputs.

### Quality Gate
- Saved curl output shows exactly `burst` successes then 429s for one key, and success for a second key.
- Redis-down run matches `redis_down_behavior`.

---

## Worked Example

Illustrative. `rate_limit_spec` = `{algorithm: token_bucket, key_by: api_key, rate_per_s: 5, burst: 10, routes: ["/v1/search"], redis_down_behavior: fail_open}`.

Phase 1 loop prints `1 "9" 0`, ..., `1 "0" 0`, then `0 "0.035" 194` five times. After `sleep 1`: `1 "4.035" 0`.

Phase 3: `200 200 200 200 200 200 200 200 200 200 429 429 429 429 429`; `Retry-After: 1`. Key `other` returns 200 during the burst. With Redis stopped, requests return 200 and `ratelimit_redis_errors_total` rises.

---

## Exit Criteria

DONE when a single atomic Lua token bucket limits the specified routes per key, returns 429 with Retry-After, follows the chosen Redis-down behavior, and burst, refill, isolation and outage behavior are proven.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Redis older than 5.0 | **Adjust**: pass the app's time in milliseconds as an extra ARGV instead of `TIME`, and record the clock-skew risk. |
| Phase 1 | All calls allowed | **Adjust**: check ARGV order (rate, capacity, requested) and that the same key is used each time. |
| Phase 2 | `redis_down_behavior` not given | **Return**: ask the user; it is a product decision. |
| Phase 3 | 429 without Retry-After | **Adjust**: compute it from `retry_ms`; clients need it to back off. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

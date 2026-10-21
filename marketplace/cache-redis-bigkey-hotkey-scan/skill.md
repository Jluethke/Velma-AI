# Redis Big Key and Hot Key Scan

**One-line description:** Finds Redis keys that are too large (they block the server on delete or read and dominate memory) or too hot (they overload one shard) with `redis-cli --bigkeys`, `--memkeys`, `--hotkeys`, `MEMORY USAGE`, `OBJECT FREQ`, `SLOWLOG` and latency tools, and fixes each finding with a table of remedies.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `redis_url` (string, required): Address of the Redis cache instance.
- `redis_memory_config` (object, required): Output of `cache-redis-maxmemory-eviction`, including the eviction policy (`--hotkeys` needs an LFU policy).

---

## Outputs

- `key_size_report` (object): Top keys by size and by access frequency with their prefixes, `SLOWLOG` entries tied to them, latency measurements, and the remedy chosen for each finding with before and after numbers.

---

## Phase 1: Scan

### Entry Criteria
- `redis-cli` can reach the instance. Run against a replica if one exists; the scans add load.

### Actions
1. Big keys by element count and type: `redis-cli -u <redis_url> --bigkeys -i 0.01`. The `-i` flag sleeps between SCAN batches (seconds) to reduce load. Output lists the biggest key per type.
2. Big keys by memory: `redis-cli -u <redis_url> --memkeys -i 0.01` (available in redis-cli 6 and later; check `redis-cli --help`). For a single key: `MEMORY USAGE <key> SAMPLES 0` (0 = sample all nested elements, exact but slower).
3. Hot keys: `redis-cli -u <redis_url> --hotkeys -i 0.01`. It requires `maxmemory-policy` to be an `*-lfu` policy; otherwise it errors. Per key: `OBJECT FREQ <key>` (LFU counter, logarithmic, not a request count).
4. Slow commands: `redis-cli -u <redis_url> SLOWLOG GET 25`. Each entry shows id, timestamp, duration in microseconds, and the command with arguments. The threshold is `slowlog-log-slower-than` (`CONFIG GET slowlog-log-slower-than`, default 10000 microseconds).
5. Latency: `redis-cli -u <redis_url> --latency-history -i 15` from an app host for a few minutes. On the Redis host itself, `redis-cli --intrinsic-latency 100` measures the host's own scheduling latency (the baseline no command can beat).
6. Never use `KEYS *` to find keys; it blocks the server for the full scan.

### Output
Raw scan outputs saved.

### Quality Gate
- Outputs of `--bigkeys`, `--memkeys` (or per-key `MEMORY USAGE`), `--hotkeys` (or a recorded reason it could not run), `SLOWLOG GET`, and `--latency-history` are saved.

---

## Phase 2: Attribute and Decide

### Entry Criteria
- Scan outputs saved.

### Actions
1. Map every top key to its `key_schema` template by prefix. Unknown prefixes belong to some other writer; find it with `git grep "<prefix>"` across the repos that share the instance.
2. Match SLOWLOG entries to these keys (`DEL`, `HGETALL`, `SMEMBERS`, `LRANGE 0 -1`, `KEYS` on big structures are the usual offenders).
3. Choose a remedy, first match per finding:

   | Finding | Remedy |
   |---|---|
   | Big key deleted with `DEL` shows in SLOWLOG | Use `UNLINK` (frees memory in a background thread); also set `lazyfree-lazy-eviction yes` and `lazyfree-lazy-expire yes` so eviction and expiry free large values in the background |
   | Big hash, set or list read whole (`HGETALL`, `SMEMBERS`) | Read only needed fields (`HMGET`), or iterate with `HSCAN`/`SSCAN`; or split into per-item keys |
   | Big string (serialized blob) | Cache smaller units (per item instead of per page), or compress values in the client and record the CPU cost |
   | Hot key on a Redis Cluster shard | Add an in-process L1 cache with a short TTL in front of it (see the in-process flows), or replicate the key under N suffixes (`key:{0..N-1}`) and read a random one; writes update all N |
   | Hot key on a single instance | Same L1 remedy; read from replicas if staleness allows |
   | Command latency matches intrinsic latency | No Redis-side fix; the host is the limit |

### Output
Finding list with remedies.

### Quality Gate
- Every top key is attributed to a template or an owning codebase.
- Every finding has one remedy row.

---

## Phase 3: Fix and Re-Scan

### Entry Criteria
- Remedies chosen.

### Actions
1. Apply one remedy at a time, in the code that owns the key, with its tests.
2. Config changes: `CONFIG SET lazyfree-lazy-eviction yes` and persist through the deployment config (see `cache-redis-maxmemory-eviction` Phase 3).
3. Re-run the same scan command from Phase 1 that showed the finding, plus `SLOWLOG RESET` before the measurement window and `SLOWLOG GET 25` after.
4. Record before and after for each finding (key size, frequency, slowlog count, latency percentile).

### Output
`key_size_report`.

### Quality Gate
- Each fixed finding has before and after numbers from the same command.
- No `DEL` of a key listed by `--bigkeys` remains in the changed code (`git grep -n "\.delete(\|\.del(\|Del(" ` reviewed for those keys).

---

## Worked Example

Illustrative. Policy `allkeys-lfu`.

Phase 1: `--bigkeys` prints `Biggest hash found 'shop:cart:v1:{u9001}:items' has 48211 fields`. `--hotkeys` prints `hot key found with counter: 255 keyname: shop:catcounts:v1`. `SLOWLOG GET` shows `HGETALL shop:cart:v1:{u9001}:items` at 38,412 microseconds.

Phase 2: cart hash row 2 (read whole). Category counts row 5 (single instance hot key): add L1 in-process cache with 2 s TTL (staleness tolerance 5 s).

Phase 3: cart code switched to `HSCAN` paging; SLOWLOG count for the pattern 14 per hour to 0. Category counts Redis GET rate fell from 3,100 per second to 12 per second per the client metric.

---

## Exit Criteria

DONE when big and hot keys are found by non-blocking scans, attributed to their owner, remedied one at a time, and re-scanned with before and after numbers.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `--hotkeys` errors about the policy | **Adjust**: run it on a replica or test copy with an LFU policy, or use client-side counters per key prefix. |
| Phase 1 | Scan raises latency on the primary | **Adjust**: increase `-i` or run against a replica. |
| Phase 2 | Key owned by another team | **Return**: hand the finding to that owner with the scan output. |
| Phase 3 | Finding unchanged after the fix | **Retry**: confirm the new code is deployed and old keys have expired or been migrated. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

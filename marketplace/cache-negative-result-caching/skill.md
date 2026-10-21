# Cache Negative Result Caching

**One-line description:** Caches "not found" results with a distinct sentinel and their own shorter TTL so repeated lookups of missing keys stop reaching the database, deletes the sentinel when the entity is created, never caches errors as absence, and adds a Bloom filter when misses come from random or hostile keys.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the repository.
- `key_schema` (object[], required): Key templates from `cache-key-schema-design`.
- `ttl_table` (object[], required): TTLs from `cache-ttl-from-change-rate`; this flow fills the `negative_ttl` field.
- `stack` (string, required): `python`, `node`, `go` or `java`.

---

## Outputs

- `negative_cache_change` (object): Sentinel format, negative TTL per entry type with its derivation, the create-path invalidation points, whether a Bloom filter was added, test results, and database miss-query counts before and after.

---

## Phase 1: Measure Misses

### Entry Criteria
- Cache-aside read path exists.

### Actions
1. Count lookups that return nothing. Add a counter on the "loader returned none or empty" branch, or query logs: for HTTP, `awk '$9==404 {print $7}' access.log | sed 's/?.*//' | sort | uniq -c | sort -rn | head -20`.
2. Classify the misses:

   | Pattern | Meaning | Action |
   |---|---|---|
   | Few distinct missing keys repeated many times | Clients polling for something not yet created, or a stale link | Negative caching (Phase 2) |
   | Many distinct missing keys, each seen once or twice | Enumeration, scraping or random ids (cache penetration) | Bloom filter (Phase 3), negative caching would only fill memory |
   | Misses caused by database errors or timeouts | Not absence | Never cache; fix error handling |

3. Record the counts behind each classification.

### Output
Miss counts and classification.

### Quality Gate
- Distinct missing keys and total misses are both recorded from command output.

---

## Phase 2: Add the Sentinel

### Entry Criteria
- Repeated-miss pattern found.

### Actions
1. Choose a sentinel that cannot collide with a real value, for example the JSON `{"__miss__":1}` or a single byte prefix reserved for misses. Do not use an empty string or `null` if empty results are valid values (an empty list is a found result, not a miss).
2. Negative TTL: it bounds how long a newly created entity stays invisible if the create-path delete fails. Set `negative_ttl <= staleness_tolerance` for that entry type. If creates go through code that deletes the sentinel (Action 4), the TTL is only a safety net; if not, it is the full delay a new entity can stay hidden. Record the value in `ttl_table`.
3. Only the "definitely not found" branch writes the sentinel. Wrap the loader so exceptions (connection refused, timeout, permission error) propagate and write nothing.
4. In every create path for the entity (found in the `invalidation_plan` writer list), delete the key after commit. One file per edit, tests after each.
5. Stack notes:
   - Spring: `RedisCacheConfiguration` caches nulls unless `disableCachingNullValues()` is set; if you rely on that behavior, its null TTL equals the cache TTL, so use a separate cache name with the negative TTL.
   - Go `redis.Nil` is a backend miss, not your sentinel; keep them distinct.
   - Node `lru-cache` will not store `undefined`; store an explicit sentinel object.
6. Tests: a missing id hits the database once for repeated reads; a database error writes nothing; creating the entity makes the next read find it.

### Output
Sentinel caching code.

### Quality Gate
- All three tests pass.
- `negative_ttl` is recorded with its staleness tolerance source.

---

## Phase 3: Bloom Filter for Penetration (only if classified)

### Entry Criteria
- Many-distinct-missing-keys pattern found.

### Actions
1. If the Redis server has the Bloom module (Redis Stack or Redis 8 and later include it; check with `redis-cli MODULE LIST` or `redis-cli BF.INFO <name>`), create a filter: `BF.RESERVE shop:bf:product <error_rate> <capacity>`. Capacity is the expected number of ids (count your table); error rate is a user input.
2. Populate it from the database once (`BF.MADD` in batches), and on every create (`BF.ADD`).
3. Read path: `BF.EXISTS shop:bf:product 42` returns 0 means the id certainly does not exist; return not found without touching the cache or database. A 1 means it may exist; continue the normal path.
4. Bloom filters cannot delete. Deleted entities still return 1 (handled by negative caching). Rebuild periodically if deletes are frequent.
5. Without the module, rate-limit by client on the not-found endpoint instead and record that.

### Output
`negative_cache_change`.

### Quality Gate
- `BF.INFO shop:bf:product` output (capacity, items inserted) is recorded.
- Database miss queries during a replay of the random-id traffic are counted before and after.

---

## Worked Example

Illustrative. Mobile clients poll `GET /orders/{id}/receipt` before the receipt exists.

Phase 1: 404s over one hour: 48,200 total for 1,310 distinct ids. Repeated-miss pattern.

Phase 2: sentinel `{"__miss__":1}`, `negative_ttl` 10 s (receipt staleness tolerance is 10 s). Receipt creation deletes `shop:receipt:v1:<id>` after commit. Tests pass. Database lookups for missing receipts fell from 48,200 per hour to 5,900 per hour in staging replay.

Phase 3: not run; no penetration pattern.

---

## Exit Criteria

DONE when repeated misses are served from a sentinel with a sourced negative TTL, creates delete the sentinel, errors are never cached, and a Bloom filter guards penetration if that pattern was found.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Cannot separate errors from misses in the loader | **Stop**: fix the loader to return a distinct not-found result first. |
| Phase 2 | New entities invisible after create | **Adjust**: the create path is not deleting the sentinel after commit. |
| Phase 3 | `ERR unknown command 'BF.RESERVE'` | **Adjust**: no Bloom module; use rate limiting and record it. |
| Phase 3 | Filter reports 1 for most random ids | **Adjust**: capacity was exceeded; check `BF.INFO` and rebuild with the real count. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

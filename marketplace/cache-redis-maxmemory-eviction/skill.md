# Redis maxmemory and Eviction Policy

**One-line description:** Sets Redis `maxmemory` from the host or container limit and measured overhead, picks `maxmemory-policy` from a decision table (the default `noeviction` makes cache writes fail when full), persists the setting, and proves eviction works by filling a test instance past the limit while watching `INFO memory` and `evicted_keys`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `redis_url` (string, required): Address of the Redis instance used as the cache, for example `redis://cache.internal:6379/0`.
- `key_schema` (object[], required): Key templates from `cache-key-schema-design`, used to tell cache keys from other data.
- `memory_limit_bytes` (integer, required): Memory available to Redis on its host or container, from the infrastructure definition (container limit, VM size, or managed node type).

---

## Outputs

- `redis_memory_config` (object): `maxmemory` value and its derivation, `maxmemory-policy` and the table row used, how the setting is persisted, `INFO memory` before and after, and the fill test result (`evicted_keys`, write errors).

---

## Phase 1: Read the Current State

### Entry Criteria
- You can run `redis-cli -u <redis_url>` (or `-h -p -a`) against the instance or a test copy.

### Actions
1. Run and save:
   - `redis-cli -u <redis_url> CONFIG GET maxmemory`
   - `redis-cli -u <redis_url> CONFIG GET maxmemory-policy`
   - `redis-cli -u <redis_url> INFO memory` (fields `used_memory`, `used_memory_rss`, `used_memory_peak`, `mem_fragmentation_ratio`, `maxmemory`)
   - `redis-cli -u <redis_url> INFO stats` (fields `evicted_keys`, `expired_keys`, `keyspace_hits`, `keyspace_misses`)
   - `redis-cli -u <redis_url> INFO persistence` (`rdb_*`, `aof_enabled`)
   - `redis-cli -u <redis_url> INFO replication` (`connected_slaves` or `connected_replicas` depending on version)
2. Facts from the Redis docs: `maxmemory 0` means no limit on 64-bit systems; the default policy is `noeviction`, which returns an OOM error to write commands once the limit is reached. Managed services set their own defaults (for example ElastiCache parameter groups); read the parameter group instead of assuming.
3. Check what else lives in this instance: `redis-cli -u <redis_url> --scan --count 1000 | head -2000 | cut -d: -f1-2 | sort | uniq -c | sort -rn`. Keys not matching `key_schema` (sessions, queues, locks, rate limits) change the policy choice.

### Output
Current configuration and key mix.

### Quality Gate
- All five INFO or CONFIG outputs are saved.
- The key mix shows counts per prefix, from command output.

---

## Phase 2: Choose maxmemory and Policy

### Entry Criteria
- Current state recorded.

### Actions
1. `maxmemory` must leave room inside `memory_limit_bytes` for memory Redis uses outside the dataset: replication and client output buffers, the copy-on-write growth of a fork during RDB save or AOF rewrite, and allocator fragmentation. Measure rather than guess: `used_memory_rss - used_memory` (fragmentation overhead now), `INFO clients` output buffer fields, and if persistence or replication is on, observe peak RSS during a `BGSAVE` (`redis-cli BGSAVE`, then watch `ps -o rss= -p <pid>` or container memory). Set `maxmemory = memory_limit_bytes - measured overhead peak`. Write the arithmetic.
2. Policy, first match:

   | Row | Key mix | Policy |
   |---|---|---|
   | 1 | Instance holds only cache data, access is skewed (some keys much hotter) | `allkeys-lfu` |
   | 2 | Instance holds only cache data, recent access predicts future access | `allkeys-lru` |
   | 3 | Instance mixes cache keys with data that must not be evicted (sessions, queues, locks), and every cache key has a TTL | `volatile-lfu` or `volatile-lru`; keys without TTL are never evicted. Better: move the non-cache data to its own instance. |
   | 4 | Instance is not a cache (queues, primary data) | Keep `noeviction`; this flow does not apply |

   With `volatile-*`, if no key has a TTL, nothing can be evicted and writes fail as with `noeviction`.
3. `maxmemory-samples` (default 5) controls approximation accuracy for LRU and LFU; leave the default unless measurement shows a problem.

### Output
Chosen values with derivation and table row.

### Quality Gate
- `maxmemory` is less than `memory_limit_bytes`, with each overhead term backed by a recorded measurement.
- The policy row number is recorded.

---

## Phase 3: Apply, Persist, Fill Test

### Entry Criteria
- Values chosen. A disposable test instance is available for the fill test.

### Actions
1. Fill test on a disposable instance with the same version: `docker run --rm -d -p 6390:6379 --name evict-test redis:<same version> --maxmemory <scaled-down value> --maxmemory-policy <policy>`.
2. Write well past the limit with a script that SETs keys with values sized like real entries (from `key_schema` examples), then read `redis-cli -p 6390 INFO stats | grep evicted_keys` and `INFO memory | grep used_memory_human`. Expected: `evicted_keys` > 0, `used_memory` at or below `maxmemory`, and zero OOM errors in the script output.
3. Repeat with `noeviction` to see the failure mode: writes return `OOM command not allowed when used memory > 'maxmemory'`. This confirms the test actually reached the limit.
4. Apply to the real instance: `redis-cli -u <redis_url> CONFIG SET maxmemory <bytes>` and `CONFIG SET maxmemory-policy <policy>`. Persist it: `CONFIG REWRITE` (fails if the server was started without a config file), or edit `redis.conf`, Helm values, or the managed parameter group. A `CONFIG SET` alone is lost on restart.
5. Watch `evicted_keys` and `keyspace_misses` for a day after the change; a jump in misses with eviction means `maxmemory` is too small for the working set.

### Output
`redis_memory_config`.

### Quality Gate
- Fill test output shows `evicted_keys` > 0 and no OOM errors under the chosen policy.
- After a restart of the test instance from its persisted config, `CONFIG GET maxmemory-policy` still shows the chosen policy.

---

## Worked Example

Illustrative. Container limit 4 GiB (4294967296 bytes), cache-only instance, AOF off, one replica.

Phase 1: `maxmemory` 0, policy `noeviction`, `used_memory` 1.9 GB, all keys under `shop:`.

Phase 2: during `BGSAVE` RSS peaked 610 MB above `used_memory`; replica output buffer peak 64 MB from `INFO clients`; fragmentation overhead 120 MB. maxmemory = 4294967296 - (610+64+120) x 1048576 = 3462397952. Row 1 (skewed access): `allkeys-lfu`.

Phase 3: test instance with `--maxmemory 100mb --maxmemory-policy allkeys-lfu`: wrote 300 MB, `evicted_keys:214377`, `used_memory_human:99.8M`, 0 errors. With `noeviction`: OOM errors after 100 MB. Real instance updated through Helm values, restart shows the policy kept.

---

## Exit Criteria

DONE when `maxmemory` is derived from the memory limit minus measured overhead, the policy comes from the table, the setting survives a restart, and a fill test shows eviction without write errors.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `CONFIG` command disabled or renamed (managed service) | **Adjust**: read and change the provider's parameter group. |
| Phase 2 | Non-cache data mixed into the instance | **Adjust**: use row 3 and confirm every cache key has a TTL, or plan a separate instance. |
| Phase 3 | `CONFIG REWRITE` fails | **Adjust**: persist through the deployment config that starts Redis. |
| Phase 3 | Container killed by the OOM killer during the fill test | **Retry**: overhead was underestimated; remeasure peak RSS during BGSAVE and lower `maxmemory`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

# Memcached Memory, Slabs and Eviction

**One-line description:** Sizes a Memcached cache (`-m`, `-I`) from the memory limit and measured item sizes, reads `stats`, `stats slabs`, `stats items` and `stats settings` to find evictions, out-of-memory errors and slab imbalance per size class, and confirms the slab rebalancer and LRU crawler are active.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `memcached_addr` (string, required): Host and port of a Memcached node, for example `cache-1.internal:11211`.
- `key_schema` (object[], required): Key templates from `cache-key-schema-design`.
- `memory_limit_bytes` (integer, required): Memory available to the Memcached process (container limit or VM memory share).

---

## Outputs

- `memcached_memory_report` (object): Startup flags in use, `stats settings` values that matter, per-slab-class item size, count, evictions and out-of-memory counts, hit ratio, changes made and the before and after numbers.

---

## Phase 1: Read the Running State

### Entry Criteria
- TCP access to the node. `nc` (netcat) or `memcached-tool` available.

### Actions
1. Settings: `printf 'stats settings\r\nquit\r\n' | nc <host> 11211`. Record `maxbytes` (the `-m` value in bytes), `item_size_max` (`-I`), `growth_factor` (`-f`), `slab_reassign`, `slab_automove`, `lru_crawler`, `lru_maintainer`, `maxconns` (`-c`). Defaults per the memcached man page: `-m 64` (megabytes), `-I 1m`, `-f 1.25`, `-c 1024`. Modern releases enable the slab rebalancer and LRU crawler by default; confirm in this output rather than assuming.
2. General stats: `printf 'stats\r\nquit\r\n' | nc <host> 11211`. Record `get_hits`, `get_misses`, `evictions`, `curr_items`, `bytes`, `limit_maxbytes`, `curr_connections`, `rejected_connections` (or `listen_disabled_num`), `uptime`.
3. Per slab class: `memcached-tool <host>:11211 display` prints per class: item size (`Item_Size`), `Max_age`, pages, count, `Full?`, `Evicted`, `Evict_Time`, `OOM`. The raw equivalent is `stats slabs` and `stats items`.
4. Hit ratio = `get_hits / (get_hits + get_misses)` since `uptime`. Counters are cumulative since start; for a recent window, take two readings some minutes apart and use the differences.

### Output
Saved outputs and computed hit ratio.

### Quality Gate
- `stats settings`, `stats` and the per-class display are saved verbatim.
- Hit ratio is computed from two readings' differences, with both readings recorded.

---

## Phase 2: Diagnose

### Entry Criteria
- State recorded.

### Actions
1. Read the per-class table with these rules:

   | Observation | Meaning | Action |
   |---|---|---|
   | `evictions` rising and `Evict_Time` (age of the last evicted item) is shorter than the TTL the application sets for items of that size (read it from the cache code or config) | Memory too small for the working set; items die before their TTL | Raise `-m` within the memory limit (Phase 3) |
   | Evictions concentrated in one class while other classes have free chunks | Slab imbalance (memory stuck in other size classes) | Confirm `slab_reassign` and `slab_automove` are on; if off, enable them (startup flag `-o slab_reassign,slab_automove=1`, check `memcached -h` for your version) |
   | `OOM` counts in a class | No memory could be found for that class at all | Same as slab imbalance, plus check `-m` |
   | Sets failing for large values (client errors like `SERVER_ERROR object too large for cache`) | Value larger than `-I` | Shrink values (split or compress); raising `-I` changes slab sizing for every class, so test it first |
   | `rejected_connections` or `listen_disabled_num` > 0 | Hit `-c` max connections | Check client pool sizes before raising `-c` |

2. Check item sizes against the key schema: the largest classes in use should match the measured value sizes; a class far larger than expected means a value type you did not plan for. Find it by sampling keys from that class with `lru_crawler metadump <class id>` (memcached 1.4.31 and later; check your version) and matching prefixes.

### Output
Diagnosis per finding with table row.

### Quality Gate
- Every finding cites the counter values that triggered it.

---

## Phase 3: Change and Recheck

### Entry Criteria
- Diagnosis complete.

### Actions
1. `-m` is in megabytes and covers item storage only. The process also uses memory for the hash table, connection buffers and per-thread structures. Measure the gap: process RSS (`ps -o rss= -p <pid>`, kilobytes) minus `bytes` from `stats`, at steady state. New `-m` = (`memory_limit_bytes` - measured gap) / 1048576. Write the arithmetic.
2. Change startup flags in the service definition (systemd unit, container args, Helm values). Memcached does not persist data by default; a restart empties the cache, so restart nodes one at a time and expect a miss burst. Check the stampede plan before restarting a busy node.
3. After the change and a warm-up period, take two `stats` readings again and recompute evictions per minute and hit ratio for the same window length as Phase 1.

### Output
`memcached_memory_report`.

### Quality Gate
- New flags appear in `stats settings` (`maxbytes`, `slab_automove`) after the restart.
- Evictions per minute and hit ratio are recorded before and after over equal windows.

---

## Worked Example

Illustrative. Node `cache-1:11211`, container limit 2 GiB.

Phase 1: `maxbytes 67108864` (the 64 MB default was never changed), `evictions` rising 1,900 per minute, hit ratio 0.71 over 10 minutes. `memcached-tool display` shows class 12 (1,184-byte chunks) with `Evict_Time 41` seconds while product TTL is 300 s.

Phase 2: row 1, memory too small.

Phase 3: RSS 96 MB versus `bytes` 66 MB: gap about 30 MB at this size; allowing the hash table to grow, measured again after a test fill at 1.5 GB: gap 112 MB. `-m` = (2147483648 - 117440512) / 1048576 = 1936. After restart and warm-up: evictions 0 per minute, hit ratio 0.94.

---

## Exit Criteria

DONE when `-m` is derived from the limit and measured overhead, slab rebalancing is confirmed on, evictions happen only after items outlive their usefulness, and before and after numbers are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `memcached-tool` not installed | **Adjust**: use raw `stats slabs` and `stats items` through `nc`. |
| Phase 1 | Managed Memcached hides `stats settings` | **Adjust**: read the provider's parameter group and metrics (for example evictions and hit counts) instead. |
| Phase 2 | `lru_crawler metadump` not supported | **Adjust**: sample sizes from the client side by logging value lengths per prefix. |
| Phase 3 | Hit ratio drops after restart | **Retry**: measure again after warm-up; compare equal windows only. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

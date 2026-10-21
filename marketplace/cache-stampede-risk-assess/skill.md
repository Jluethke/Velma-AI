# Cache Stampede Risk Assess

**One-line description:** Decides per hot key whether a cache stampede (many concurrent misses recomputing the same value at expiry) is likely, using Little's law on the measured request rate and recompute time, and picks request coalescing, a distributed lock, probabilistic early expiry or stale-while-revalidate from a decision table.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `read_hotspots` (object[], required): Hotspots with call counts from `cache-read-hotspot-measure`.
- `ttl_table` (object[], required): TTLs from `cache-ttl-from-change-rate`.
- `deployment_topology` (string, required): Hosts and processes per host.

---

## Outputs

- `stampede_plan` (object[]): One row per entry type: per-key request rate, recompute time p50 and p99, expected concurrent recomputes at expiry, chosen techniques (`coalescing`, `lock`, `early_expiry`, `stale_while_revalidate`, or `none`), and the table rows used. A field `techniques` lists the chosen technique names for chain conditions.

---

## Phase 1: Measure the Two Inputs

### Entry Criteria
- `read_hotspots` contains per-key call counts or repeat ratios.

### Actions
1. Per-key request rate r (requests per second for ONE key). From `read_hotspots`: for the hottest key, take its call count over the window; if only totals are known, `calls / window_seconds / distinct_keys` is the AVERAGE key rate, which understates the hottest key. Prefer a per-key count from the app log (`sort | uniq -c | sort -rn | head`).
2. Recompute time d: the wall time of the miss path (database query plus serialization plus cache set). Measure it with a timer around the miss branch, or from tracing spans, under normal load. Record p50 and p99.
3. Count processes P from `deployment_topology` (hosts times workers).

### Output
r, d (p50, p99), and P per entry type.

### Quality Gate
- r comes from a per-key count, or is marked "average, understates hot keys".
- d p99 is read from a measured histogram or trace, with the source named.

---

## Phase 2: Compute and Decide

### Entry Criteria
- r and d measured.

### Actions
1. Expected concurrent recomputes when the key expires, by Little's law (requests in flight = arrival rate times time in system): `N = r * d_p99`. Every request arriving during the recompute also misses.
2. If N < 1, a stampede on that key is unlikely: choose `none` and stop for that row. Keep the row; the numbers can change.
3. Otherwise, choose techniques, taking every row that matches (they combine):

   | Row | Condition | Technique |
   |---|---|---|
   | 1 | Always when N >= 1 | `coalescing` inside each process (collapses N to at most P concurrent recomputes) |
   | 2 | P > 1 and P concurrent recomputes still overload the database (P times the query cost is above what the database handles; ask the DBA or use measured capacity) | `lock` (one recompute across all processes; others wait or serve stale) |
   | 3 | The requests that wait on a recompute at expiry push the endpoint's p99 above its latency target (compare d_p99 with the target), and recomputing slightly before expiry is acceptable | `early_expiry` (XFetch, one request refreshes before expiry so nobody waits; with N >= 1 some request is almost always present to do it) |
   | 4 | Staleness tolerance allows serving the old value for the duration of one recompute | `stale_while_revalidate` (serve stale, refresh in background); at HTTP level use `Cache-Control: stale-while-revalidate=<s>` (RFC 5861) |

4. Also check synchronized expiry: if many keys were filled at once (deploy, warm-up, flush), confirm `ttl_table` jitter J > 0 for them; if J = 0, record that keys will expire together and refer back to `cache-ttl-from-change-rate`.

### Output
`stampede_plan`.

### Quality Gate
- Every row shows N computed from its r and d_p99, with the arithmetic.
- Every row with N >= 1 includes `coalescing`.

---

## Phase 3: Confirm With a Forced Expiry

### Entry Criteria
- `stampede_plan` drafted; staging available.

### Actions
1. Under steady staging load on the hottest key, delete the key: `redis-cli DEL <key>`.
2. Count database executions of that query in the next d_p99 seconds: Postgres `SELECT calls FROM pg_stat_statements WHERE queryid = <id>;` before and after; or count miss-path log lines.
3. Record the observed count. If it is far below N, r or d was overestimated; if above, recheck. This is the "before" number for the technique flows.

### Output
Observed stampede size per hot key, added to `stampede_plan`.

### Quality Gate
- Before and after `calls` values are recorded from the query output.

---

## Worked Example

Illustrative. Category counts query: r = 120 requests per second for the single key, d p99 = 0.45 s, P = 24 processes.

Phase 2: N = 120 x 0.45 = 54. Rows 1, 2 (24 concurrent 450 ms aggregates overload the primary per the DBA), 3 (54 >= 1). Row 4 not chosen: product owner wants counts no older than the TTL. `techniques` = [`coalescing`, `lock`, `early_expiry`].

Phase 3: `DEL shop:catcounts:v1` under load; `calls` went from 9,100 to 9,151: 51 recomputes, close to N = 54.

---

## Exit Criteria

DONE when every hot entry type has a computed N, a technique list from the table, and an observed stampede size from a forced expiry.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No per-key counts available | **Adjust**: use the average rate and mark the row as understated. |
| Phase 2 | Database capacity unknown for row 2 | **Return**: list `lock` as an open question with N and P shown. |
| Phase 3 | Forced expiry not allowed in staging | **Return**: report N as computed only, not observed. |
| Phase 3 | Observed count far from N | **Retry**: remeasure r and d under the same load before choosing techniques. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

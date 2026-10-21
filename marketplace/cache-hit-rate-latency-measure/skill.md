# Cache Hit Rate and Latency Measure

**One-line description:** Measures the effect of the cache against the recorded baseline by repeating the identical load command, reading client-side hit ratio, server-side `keyspace_hits` and `keyspace_misses`, endpoint latency percentiles, and database call counts over equal windows, and reports the hit ratio against the repeat-ratio ceiling.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cache_metrics` (object, required): Metric names and PromQL queries from `cache-hit-miss-instrument`.
- `baseline_metrics` (object, required): Pre-cache numbers and the exact commands from `cache-read-hotspot-measure`.
- `redis_url` (string, optional): Redis address, to read server-side counters when the backend is Redis.

---

## Outputs

- `cache_effect_report` (object): Per hotspot: hit ratio (client side), repeat-ratio ceiling, server keyspace hit ratio, endpoint p50, p95 and p99 before and after, database calls per second before and after, cache error rate, and every command with its raw output.

---

## Phase 1: Repeat the Baseline Conditions

### Entry Criteria
- The cache change is deployed to the same environment the baseline used.
- `baseline_metrics` contains the load command, concurrency, duration and target.

### Actions
1. Use the SAME command, concurrency, duration, target URL and environment as the baseline. Copy it from `baseline_metrics`; do not retype it from memory. Changing any of them makes the comparison invalid.
2. Warm-up decision: the baseline measured steady state. Run the load once to warm the cache, discard that run, then run the measured pass. Record both runs; the cold run shows the miss-path cost after a deploy or flush.
3. Reset server-side counters at the start of the measured pass:
   - Redis: `redis-cli -u <redis_url> CONFIG RESETSTAT` (resets `keyspace_hits`, `keyspace_misses`, `evicted_keys` and other INFO stats). Do this only on an instance where resetting stats is acceptable; otherwise take readings before and after and subtract.
   - Postgres: `SELECT pg_stat_statements_reset();` if the baseline used it.

### Output
Measured pass run with identical parameters.

### Quality Gate
- The load command string in this run equals the baseline command string (compare with `diff` or exact string compare).
- Warm-up and measured runs are both recorded.

---

## Phase 2: Collect the Numbers

### Entry Criteria
- Measured pass complete.

### Actions
1. Endpoint latency: copy p50, p95, p99 from the load tool output (hey: the "Latency distribution" lines; k6: the `http_req_duration` line with `p(95)`; wrk with `--latency`: the "Latency Distribution" block).
2. Client hit ratio: run the hit ratio PromQL from `cache_metrics` over the measured window (use `[<duration>]` equal to the run length, evaluated at the run's end time).
3. Server hit ratio (Redis): `redis-cli -u <redis_url> INFO stats | grep -E "keyspace_(hits|misses)"`. `keyspace_hits / (keyspace_hits + keyspace_misses)`. This counts every read command on the instance (lock checks, other services), so it differs from the client ratio; report both.
4. Database load: `SELECT calls, total_exec_time FROM pg_stat_statements WHERE queryid = <id>;` and divide calls by run seconds.
5. Cache errors: the error-rate PromQL from `cache_metrics`. A non-zero error rate means some "improvement" may be fail-open fallbacks; report it.

### Output
Raw numbers with commands.

### Quality Gate
- Every number has its command and raw output saved next to it.
- The client hit ratio query used a window equal to the run length.

---

## Phase 3: Compare and Report

### Entry Criteria
- Numbers collected.

### Actions
1. Compare client hit ratio with the hotspot's `repeat_ratio` from the baseline. The repeat ratio is the ceiling for an unbounded cache with no expiry. If the hit ratio is much lower, the usual causes, in order to check: TTL shorter than the typical gap between repeats; evictions (`evicted_keys` rising, see the memory flows); a key that includes a per-request value (check `key_schema`); invalidation deleting more often than data changes.
2. Latency: report before and after for each percentile. A cache can improve p50 while p99 stays the same, because p99 is dominated by misses; say so when it happens rather than reporting only p50.
3. Repeat the measured pass at least once more and report both runs. If two runs differ by more than the before-and-after difference, the result is noise; report it as inconclusive.
4. Write `cache_effect_report` with a one-line verdict per hotspot: `improved`, `no change`, `worse`, or `inconclusive`, each tied to the numbers.
5. Do not claim an improvement from a run that was not executed, or from a different load command.

### Output
`cache_effect_report`.

### Quality Gate
- Every verdict cites before and after numbers from the same command.
- Hit ratio is reported next to the repeat-ratio ceiling for each hotspot.
- Two measured runs are recorded per hotspot.

---

## Worked Example

Illustrative. Hotspot product by id, baseline `k6 run --vus 20 --duration 60s --summary-trend-stats "avg,p(50),p(95),p(99)" replay_products.js` replaying logged ids, repeat_ratio 0.955, baseline p50 9.4 ms, p95 21.0 ms, p99 38.8 ms, database 6,870 calls per second.

Phase 1: same command; warm-up run discarded; `CONFIG RESETSTAT` before the measured run.

Phase 2: run 1: p50 1.9 ms, p95 3.4 ms, p99 24.1 ms. Client hit ratio 0.941. Redis `keyspace_hits:1129400 keyspace_misses:71900` gives 0.940. Database 405 calls per second. Error rate 0.

Phase 3: hit ratio 0.941 against ceiling 0.955. p99 improved less than p50 because misses still pay the database time. Run 2: p50 2.0 ms, p99 25.3 ms. Verdict: `improved`.

---

## Exit Criteria

DONE when every hotspot has before and after numbers from identical commands over equal windows, two measured runs, hit ratio against its ceiling, and a verdict tied to the numbers.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Baseline command not recorded | **Stop**: re-run the baseline without the cache (feature flag off) using a recorded command; comparison needs it. |
| Phase 1 | Environment differs from baseline (different data size, instance type) | **Stop**: report the comparison as invalid. |
| Phase 2 | Cache error rate above zero | **Adjust**: report it and check the error logs; part of the traffic is falling back to the database. |
| Phase 3 | Runs disagree more than the effect size | **Return**: report `inconclusive` with both runs. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

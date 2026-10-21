# Cache Read Hotspot Measure

**One-line description:** Finds the reads that repeat often enough and cost enough to be worth caching, using pg_stat_statements, MySQL performance_schema digests or HTTP access logs, and records a baseline latency and repeat ratio for each one before any cache code is written.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the application repository.
- `read_source` (string, required): Where reads can be counted. One of `postgres`, `mysql`, `http-access-log`, `app-log`. For `http-access-log` and `app-log`, include the log file path after a colon, for example `http-access-log:/var/log/nginx/access.log`.
- `db_engine` (string, optional): Database engine and major version, for example `postgres 16` or `mysql 8.0`. Needed to pick the right column names.

---

## Outputs

- `read_hotspots` (object[]): One row per candidate read: fingerprint (normalized query or route), calls in the window, mean and total time, distinct keys seen, repeat ratio, and the code location that issues it.
- `baseline_metrics` (object): The pre-cache numbers for each hotspot: request p50, p95 and p99 latency, throughput, database calls per second, and the exact command and window used to collect them, so the after-cache measurement can repeat it.

---

## Phase 1: Collect Read Counts

### Entry Criteria
- `read_source` is one of the four allowed values.
- You can run queries against the database or read the log file.

### Actions
1. Pick the collection procedure from this table. Do only the row that matches `read_source`.

   | `read_source` | Procedure |
   |---|---|
   | `postgres` | Confirm the extension: `psql -c "SELECT extname FROM pg_extension WHERE extname='pg_stat_statements';"`. If no row, stop and ask the operator: it needs `shared_preload_libraries = 'pg_stat_statements'` in postgresql.conf, a restart, then `CREATE EXTENSION pg_stat_statements;`. |
   | `mysql` | Confirm `SELECT @@performance_schema;` returns 1. The digest table is `performance_schema.events_statements_summary_by_digest`. |
   | `http-access-log` | Confirm the log format. For the nginx default `combined` format, the request path is field 7 when split on spaces. |
   | `app-log` | Confirm each read logs a stable identifier (query name or route) and the lookup key. If it does not, go to Phase 1 Action 5. |

2. Reset counters at the start of the window so the numbers cover a known period. Postgres: `SELECT pg_stat_statements_reset();`. MySQL: `TRUNCATE TABLE performance_schema.events_statements_summary_by_digest;`. Record the reset time.
3. Let normal production or staging traffic run. The window length is a user decision; record it. Do not generate synthetic traffic for this step, because synthetic traffic has the wrong key distribution.
4. Pull the top reads by total time:
   - Postgres 13 and later: `SELECT queryid, calls, round(total_exec_time::numeric,1) AS total_ms, round(mean_exec_time::numeric,2) AS mean_ms, rows, left(query,120) FROM pg_stat_statements WHERE query ILIKE 'select%' ORDER BY total_exec_time DESC LIMIT 25;`
   - Postgres 12 and earlier: the columns are `total_time` and `mean_time` instead.
   - MySQL: `SELECT COUNT_STAR, ROUND(SUM_TIMER_WAIT/1e9,1) AS total_ms, ROUND(AVG_TIMER_WAIT/1e9,2) AS mean_ms, LEFT(DIGEST_TEXT,120) FROM performance_schema.events_statements_summary_by_digest WHERE DIGEST_TEXT LIKE 'SELECT%' ORDER BY SUM_TIMER_WAIT DESC LIMIT 25;` (timer columns are picoseconds; dividing by 1e9 gives milliseconds).
   - nginx log: `awk '$6=="\"GET" {print $7}' access.log | sed 's/?.*//' | sort | uniq -c | sort -rn | head -25`.
5. If no source gives per-key counts, add one temporary log line at the read call site that prints the fingerprint and the lookup key. Change one file only. Keep it behind an environment flag and remove it at the end of Phase 2.

### Output
A ranked list of read fingerprints with call counts and time per call.

### Quality Gate
- The reset time and the window end time are both recorded.
- The ranked list has a call count and a mean time for every row, copied from the query output, not estimated.

---

## Phase 2: Compute Repeat Ratio

### Entry Criteria
- Ranked list exists.

### Actions
1. For each of the top rows, get the number of distinct lookup keys in the same window. Postgres and MySQL digests normalize parameters away, so take keys from the app log line (Action 5 of Phase 1) or from `log_min_duration_statement = 0` output for a short window. Setting it to 0 logs every statement and adds load; turn it back to the previous value afterward and record both values.
2. Compute `repeat_ratio = 1 - distinct_keys / calls`. This is the hit ratio an unbounded cache with no expiry would reach over the window. It is the upper bound for any real cache on this read.
3. Find the code location for each fingerprint: `grep -rn "<distinctive fragment of the SQL or route>" <repo_path>`. Record file and line.
4. Remove the temporary log line from Phase 1, if you added one, and run the test suite once to confirm nothing else changed.

### Output
Rows with calls, distinct keys, repeat ratio and code location.

### Quality Gate
- Every row has `repeat_ratio` computed from two measured numbers.
- `git diff --stat` shows no leftover temporary logging.

---

## Phase 3: Record Baseline

### Entry Criteria
- Rows with repeat ratio exist.

### Actions
1. Select hotspots: keep rows where both the repeat ratio and the total time are high relative to the other rows. Rank by `total_time * repeat_ratio`, which estimates the database time an ideal cache would remove. Do not apply a fixed cutoff; list them in this order and let the user pick how many to keep.
2. For each kept hotspot, record endpoint latency with the same load tool that will be used after caching. The load must replay the real key distribution: hitting one URL over and over (for example `hey -z 60s -c 20 https://staging.example.com/products/42`) makes any later cache look perfect. Extract the keys seen in the window from the log into a file and replay them with k6: a script that reads the file with `open()` in the init context and requests a random line per iteration, run as `k6 run --vus 20 --duration 60s replay_products.js`. Copy `http_req_duration` p(50), p(95) and p(99) from the summary; to see p(50) and p(99) set `--summary-trend-stats "avg,p(50),p(95),p(99)"`. Virtual users and duration are user inputs; record them.
3. If metrics are in Prometheus, also record `histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket{route="/products/:id"}[5m])))` and save the query text with the result. The metric name depends on your instrumentation library; check what your `/metrics` endpoint exposes.
4. Write `read_hotspots` and `baseline_metrics`.

### Output
`read_hotspots`, `baseline_metrics`.

### Quality Gate
- `baseline_metrics` stores the exact command line, concurrency, duration and target URL for every number.
- Every hotspot in `read_hotspots` has a code location that exists: `git ls-files <file>` prints it.

---

## Worked Example

Illustrative. `read_source` = `postgres`, `db_engine` = `postgres 16`.

Phase 1: after `SELECT pg_stat_statements_reset();` at 09:00 and a 2 hour window:

```
 queryid  | calls  | total_ms | mean_ms | left
 -7731... | 412300 | 618450.0 |    1.50 | SELECT id, name, price FROM products WHERE id = $1
  2210... |   9100 | 455000.0 |   50.00 | SELECT category_id, count(*) FROM products GROUP BY 1
```

Phase 2: app log shows 18,400 distinct product ids for 412,300 calls, so repeat_ratio = 1 - 18400/412300 = 0.955. The category count query has 1 distinct key, repeat_ratio = 0.9999. Code locations: `app/catalog/repo.py:41`, `app/catalog/stats.py:12`.

Phase 3: `k6 run --vus 20 --duration 60s --summary-trend-stats "avg,p(50),p(95),p(99)" replay_products.js` (replaying the 412,300 logged product ids) prints `http_req_duration: avg=11.2ms p(50)=9.4ms p(95)=21ms p(99)=38.8ms`. Both rows go into `read_hotspots` ranked by total_ms times repeat_ratio: product by id first (618,450 x 0.955 = 590,620), category counts second (455,000 x 0.9999 = 454,955). The slow query is not the top row; rank by the product, not by mean time.

---

## Exit Criteria

DONE when every hotspot has measured calls, distinct keys, repeat ratio, code location and a baseline latency recorded with a repeatable command.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | pg_stat_statements not installed and no restart allowed | **Adjust**: use `read_source` = `app-log` with a temporary log line instead. |
| Phase 1 | Column `total_exec_time` does not exist | **Adjust**: the server is Postgres 12 or earlier; use `total_time` and `mean_time`. |
| Phase 2 | Distinct keys cannot be obtained | **Return**: mark repeat_ratio as unknown for that row; do not guess it. |
| Phase 3 | Staging has no realistic data volume | **Stop**: a baseline on an empty database is meaningless; ask for a staging snapshot or a production read-only window. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

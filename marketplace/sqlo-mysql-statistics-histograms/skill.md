# MySQL InnoDB Statistics and Histograms

**One-line description:** Traces MySQL row estimate errors to InnoDB persistent statistics (sample pages, auto recalculation), index dive limits, or missing column histograms, and fixes them with `ANALYZE TABLE`, `STATS_SAMPLE_PAGES`, or `ANALYZE TABLE ... UPDATE HISTOGRAM`, proving the fix with new EXPLAIN estimates.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tuning_scope` (object, required): From `sqlo-baseline-scope`.
- `plan_findings` (object[], required): From `sqlo-mysql-explain-analyze-read`. Uses findings `estimate_error` and `index_not_chosen`.

---

## Outputs

- `stats_actions` (object[]): Per finding: the cause, the statement that fixed it, estimates before and after, and any table option that must reach migrations.

---

## Phase 1: Diagnose

### Entry Criteria
- `tuning_scope.db_engine` == `mysql`.
- At least one `estimate_error` or `index_not_chosen` finding; otherwise emit empty `stats_actions` and stop.

### Actions
1. Read the settings: `SELECT @@innodb_stats_persistent, @@innodb_stats_auto_recalc, @@innodb_stats_persistent_sample_pages, @@eq_range_index_dive_limit;` (defaults ON, ON, 20, 200).
2. Read stored statistics:
```
SELECT database_name, table_name, last_update, n_rows, clustered_index_size
FROM mysql.innodb_table_stats WHERE table_name = 'products';
SELECT index_name, stat_name, stat_value, sample_size, stat_description
FROM mysql.innodb_index_stats WHERE table_name = 'products' AND stat_name LIKE 'n_diff_pfx%';
```
   `n_diff_pfx01` is the estimated distinct count of the first index column, `n_diff_pfx02` of the first two, and so on. Compare with `SELECT COUNT(DISTINCT category_id) FROM products;` on a copy.
3. Read the table option: `SHOW CREATE TABLE products;` and look for `STATS_SAMPLE_PAGES` or `STATS_PERSISTENT`.
4. Check existing histograms: `SELECT SCHEMA_NAME, TABLE_NAME, COLUMN_NAME, JSON_EXTRACT(HISTOGRAM,'$."histogram-type"') AS type, JSON_EXTRACT(HISTOGRAM,'$."last-updated"') AS updated FROM information_schema.COLUMN_STATISTICS;`
5. Classify:

| Evidence | Cause |
|---|---|
| `last_update` old and many rows changed since (auto recalc fires after about 10 percent of rows change) | `stale` |
| `n_diff_pfx` far from the real distinct count | `sample_too_small` |
| Predicate is on a column with no index, estimate is off (the optimizer assumes a fixed selectivity without a histogram) | `no_histogram` |
| `IN (...)` list longer than `eq_range_index_dive_limit`, estimate is off | `dive_limit_exceeded` (statistics used instead of dives) |
| Indexed column with heavily skewed values | `skew_on_indexed_column` (index dives handle equality; histograms are not used for indexed columns that can be dived) |

### Output
A cause per finding.

### Quality Gate
- Each cause cites the `innodb_table_stats`, `innodb_index_stats` or `COLUMN_STATISTICS` values that support it.
- The real distinct count used for comparison was measured, not assumed.

---

## Phase 2: Apply the Fix

### Entry Criteria
- Every finding has a cause.

### Actions
1. Apply only the fix for the cause:

| Cause | Fix |
|---|---|
| `stale` | `ANALYZE TABLE products;` |
| `sample_too_small` | `ALTER TABLE products STATS_SAMPLE_PAGES = N;` then `ANALYZE TABLE products;`. N is chosen with the user; raise in steps until `n_diff_pfx` stops moving toward the real count. |
| `no_histogram` | `ANALYZE TABLE products UPDATE HISTOGRAM ON price, status WITH N BUCKETS;` (MySQL 8.0; N default 100, maximum 1024). |
| `dive_limit_exceeded` | split the IN list in the application, or raise `eq_range_index_dive_limit` for that session only after measuring the extra planning time |
| `skew_on_indexed_column` | confirm dives are happening (`IN` list short); if the estimate is still wrong pass to `sqlo-sargable-rewrite` |

2. `ANALYZE TABLE` on InnoDB takes a read lock briefly. On older releases it also flushed the table from the table definition cache, so new queries showed `Waiting for table flush` behind any long-running query on that table (check your version's release notes; later 8.0 releases removed the flush). Before running it, check `SHOW PROCESSLIST;` for long statements on the table, run it at a quiet time on `production_primary`, and get user approval.
3. `ALTER TABLE ... STATS_SAMPLE_PAGES` is a metadata-only change on 8.0, but it still takes a metadata lock. Set `SET SESSION lock_wait_timeout = <user value>;` before it.
4. Histograms are not updated automatically. Record the command so it can be scheduled, and to remove one use `ANALYZE TABLE products DROP HISTOGRAM ON price;`.

### Output
Fix statements executed.

### Quality Gate
- `mysql.innodb_table_stats.last_update` is later than the fix time for each analyzed table.
- Each created histogram appears in `information_schema.COLUMN_STATISTICS`.

---

## Phase 3: Prove It

### Entry Criteria
- Phase 2 complete.

### Actions
1. Rerun the EXPLAIN and EXPLAIN ANALYZE from `plan_findings`. Record `rows`, `filtered`, and actual rows for the same table line.
2. Record whether `key` changed. If the plan changed, send the query back through `sqlo-mysql-explain-analyze-read`.
3. Record in `stats_actions` every table option and histogram that must be repeated in other environments.

### Output
`stats_actions`.

### Quality Gate
- Each entry has before and after estimates and the actual row count from EXPLAIN ANALYZE.
- Entries where the estimate did not move toward actual are marked `not_fixed`.

---

## Worked Example

Illustrative only.

Input finding: `estimate_error` on `products`, `category_id = 42`, estimated 23,380 after filter, actual 311; `index_not_chosen` for `idx_category`.

Phase 1: `n_diff_pfx01` for `idx_category` = 90; real `COUNT(DISTINCT category_id)` = 1,840. `sample_size` = 20 pages. Cause: `sample_too_small`.

Phase 2:
```
SET SESSION lock_wait_timeout = 5;
ALTER TABLE products STATS_SAMPLE_PAGES = 200;
ANALYZE TABLE products;
```
(200 and 5 chosen with the user.) After: `n_diff_pfx01` = 1,712.

Phase 3: EXPLAIN now shows `type: ref, key: idx_category, rows: 1144`. Plan changed, so the query returns to the EXPLAIN reading flow. `stats_actions` records `STATS_SAMPLE_PAGES = 200` for the migration.

---

## Exit Criteria

DONE when every estimate finding has a cause, an applied fix, and before and after EXPLAIN numbers.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `mysql.innodb_table_stats` not readable | **Adjust**: request SELECT on the `mysql` schema, or use `SHOW INDEX FROM products;` (`Cardinality` column). |
| Phase 1 | `innodb_stats_persistent` = OFF | **Adjust**: statistics are transient and recomputed often; record that fixes may not persist and ask the user about enabling it. |
| Phase 2 | `ANALYZE TABLE` waits | **Retry**: at a quieter time; check `SHOW PROCESSLIST` for long statements on the table first. |
| Phase 3 | Estimate unchanged | **Return**: mark `not_fixed` and pass to `sqlo-sargable-rewrite`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

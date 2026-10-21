# PostgreSQL Planner Statistics Repair

**One-line description:** Traces each PostgreSQL row estimate error back to its cause in `pg_stats` (stale statistics, too small a sample, correlated columns, or an expression the planner cannot estimate) and fixes it with `ANALYZE`, a per-column statistics target, or `CREATE STATISTICS`, proving the fix with a new estimate.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tuning_scope` (object, required): From `sqlo-baseline-scope`.
- `plan_findings` (object[], required): From `sqlo-pg-explain-analyze-read`. Only findings of type `estimate_error` are used.

---

## Outputs

- `stats_actions` (object[]): Per estimate error: the cause, the SQL that fixed it, the estimate before and after, and whether the fix needs a permanent setting.

---

## Phase 1: Diagnose the Cause

### Entry Criteria
- `tuning_scope.db_engine` == `postgresql`.
- At least one `estimate_error` finding. If none, emit an empty `stats_actions` and stop.

### Actions
1. For each table in the finding, check freshness:
```
SELECT relname, n_live_tup, n_mod_since_analyze, last_analyze, last_autoanalyze
FROM pg_stat_user_tables WHERE relname = 'orders';
```
   Autoanalyze triggers when `n_mod_since_analyze` exceeds `autovacuum_analyze_threshold` (default 50) plus `autovacuum_analyze_scale_factor` (default 0.1) times the row count. Compute that trigger point and record it.
2. For each column in the mis-estimated predicate:
```
SELECT attname, null_frac, n_distinct, most_common_vals, most_common_freqs, correlation
FROM pg_stats WHERE tablename = 'orders' AND attname IN ('customer_id','status');
```
   `n_distinct` negative means a fraction of rows (for example -0.5 means distinct values are half the row count).
3. Classify with this table:

| Evidence | Cause |
|---|---|
| `last_analyze` and `last_autoanalyze` are old or NULL, or `n_mod_since_analyze` is large | `stale` |
| The predicate value is not in `most_common_vals` and the column is skewed (a few values hold most rows) | `sample_too_small` |
| Each column's estimate is right alone but the AND of two columns is wrong (estimate equals product of selectivities) | `correlated_columns` |
| Predicate wraps the column in a function or expression (`lower(email)`, `(data->>'k')`, `date(ts)`) | `expression_unestimated` |
| Server was upgraded with `pg_upgrade` and has not been analyzed since | `stale` (statistics do not carry over before PostgreSQL 18) |

4. Check the AND case directly: run `EXPLAIN SELECT 1 FROM orders WHERE customer_id = 8812;`, then with `status = 'shipped'` alone, then both. If the combined estimate is close to the product of the single-column selectivities but the real count is far off, the cause is `correlated_columns`.

### Output
A cause per estimate error.

### Quality Gate
- Each cause cites the `pg_stats` or `pg_stat_user_tables` values that support it.
- For `correlated_columns`, the three EXPLAIN estimates (A alone, B alone, both) are recorded.

---

## Phase 2: Apply the Fix

### Entry Criteria
- Each estimate error has a cause.

### Actions
1. Apply only the fix for the recorded cause:

| Cause | Fix |
|---|---|
| `stale` | `ANALYZE VERBOSE orders;` After a major upgrade: `vacuumdb --all --analyze-in-stages`. If it recurs, set per-table `ALTER TABLE orders SET (autovacuum_analyze_scale_factor = X);` with X derived from the table's change rate and agreed with the user. |
| `sample_too_small` | `ALTER TABLE orders ALTER COLUMN customer_id SET STATISTICS N;` then `ANALYZE orders;`. N ranges up to 10000; the default comes from `default_statistics_target` (default 100). Raise in steps and stop when the estimate stops improving. Higher N makes ANALYZE and planning slower. |
| `correlated_columns` | `CREATE STATISTICS orders_cust_status (dependencies, mcv) ON customer_id, status FROM orders;` then `ANALYZE orders;`. `mcv` needs PostgreSQL 12 or later; `dependencies` and `ndistinct` exist from 10. Use `ndistinct` when the error is in GROUP BY row counts. |
| `expression_unestimated` | Either create an expression index (it collects statistics on the expression after ANALYZE), or on PostgreSQL 14 and later `CREATE STATISTICS orders_lower_email ON (lower(email)) FROM orders;` then `ANALYZE`. |

2. Run each statement individually. Do not change `default_statistics_target` globally to fix one column.
3. On `production_primary`, `ANALYZE` is allowed (it takes a SHARE UPDATE EXCLUSIVE lock and does not block reads or writes), but `CREATE STATISTICS` and `ALTER TABLE ... SET STATISTICS` are DDL; get user approval first and set `SET lock_timeout = '<user value>';` before running them.

### Output
Fix statements executed.

### Quality Gate
- `SELECT stxname, stxkind FROM pg_statistic_ext WHERE stxrelid = 'orders'::regclass;` lists any statistics object created.
- `pg_stat_user_tables.last_analyze` for each fixed table is later than the fix time.

---

## Phase 3: Prove the Estimate Improved

### Entry Criteria
- Phase 2 complete.

### Actions
1. Rerun the exact EXPLAIN ANALYZE from `plan_findings` and record estimate vs actual rows on the same node.
2. Record whether the plan shape changed (different join method or scan type). A changed shape goes back through `sqlo-pg-explain-analyze-read`.
3. Record any permanent settings (statistics targets, extended statistics, per-table autovacuum settings) in `stats_actions` so the change reaches migrations and other environments.

### Output
`stats_actions`.

### Quality Gate
- Each entry has estimate before, estimate after, and actual rows from EXPLAIN ANALYZE output.
- An entry whose estimate did not move closer to actual is marked `not_fixed`, not claimed as fixed.

---

## Worked Example

Illustrative only.

Input finding: `estimate_error` on orders, `customer_id = 8812 AND status = 'shipped'`, estimated 101, actual 3,912.

Phase 1: `last_autoanalyze` 2 hours ago and `n_mod_since_analyze` below the computed trigger point (not stale). `pg_stats` for `status` lists all 6 values in `most_common_vals`, with `shipped` at frequency 0.0245 (a short transitional state). Estimates: customer_id alone 4,120 (actual 4,301); status alone 1.0M (actual 1.01M); both 101, which equals 4,120 x 0.0245. Real count for both is 3,912: this customer's orders are mostly in `shipped` because it is a wholesaler with long transit times. Cause: `correlated_columns`.

Phase 2:
```
CREATE STATISTICS orders_cust_status (dependencies, mcv) ON customer_id, status FROM orders;
ANALYZE orders;
```
Phase 3: estimate moved from 101 to 3,640; actual 3,912. Plan shape unchanged. `stats_actions` records the statistics object for the migration.

---

## Exit Criteria

DONE when every estimate error has a cause, an applied fix, and before and after estimates from real EXPLAIN output.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `pg_stats` returns no row for the column | **Adjust**: the table was never analyzed or the role lacks access to it; run `ANALYZE` on a copy or request `SELECT` on the table. |
| Phase 2 | `CREATE STATISTICS` blocked by lock | **Retry**: with `lock_timeout` set, retry at a quieter time; do not remove the timeout. |
| Phase 3 | Estimate still far off | **Return**: mark `not_fixed`, pass to `sqlo-sargable-rewrite` (the predicate may be unestimable as written). |
| Phase 3 | Plan got slower after better estimates | **Stop**: report it; this exposes a cost setting issue (for example `random_page_cost`) that needs user review. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

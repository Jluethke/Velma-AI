# ETL Source-to-Target Reconciliation

**One-line description:** Proves the target matches the source for a closed time window by comparing per-day row counts and exact numeric sums with the same bounds and time zone on both sides, then narrows any mismatch to bucket and key level with DuckDB anti-joins over exported key lists, including detection of hard deletes the pipeline missed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_connection` (object, required): Read-only source connection.
- `data_contract` (object, required): Output of `etl-target-schema-contract` (key, partition or event date column, numeric columns, delete mode).
- `project_dir` (string, required): Repository root; queries go in `<project_dir>/sql/reconcile/`.

---

## Outputs

- `reconciliation_queries` (string): Path to `sql/reconcile/<table>_source.sql`, `<table>_target.sql`, and `<table>_keys.sql`.
- `reconciliation_report` (object): Window, per-day source count, target count, source sum, target sum, difference, and for mismatched days the missing keys, extra keys, and changed keys (first values from the query output, with totals).

---

## Phase 1: Fix the Window and Aggregates

### Entry Criteria
- At least one load has completed for the window.

### Actions
1. Choose a CLOSED window that the pipeline should have fully loaded: its end must be earlier than the last committed watermark minus the late-data lookback. Reconciling an open window reports false mismatches.
2. Bucket by the same calendar on both sides. Convert to UTC before taking the date: Postgres `(event_ts AT TIME ZONE 'UTC')::date`, Snowflake `TO_DATE(CONVERT_TIMEZONE('UTC', event_ts))`, BigQuery `DATE(event_ts, 'UTC')`, MySQL `DATE(CONVERT_TZ(event_ts, @@session.time_zone, '+00:00'))` (requires time zone tables loaded for named zones).
3. Write the source query `sql/reconcile/orders_source.sql`:
   ```sql
   SELECT (order_ts AT TIME ZONE 'UTC')::date AS d,
          COUNT(*) AS n,
          SUM(amount) AS amount_sum
   FROM sales.orders
   WHERE order_ts >= :win_start AND order_ts < :win_end
   GROUP BY 1 ORDER BY 1;
   ```
   and the same shape for the target in `orders_target.sql`. Same column, same filter, same bounds.
4. Compare counts and exact DECIMAL sums only. Do NOT compare hash aggregates across different engines (`md5`, `HASH_AGG`, `FARM_FINGERPRINT` differ per engine and per text formatting); use hashes only when both sides run on the same engine. Never sum floats for equality.
5. Exclude rows the pipeline deliberately filters (for example test accounts) on the SOURCE side with the same predicate the transform uses, written out, so the comparison is like for like.

### Output
Both queries.

### Quality Gate
- `diff <(grep -v '^--' orders_source.sql | sed 's/sales.orders/X/') <(grep -v '^--' orders_target.sql | sed 's/analytics.fct_orders/X/')` shows only the time-zone function differences for the two dialects (proves the predicates match).

---

## Phase 2: Compare per Day

### Entry Criteria
- Queries written.

### Actions
1. Run both and save as CSV: for example `psql "$SOURCE_DSN" -v win_start="'2026-10-01'" -v win_end="'2026-10-15'" --csv -f orders_source.sql > src.csv` (psql variables are referenced as `:win_start` in the file), and the warehouse CLI equivalent for the target.
2. Join in DuckDB:
   ```bash
   duckdb -c "
   SELECT COALESCE(s.d, t.d) AS d, s.n AS src_n, t.n AS tgt_n, s.n - t.n AS diff_n,
          s.amount_sum AS src_sum, t.amount_sum AS tgt_sum
   FROM read_csv('src.csv') s FULL OUTER JOIN read_csv('tgt.csv') t ON s.d = t.d
   WHERE s.n IS DISTINCT FROM t.n OR s.amount_sum IS DISTINCT FROM t.amount_sum
   ORDER BY 1;"
   ```
3. Zero rows printed means the window reconciles. Any row is a mismatch day for Phase 3.

### Output
Mismatch day list.

### Quality Gate
- The DuckDB command output is saved to `reconcile/<run>.txt`; zero result rows or a list of days with differences.

---

## Phase 3: Narrow to Keys

### Entry Criteria
- At least one mismatch day. If none, write the report and finish.

### Actions
1. For each mismatch day export keys plus a per-row fingerprint computed IN THE SAME TOOL for both sides: export `key, amount, status, updated_at` to Parquet or CSV from each side, then fingerprint both inside DuckDB so the hash function is identical.
2. Find differences:
   ```sql
   -- in duckdb
   CREATE TABLE s AS SELECT *, md5(concat_ws('|', order_id, amount, status, updated_at)) AS h FROM read_parquet('src_keys.parquet');
   CREATE TABLE t AS SELECT *, md5(concat_ws('|', order_id, amount, status, updated_at)) AS h FROM read_parquet('tgt_keys.parquet');
   SELECT 'missing_in_target' k, COUNT(*) FROM s ANTI JOIN t USING (order_id)
   UNION ALL SELECT 'extra_in_target', COUNT(*) FROM t ANTI JOIN s USING (order_id)
   UNION ALL SELECT 'changed', COUNT(*) FROM s JOIN t USING (order_id) WHERE s.h <> t.h;
   ```
   Normalize types before hashing (cast decimals to the same scale, timestamps to UTC text with the same precision) or every row shows as changed.
3. Interpret with this table:
   | Pattern | Likely cause | Route to |
   |---|---|---|
   | `extra_in_target` only | hard deletes not captured | key discovery (delete mode) or CDC flows |
   | `missing_in_target` with recent `updated_at` | rows later than the lookback | late data policy |
   | `missing_in_target` scattered | watermark gap (long transactions, `>` instead of `>=`) | watermark extract |
   | `changed` | update missed or transform difference | extract overlap or transform tests |
4. Write `reconciliation_report`. Do not "fix" the target by hand in this flow.

### Output
`reconciliation_report`.

### Quality Gate
- The three counts in the report sum to at least the absolute row-count difference from Phase 2 for each day.

---

## Worked Example

Illustrative. Window 2026-10-01 to 2026-10-15.
```
d          | src_n | tgt_n | diff_n | src_sum    | tgt_sum
2026-10-09 | 61204 | 61219 |    -15 | 4419020.15 | 4420101.65
```
Phase 3:
```
missing_in_target  0
extra_in_target   15
changed            0
```
15 orders exist in the target but not the source: hard deletes from the nightly purge. Routed to key discovery; the table's `delete_mode` becomes `hard_delete` with CDC recommended.

---

## Exit Criteria

DONE when a closed window has per-day counts and sums compared on matching predicates, and every mismatch day is explained by key-level counts with a routed cause.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Window overlaps the lookback | **Adjust**: move the window end earlier. |
| Phase 2 | Every day mismatches by a similar small amount | **Adjust**: date bucketing differs (time zone); align both sides to UTC. |
| Phase 3 | Every key shows as changed | **Adjust**: normalize types and text formatting before hashing. |
| Phase 3 | Key exports too large for the machine | **Adjust**: split by `order_id % <buckets>` on both sides and compare bucket by bucket. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

# ETL Source Profile with SQL

**One-line description:** Profiles each source table with read-only SQL aggregate queries (row count, per-column null count, distinct count, min/max, length range) so every later design decision about keys, types and watermarks rests on measured facts instead of column names.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_connection` (object, required): Engine (`postgres`, `mysql`, `sqlserver`, `snowflake`, `bigquery`, `duckdb`), host or account, database, schema, and a READ-ONLY user. For flat files, use `duckdb` with the file glob as the "table".
- `source_tables` (string[], required): Fully qualified table names (or DuckDB file globs such as `'landing/orders/*.parquet'`) to profile.

---

## Outputs

- `source_profile` (object[]): One record per table: `table`, `row_count`, `profiled_at`, `engine`, and per column `name`, `declared_type`, `null_count`, `distinct_count` (exact or approximate, labeled), `min`, `max`, `min_length`, `max_length` for text, plus the exact SQL text that produced each number.

---

## Phase 1: Connect Read-Only and List Columns

### Entry Criteria
- `source_connection` names a user with SELECT only. If the user can write, stop: profiling must never run with write grants against a production source.
- `source_tables` is non-empty.

### Actions
1. Open a session and confirm the engine version, so later syntax choices are correct:
   - Postgres: `SELECT version();`
   - MySQL: `SELECT VERSION();`
   - SQL Server: `SELECT @@VERSION;`
   - Snowflake: `SELECT CURRENT_VERSION();`
   - DuckDB: `SELECT version();`
2. For each table, read the declared columns from the catalog. Do NOT guess columns from a sample row.
   - Postgres, MySQL, SQL Server, Snowflake: `SELECT column_name, data_type, is_nullable, ordinal_position FROM information_schema.columns WHERE table_schema = '<schema>' AND table_name = '<table>' ORDER BY ordinal_position;` (Snowflake stores unquoted names in upper case; compare in upper case.)
   - BigQuery: `SELECT column_name, data_type, is_nullable FROM `<project>.<dataset>`.INFORMATION_SCHEMA.COLUMNS WHERE table_name = '<table>' ORDER BY ordinal_position;`
   - DuckDB over files: `DESCRIBE SELECT * FROM read_parquet('<glob>');` or `DESCRIBE SELECT * FROM read_csv('<glob>');`
3. Before scanning a large table, get the planner's size estimate so you know whether an exact scan is safe:
   - Postgres: `SELECT reltuples::bigint FROM pg_class WHERE oid = '<schema>.<table>'::regclass;`
   - MySQL: `SELECT table_rows FROM information_schema.tables WHERE table_schema='<schema>' AND table_name='<table>';` (an estimate for InnoDB)
   - Snowflake: `SELECT row_count FROM information_schema.tables WHERE table_name = '<TABLE>';`
   - BigQuery: `SELECT row_count FROM `<project>.<dataset>`.__TABLES__ WHERE table_id = '<table>';`
4. Record the estimate. Ask the user for a scan size limit if none is given; do not pick one yourself.

### Output
Column list and size estimate per table.

### Quality Gate
- Each table has a column list returned by an `information_schema` or `DESCRIBE` query, with the query text saved.
- The session user was confirmed read-only (for Postgres: `SELECT has_table_privilege('<table>', 'INSERT');` returns `false`).

---

## Phase 2: Run Aggregate Profile Queries

### Entry Criteria
- Column list exists for every table.

### Actions
1. Generate ONE aggregate query per table, one expression set per column. Template (Postgres, MySQL, Snowflake, DuckDB):
   ```sql
   SELECT
     COUNT(*)                         AS row_count,
     COUNT(*) - COUNT(order_id)       AS order_id_nulls,
     COUNT(DISTINCT order_id)         AS order_id_distinct,
     MIN(order_id)                    AS order_id_min,
     MAX(order_id)                    AS order_id_max,
     COUNT(*) - COUNT(updated_at)     AS updated_at_nulls,
     MIN(updated_at)                  AS updated_at_min,
     MAX(updated_at)                  AS updated_at_max,
     MIN(LENGTH(status))              AS status_min_len,
     MAX(LENGTH(status))              AS status_max_len
   FROM sales.orders;
   ```
2. Engine-specific substitutions (use these, do not invent others):
   - SQL Server: `LEN(...)` instead of `LENGTH(...)`; `COUNT_BIG(*)` for very large tables.
   - BigQuery: `APPROX_COUNT_DISTINCT(col)` for approximate distinct; exact `COUNT(DISTINCT col)` is allowed but scans the full column (billed bytes).
   - Snowflake: `APPROX_COUNT_DISTINCT(col)` (HyperLogLog).
   - DuckDB: `SUMMARIZE SELECT * FROM read_parquet('<glob>');` returns min, max, approx_unique, null_percentage per column in one call.
   - Postgres: no built-in approximate distinct; for a quick estimate read `n_distinct` and `null_frac` from `pg_stats` after `ANALYZE`, and label it "planner statistic".
3. If the size estimate exceeds the user's scan limit, profile a sample and LABEL it as a sample:
   - Postgres: `FROM sales.orders TABLESAMPLE SYSTEM (<percent>)`
   - Snowflake: `FROM orders SAMPLE (<percent>)`
   - BigQuery: `FROM dataset.orders TABLESAMPLE SYSTEM (<percent> PERCENT)`
   Distinct counts on a sample cannot prove uniqueness; mark key candidates from samples as "unproven".
4. For every text column whose name suggests a date or number (`*_date`, `*_at`, `amount`, `qty`), run a cast-failure count so stringly typed data is caught now:
   - Postgres: `SELECT COUNT(*) FROM t WHERE col IS NOT NULL AND col !~ '^\d{4}-\d{2}-\d{2}';`
   - Snowflake / BigQuery / SQL Server / DuckDB: `SELECT COUNT(*) FROM t WHERE col IS NOT NULL AND TRY_CAST(col AS DATE) IS NULL;` (BigQuery uses `SAFE_CAST`.)
5. Run each query once. Save the query text next to its result in `source_profile`.

### Output
Raw aggregate results per table.

### Quality Gate
- Every column in the Phase 1 list has `null_count` and a distinct count (exact or labeled approximate/sample/planner statistic).
- `row_count` equals `COUNT(*)` from the query, not the planner estimate.

---

## Phase 3: Assemble the Profile and Flag Findings

### Entry Criteria
- Aggregates collected.

### Actions
1. Build `source_profile` records. For each column compute `null_rate = null_count / row_count` and `distinct_rate = distinct_count / row_count` from the measured numbers only.
2. Flag findings with these fixed rules (no thresholds invented; every rule is exact):
   | Measured fact | Flag |
   |---|---|
   | `distinct_count == row_count` and `null_count == 0` (exact count) | `key_candidate` |
   | `null_count == row_count` | `always_null` |
   | `distinct_count == 1` | `constant` |
   | declared type is text and Phase 2 step 4 found zero cast failures | `stringly_typed` |
   | declared type is text and step 4 found cast failures | `mixed_format` with the failing count |
   | `max` of a timestamp column is later than `profiled_at` | `future_timestamps` |
3. Do NOT drop or "clean" anything here. Profiling describes; later flows decide.

### Output
`source_profile`.

### Quality Gate
- Every flag in `source_profile` points to a numeric field that justifies it.
- `source_profile` contains the SQL text for every number.

---

## Worked Example

Illustrative. Input: `source_connection` = Postgres 16 read-only user `etl_ro`, `source_tables` = `["sales.orders"]`.

Phase 1:
```
$ psql "host=db1 dbname=shop user=etl_ro" -c "SELECT has_table_privilege('sales.orders','INSERT');"
 has_table_privilege
---------------------
 f
$ psql ... -c "SELECT reltuples::bigint FROM pg_class WHERE oid='sales.orders'::regclass;"
 reltuples
-----------
   4812233
```
Phase 2 aggregate query returns:
```
 row_count | order_id_nulls | order_id_distinct | updated_at_nulls | updated_at_min      | updated_at_max
-----------+----------------+-------------------+------------------+---------------------+---------------------
   4812240 |              0 |           4812240 |             1180 | 2019-03-02 08:11:04 | 2026-10-20 09:14:51
```
Phase 3 flags: `order_id` = `key_candidate`; `updated_at` has 1180 nulls (passed to the watermark discovery flow as a risk). `source_profile` stores both queries.

---

## Exit Criteria

DONE when every table in `source_tables` has a `source_profile` record whose numbers each trace to a saved SQL query, and every flag follows the Phase 3 table.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Profiling user has INSERT/UPDATE grants | **Stop**: request a read-only user; never profile production with a write-capable login. |
| Phase 1 | Table not found in `information_schema` | **Return**: report the exact name tried; check case (Snowflake upper case, Postgres folds unquoted names to lower case). |
| Phase 2 | Query times out or hits a statement timeout | **Adjust**: switch to the engine's sample clause and label results as sample; do not raise the server timeout. |
| Phase 2 | BigQuery estimate of bytes billed is above what the user approved (`bq query --dry_run`) | **Stop**: ask the user before running. |
| Phase 3 | A number has no saved query | **Retry**: rerun the query and save its text; never type a number from memory. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

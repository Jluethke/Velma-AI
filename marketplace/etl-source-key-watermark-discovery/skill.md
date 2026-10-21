# ETL Source Key and Watermark Discovery

**One-line description:** Proves the business key of each source table with duplicate-detection SQL, tests whether a candidate change column (`updated_at`, rowversion, sequence) is safe to use as an incremental watermark, and records how deletes appear in the source.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_connection` (object, required): Read-only connection to the source database (same object used by `etl-source-profile-sql`).
- `source_profile` (object[], required): Output of `etl-source-profile-sql`, including `key_candidate` flags and timestamp min/max.

---

## Outputs

- `extraction_keys` (object[]): One record per table: `primary_key` (column list, proven unique), `watermark_column` or `null`, `watermark_type` (`timestamp`, `rowversion`, `monotonic_id`, `none`), `watermark_nullable_rows` (count), `delete_mode` (`soft_delete_column`, `hard_delete`, `unknown`), `recommended_extract_mode` (`watermark`, `cdc`, `full_snapshot`), and the SQL evidence for each field.

---

## Phase 1: Prove the Key

### Entry Criteria
- `source_profile` exists for every table.

### Actions
1. Read the declared primary key first; never assume a column named `id` is the key.
   - Postgres: `SELECT a.attname FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE i.indrelid = '<schema>.<table>'::regclass AND i.indisprimary;`
   - MySQL / SQL Server / Snowflake: `SELECT kcu.column_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_name = kcu.table_name WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = '<table>';` (Snowflake does not enforce PRIMARY KEY; treat it as a hint and run step 2.)
   - BigQuery: primary keys are declared `NOT ENFORCED`; always run step 2.
2. Prove uniqueness by query. This is the only acceptable proof:
   ```sql
   SELECT <key_cols>, COUNT(*) AS n
   FROM <table>
   GROUP BY <key_cols>
   HAVING COUNT(*) > 1
   ORDER BY n DESC
   LIMIT 20;
   ```
   Also run `SELECT COUNT(*) FROM <table> WHERE <each key col> IS NULL;`
3. Apply this table:
   | Duplicate query rows | Null key rows | Result |
   |---|---|---|
   | 0 | 0 | `primary_key` proven |
   | 0 | > 0 | Not a key; nulls break merge matching. Try a composite key or report. |
   | > 0 | any | Not a key; add the next column suggested by the user or the schema (for example `line_number`) and rerun step 2. |
4. Never fall back to "hash of all columns" as a key without telling the user: it makes every update look like a new row.

### Output
Proven `primary_key` per table, or a reported failure.

### Quality Gate
- The duplicate query and null query for the final key both returned zero rows/zero count, with the query text saved.

---

## Phase 2: Test the Watermark Candidate

### Entry Criteria
- `primary_key` proven.

### Actions
1. List candidate columns in this priority order, using only columns that exist: SQL Server `rowversion`/`timestamp` type column; a column populated by trigger or by the database default on every UPDATE (confirm by reading the trigger: Postgres `SELECT tgname, pg_get_triggerdef(oid) FROM pg_trigger WHERE tgrelid = '<schema>.<table>'::regclass;`, MySQL `SHOW CREATE TABLE <table>;` and look for `ON UPDATE CURRENT_TIMESTAMP`); an application-maintained `updated_at`; an insert-only monotonic id (only for append-only tables).
2. Count nulls in the candidate: `SELECT COUNT(*) FROM <table> WHERE <col> IS NULL;`. Nulls are rows that a `col > last_watermark` predicate never selects.
3. Test whether updates move the column. Ask the user for one recent known update, or compare two reads:
   ```sql
   -- read A, save results
   SELECT <pk>, <col> FROM <table> ORDER BY <col> DESC LIMIT 50;
   -- read B, some time later, same query; any row whose business columns changed but <col> did not is a violation
   ```
   If the application updates rows through a path that skips `updated_at` (bulk SQL fixes, admin tools), the column is unsafe. Ask the user; do not assume.
4. Check precision and time zone of the column type: Postgres `timestamp` vs `timestamptz`, MySQL `DATETIME` vs `TIMESTAMP` (the latter converts to UTC using the session `time_zone`), SQL Server `datetime` (rounded to .000/.003/.007 seconds) vs `datetime2`. Record the type; the extract flow uses it to set a lookback.
5. Decide the watermark with this table:
   | Evidence | `watermark_type` | `recommended_extract_mode` |
   |---|---|---|
   | rowversion column present | `rowversion` | `watermark` |
   | DB-maintained timestamp, zero nulls, updates move it | `timestamp` | `watermark` |
   | App-maintained timestamp, nulls > 0 or a write path skips it | `none` | `cdc` if the DB supports logical replication/binlog, else `full_snapshot` |
   | Append-only table, monotonic id | `monotonic_id` | `watermark` |
   | No candidate | `none` | `cdc` or `full_snapshot` |

### Output
Watermark decision per table.

### Quality Gate
- Each chosen watermark has a saved null-count query showing its count, and the trigger/DDL text or user statement that proves updates move it.

---

## Phase 3: Classify Deletes

### Entry Criteria
- Watermark decision made.

### Actions
1. Look for a soft-delete column (`deleted_at`, `is_deleted`, `status = 'deleted'`) in the profile. If present, confirm its update also moves the watermark column.
2. If no soft-delete column exists, deletes are hard deletes. A watermark extract cannot see hard deletes. Record `delete_mode = hard_delete` and one of: use CDC, or run a periodic key-set comparison (anti-join of source keys against target keys).
3. Write `extraction_keys`.

### Output
`extraction_keys`.

### Quality Gate
- Every table has a non-empty `delete_mode`, and every `hard_delete` table has either `recommended_extract_mode = cdc` or a named key-set reconciliation.

---

## Worked Example

Illustrative. `sales.orders` on MySQL 8.0, profile flags `order_id` as `key_candidate`.

Phase 1:
```
mysql> SELECT order_id, COUNT(*) n FROM sales.orders GROUP BY order_id HAVING COUNT(*) > 1 LIMIT 20;
Empty set (3.41 sec)
```
Phase 2:
```
mysql> SHOW CREATE TABLE sales.orders\G
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
mysql> SELECT COUNT(*) FROM sales.orders WHERE updated_at IS NULL;
0
```
Phase 3: no soft-delete column; the user confirms orders are hard-deleted by a nightly purge job.

Result: `{"primary_key":["order_id"],"watermark_column":"updated_at","watermark_type":"timestamp","delete_mode":"hard_delete","recommended_extract_mode":"cdc"}`.

---

## Exit Criteria

DONE when every table has a proven key, a watermark decision backed by saved SQL evidence, and a delete mode with a stated way to capture deletes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No column combination is unique | **Return**: report duplicate examples to the user; the target must use an append model or a surrogate from the source owner. |
| Phase 2 | Cannot confirm updates move the timestamp | **Adjust**: set `watermark_type = none` and recommend CDC or full snapshot; do not trust the column name. |
| Phase 2 | User wants the watermark anyway | **Adjust**: record the risk in `extraction_keys` and require the reconciliation flow downstream. |
| Phase 3 | Purge jobs delete rows silently | **Adjust**: `delete_mode = hard_delete`, recommend CDC. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

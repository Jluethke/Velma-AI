# ETL CDC Merge Apply

**One-line description:** Applies a batch of landed Debezium change events to the target table with one SQL `MERGE`: keep only the last event per key by source log position, drop tombstones, delete on `op = 'd'`, upsert on `c`/`u`/`r`, and refuse to overwrite a newer row with an older event.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cdc_landing_table` (string, required): Table where the Kafka sink lands raw events, one row per event with the envelope fields flattened (`op`, `before`, `after` columns or flattened after-columns, `source_lsn` or `source_file`/`source_pos`, `ts_ms`, and a landing timestamp).
- `data_contract` (object, required): Output of `etl-target-schema-contract`.
- `extraction_keys` (object[], required): Output of `etl-source-key-watermark-discovery`; supplies `primary_key`.
- `project_dir` (string, required): Repository root; SQL goes in `<project_dir>/sql/cdc/`.

---

## Outputs

- `cdc_merge_sql` (string): Path to `sql/cdc/merge_<table>.sql`.
- `load_report` (object): For the batch: events read, events after dedup, rows inserted, updated, deleted, events skipped as stale, and the highest ordering key applied.

---

## Phase 1: Define the Event Order

### Entry Criteria
- `cdc_landing_table` exists and holds at least one batch.

### Actions
1. Choose the ordering column with this table. Never order by `ts_ms` alone: many events share a millisecond.
   | Source | Ordering expression |
   |---|---|
   | Debezium PostgreSQL | `source_lsn` (bigint), then the event's position in the transaction if landed |
   | Debezium MySQL | `(source_file, source_pos)`; binlog file names sort lexically because of zero-padded numbers, so compare the file then the position. Include `source_row` for multi-row events if landed. |
   | Debezium SQL Server | `source_change_lsn`, then `source_commit_lsn` |
2. Add an ordering column to the target to make merges order-safe: `ALTER TABLE <target> ADD COLUMN _cdc_order <type>;` (bigint for LSN; for MySQL store a sortable text like `lpad(file_number, 6, '0') || ':' || lpad(pos, 20, '0')`).
3. Confirm the landing table excludes tombstones or plan to filter them: `SELECT COUNT(*) FROM <landing> WHERE op IS NULL;`.

### Output
Ordering expression and target ordering column.

### Quality Gate
- `SELECT <pk>, <order expr>, COUNT(*) FROM <landing> GROUP BY 1, 2 HAVING COUNT(*) > 1;` returns zero rows (the ordering is unique per key); otherwise add the tie-breaker column.

---

## Phase 2: Write the MERGE

### Entry Criteria
- Ordering is unique per key.

### Actions
1. Write `sql/cdc/merge_orders.sql`. Portable form using a subquery (works on Snowflake, BigQuery, Databricks SQL, SQL Server, and PostgreSQL 15 and later, which added `MERGE`):
   ```sql
   MERGE INTO analytics.orders AS t
   USING (
     SELECT * FROM (
       SELECT l.*,
              ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY source_lsn DESC) AS rn
       FROM landing.orders_cdc l
       WHERE op IS NOT NULL
         AND _landed_at >= :batch_start AND _landed_at < :batch_end
     ) x WHERE rn = 1
   ) AS s
   ON t.order_id = s.order_id
   WHEN MATCHED AND s.op = 'd' AND (t._cdc_order IS NULL OR s.source_lsn > t._cdc_order) THEN
     DELETE
   WHEN MATCHED AND s.op IN ('c','u','r') AND (t._cdc_order IS NULL OR s.source_lsn > t._cdc_order) THEN
     UPDATE SET status = s.status, amount = s.amount, updated_at = s.updated_at,
                _cdc_order = s.source_lsn, _loaded_at = CURRENT_TIMESTAMP
   WHEN NOT MATCHED AND s.op IN ('c','u','r') THEN
     INSERT (order_id, status, amount, updated_at, _cdc_order, _loaded_at)
     VALUES (s.order_id, s.status, s.amount, s.updated_at, s.source_lsn, CURRENT_TIMESTAMP);
   ```
   Snowflake and Databricks may use `QUALIFY ROW_NUMBER() OVER (...) = 1` instead of the outer subquery; PostgreSQL and SQL Server do not support `QUALIFY`.
2. For a delete event, the key comes from `before` (Debezium puts the deleted row in `before`, `after` is null). Make the landing flatten `COALESCE(after.order_id, before.order_id)` into `order_id`, or the delete never matches.
3. Soft-delete instead of delete when `data_contract.delete_mode` asks for history: replace `DELETE` with `UPDATE SET is_deleted = TRUE, _cdc_order = s.source_lsn`.
4. Run the batch in one transaction. Record `batch_end` as the processed position only after commit.
5. Do not edit the landing table; it is the replay log.

### Output
`cdc_merge_sql`.

### Quality Gate
- The SQL parses: run it inside `BEGIN; ... ROLLBACK;` on a dev copy (Postgres/SQL Server/Snowflake), or `bq query --dry_run --use_legacy_sql=false < sql/cdc/merge_orders.sql` on BigQuery, with zero errors.

---

## Phase 3: Prove Order Safety and Idempotence

### Entry Criteria
- MERGE parses.

### Actions
1. On a dev copy, load a fixture batch for one key: `c` (lsn 10), `u` (lsn 20), `u` (lsn 30). Run the MERGE. The target row must reflect lsn 30.
2. Run the same MERGE again. Row counts and values must be unchanged.
3. Load a stale event `u` (lsn 25) as a new batch and run. The target must still reflect lsn 30, and the event counts as stale in `load_report`.
4. Load `d` (lsn 40) and run. The row must be gone (or `is_deleted = true`).
5. Compute `load_report` from the MERGE's returned counts (Snowflake returns `number of rows inserted/updated/deleted`; BigQuery reports DML stats in the job; Postgres returns `MERGE <n>` total) plus a pre-count of deduped events.

### Output
`load_report`.

### Quality Gate
- The four fixture checks give: value at lsn 30, unchanged on rerun, unchanged after stale event, row removed after delete. Save the query output for each.

---

## Worked Example

Illustrative. Snowflake, batch of 3 events for order 990001:
```
op | order_id | source_lsn | status
c  | 990001   | 2240117    | placed
u  | 990001   | 2240190    | shipped
d  | 990001   | 2240377    | (null, key from before)
```
Dedup keeps lsn 2240377 (`d`). Target had no row, so `WHEN NOT MATCHED AND op IN ('c','u','r')` does not fire and nothing is inserted: correct, the order was created and deleted inside one batch.
```
number of rows inserted | number of rows updated | number of rows deleted
                      0 |                      0 |                      0
```
Rerun: same zeros. `load_report`: `{"events":3,"deduped":1,"inserted":0,"updated":0,"deleted":0,"stale":0,"max_order":2240377}`.

---

## Exit Criteria

DONE when the MERGE dedups by log position, deletes on `d`, ignores stale events, and the four fixture checks pass on a dev copy.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Ordering ties within a key | **Adjust**: land and add the tie-breaker (`source_row`, transaction order) before writing the MERGE. |
| Phase 2 | Snowflake error about a duplicate source row matching the same target row | **Adjust**: the dedup subquery is missing or partitions by the wrong key; fix it, do not turn off `ERROR_ON_NONDETERMINISTIC_MERGE`. |
| Phase 2 | PostgreSQL older than 15 | **Adjust**: use `INSERT ... ON CONFLICT` for upserts plus a separate `DELETE ... USING` for `d` events, in one transaction. |
| Phase 3 | Stale event overwrote a newer row | **Stop**: the `_cdc_order` guard is missing from a `WHEN MATCHED` clause; fix before any production run. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

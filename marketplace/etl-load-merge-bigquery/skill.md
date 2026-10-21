# ETL Idempotent Load into BigQuery

**One-line description:** Loads a landed Parquet batch into BigQuery idempotently by choosing between a `MERGE` (keyed upsert) and a partition-decorator replace (`table$YYYYMMDD` with `bq load --replace`), deduplicating with `QUALIFY`, wrapping MERGE and watermark in a multi-statement transaction, and reading DML stats from the job.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `landing_location` (string, required): Output of `etl-extract-watermark-incremental`, copied to `gs://<bucket>/landing/<table>/run_id=<run_id>/`.
- `data_contract` (object, required): Output of `etl-target-schema-contract` (uses `primary_key`, `partition_column`).
- `extraction_keys` (object[], required): Supplies `primary_key`.
- `project_dir` (string, required): Repository root; SQL goes in `<project_dir>/sql/load/`.

---

## Outputs

- `load_sql` (string): Path to `sql/load/<table>_merge.sql` or the partition replace command file `sql/load/<table>_replace.sh`.
- `load_report` (object): Load job id, rows in staging, `insertedRowCount`, `updatedRowCount`, `deletedRowCount` from DML stats (or replaced partitions and their row counts), total bytes processed, new watermark.

---

## Phase 1: Choose the Write Strategy

### Entry Criteria
- `bq version` works and `gcloud config get-value project` prints the intended project.

### Actions
1. Pick the strategy with this table:
   | Condition | Strategy |
   |---|---|
   | Rows are updated in place by key (orders, customers) | `MERGE` |
   | Data is immutable per event date and each run recomputes whole dates (events, daily aggregates), and the target is partitioned by `partition_column` | Partition replace with `$YYYYMMDD` decorator |
   | Rows updated by key AND target partitioned by date | `MERGE` with a partition filter in `ON` (Phase 2 step 3) |
2. Never use `WRITE_APPEND` (the default for `bq load` without `--replace`) into the final table: a rerun duplicates rows.

### Output
Strategy recorded.

### Quality Gate
- `bq show --format=prettyjson analytics.orders | jq '.timePartitioning'` output is saved and agrees with the chosen strategy.

---

## Phase 2: Write the Load

### Entry Criteria
- Strategy chosen.

### Actions
1. Staging load (both strategies start here):
   ```bash
   bq load --source_format=PARQUET --replace \
     staging.stg_orders "gs://acme-landing/landing/orders/run_id=2026-10-20T0300/*.parquet"
   ```
   `--replace` truncates the staging table first, so reruns are safe.
2. MERGE strategy, `sql/load/orders_merge.sql`:
   ```sql
   BEGIN TRANSACTION;
   MERGE analytics.orders t
   USING (
     SELECT * FROM staging.stg_orders
     WHERE TRUE
     QUALIFY ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY updated_at DESC) = 1
   ) s
   ON t.order_id = s.order_id
   WHEN MATCHED AND TO_JSON_STRING(STRUCT(t.status, t.amount, t.updated_at))
                 != TO_JSON_STRING(STRUCT(s.status, s.amount, s.updated_at)) THEN
     UPDATE SET status = s.status, amount = s.amount, updated_at = s.updated_at,
                _loaded_at = CURRENT_TIMESTAMP()
   WHEN NOT MATCHED THEN
     INSERT (order_id, status, amount, updated_at, _loaded_at)
     VALUES (s.order_id, s.status, s.amount, s.updated_at, CURRENT_TIMESTAMP());
   UPDATE etl_state.watermarks
     SET last_watermark = @upper, last_run_id = @run_id, updated_at = CURRENT_TIMESTAMP()
     WHERE pipeline = @pipeline AND source_table = 'orders';
   COMMIT TRANSACTION;
   ```
   - `WHERE TRUE` keeps `QUALIFY` valid in every BigQuery version that requires a WHERE, GROUP BY or HAVING alongside it.
   - The `TO_JSON_STRING` comparison is null-safe; `!=` on raw nullable columns is not.
   - Without dedup, BigQuery fails with `UPDATE/MERGE must match at most one source row for each target row`.
   Run: `bq query --use_legacy_sql=false --parameter=upper:STRING:'...' --parameter=run_id:STRING:'...' --parameter=pipeline:STRING:'orders' < sql/load/orders_merge.sql`.
3. Partitioned MERGE: add a filter on the target partition column to the `ON` clause, for example `AND t.order_date BETWEEN @min_date AND @max_date`, with values computed from staging by the caller. Confirm pruning with `bq query --dry_run` and compare "bytes processed" with and without the filter. If bytes do not drop, pruning is not happening; check the BigQuery DML docs for which expressions prune.
4. Partition replace strategy, `sql/load/events_replace.sh`, one command per date in the run:
   ```bash
   bq query --use_legacy_sql=false --replace \
     --destination_table 'analytics.events$20261020' \
     "SELECT * FROM staging.stg_events WHERE event_date = '2026-10-20'"
   ```
   The `$YYYYMMDD` decorator plus `--replace` overwrites exactly that partition. Quote the table name in single quotes so the shell does not expand `$2026...`. Every row selected must belong to that date or the job fails.

### Output
`load_sql`.

### Quality Gate
- `bq query --dry_run --use_legacy_sql=false < sql/load/orders_merge.sql` (with parameters) prints a bytes-processed estimate and no error.

---

## Phase 3: Prove Idempotence and Read Stats

### Entry Criteria
- One successful run.

### Actions
1. Read DML stats: `bq show --format=prettyjson -j <job_id> | jq '.statistics.query.dmlStats'`. For a script, list child jobs with `bq ls -j --parent_job_id=<job_id>` and read the MERGE child.
2. Fingerprint the table: `SELECT COUNT(*), BIT_XOR(FARM_FINGERPRINT(TO_JSON_STRING(STRUCT(order_id, status, amount, updated_at)))) FROM analytics.orders;`.
3. Rerun Phase 2 for the same run id. DML stats must show 0 inserted and 0 updated; the fingerprint must match. For partition replace, row count per replaced partition must match (`SELECT event_date, COUNT(*) ... GROUP BY 1`).
4. Fill `load_report`.

### Output
`load_report`.

### Quality Gate
- Second-run `dmlStats` shows `insertedRowCount` and `updatedRowCount` equal to `"0"` (or absent), and fingerprints are equal.

---

## Worked Example

Illustrative.
```
$ bq load --source_format=PARQUET --replace staging.stg_orders "gs://acme-landing/landing/orders/run_id=2026-10-20T0300/*.parquet"
Waiting on bqjob_r1a2... (3s) Current status: DONE
$ bq show --format=prettyjson -j bqjob_r9f8... | jq '.statistics.query.dmlStats'
{ "insertedRowCount": "2210", "updatedRowCount": "15880" }
-- rerun
{ "insertedRowCount": "0", "updatedRowCount": "0" }
```

---

## Exit Criteria

DONE when the chosen strategy never appends to the final table, MERGE and watermark commit in one transaction (or each partition is replaced whole), and a rerun leaves the fingerprint unchanged.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Target not partitioned but partition replace chosen | **Adjust**: switch to MERGE, or recreate the table partitioned with the owner's approval. |
| Phase 2 | `must match at most one source row` | **Adjust**: fix the `QUALIFY` partition key to equal the MERGE key. |
| Phase 2 | Partition replace fails because rows fall outside the decorator date | **Adjust**: the WHERE filter does not match the partition column; fix the filter. |
| Phase 2 | Concurrent DML on the same table aborts the transaction | **Retry**: rerun the whole script; it is idempotent. |
| Phase 3 | Bytes processed equal a full table scan on every run | **Return**: report missing pruning to the owner with the dry-run numbers. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

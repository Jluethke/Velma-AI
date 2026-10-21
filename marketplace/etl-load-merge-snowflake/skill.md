# ETL Idempotent MERGE into Snowflake

**One-line description:** Loads a landed Parquet batch into Snowflake idempotently: `PUT` to a named stage, `COPY INTO` a transient staging table with `MATCH_BY_COLUMN_NAME`, deduplicate with `QUALIFY`, `MERGE` into the target, and advance the watermark in the same explicit transaction, while respecting COPY load history and DDL auto-commit.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `landing_location` (string, required): Output of `etl-extract-watermark-incremental`.
- `data_contract` (object, required): Output of `etl-target-schema-contract`.
- `extraction_keys` (object[], required): Supplies `primary_key`.
- `project_dir` (string, required): Repository root; SQL goes in `<project_dir>/sql/load/`.

---

## Outputs

- `load_sql` (string): Path to `sql/load/<table>_merge.sql` (the COPY, MERGE and watermark statements).
- `load_report` (object): Files loaded, rows parsed and loaded per file, rows after dedup, rows inserted and updated by the MERGE, new watermark.

---

## Phase 1: Stage and COPY

### Entry Criteria
- A role with USAGE on the warehouse, database and schema, CREATE STAGE/TABLE in the staging schema, and INSERT/UPDATE on the target.

### Actions
1. Create the objects ONCE, outside any load transaction (in Snowflake every DDL statement commits the open transaction implicitly, so DDL inside the load would break atomicity):
   ```sql
   CREATE FILE FORMAT IF NOT EXISTS staging.ff_parquet TYPE = PARQUET;
   CREATE STAGE IF NOT EXISTS staging.landing FILE_FORMAT = staging.ff_parquet;
   CREATE TRANSIENT TABLE IF NOT EXISTS staging.stg_orders LIKE analytics.orders;
   ```
2. Upload the run file to a run-scoped prefix: `snowsql -q "PUT file://landing/orders/run_id=2026-10-20T0300/part-000.parquet @staging.landing/orders/run_id=2026-10-20T0300/ AUTO_COMPRESS=FALSE"` (Parquet is already compressed).
3. Dry-run the COPY to catch type errors without loading: `COPY INTO staging.stg_orders FROM @staging.landing/orders/run_id=2026-10-20T0300/ MATCH_BY_COLUMN_NAME = CASE_INSENSITIVE VALIDATION_MODE = RETURN_ERRORS;`. Check the Snowflake docs for which `VALIDATION_MODE` values your file format and options support; if this combination is rejected, run the COPY in step 4 into an empty staging table and read its errors.
4. Real COPY:
   ```sql
   TRUNCATE TABLE staging.stg_orders;
   COPY INTO staging.stg_orders
   FROM @staging.landing/orders/run_id=2026-10-20T0300/
   MATCH_BY_COLUMN_NAME = CASE_INSENSITIVE
   ON_ERROR = ABORT_STATEMENT;
   ```
   `ABORT_STATEMENT` is the documented default for bulk COPY; write it explicitly so nobody changes it to `CONTINUE` to get a green run.
5. Load history: COPY skips files it already loaded into the same table (Snowflake keeps load metadata for 64 days), so a rerun after `DELETE FROM staging.stg_orders` loads 0 rows. `TRUNCATE TABLE` also clears the table's load metadata (per the Snowflake TRUNCATE docs), which is why step 4 truncates instead of deleting. If you cannot truncate, add `FORCE = TRUE`; that is safe here ONLY because the MERGE is idempotent.

### Output
Staging table filled for the run.

### Quality Gate
- COPY result rows show `status = LOADED` and `rows_loaded = rows_parsed` for every file; no row shows `LOAD_FAILED` or `PARTIALLY_LOADED`.

---

## Phase 2: MERGE and Watermark in One Transaction

### Entry Criteria
- Staging loaded.

### Actions
1. Write `sql/load/orders_merge.sql`:
   ```sql
   BEGIN;
   MERGE INTO analytics.orders t
   USING (
     SELECT * FROM staging.stg_orders
     QUALIFY ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY updated_at DESC) = 1
   ) s
   ON t.order_id = s.order_id
   WHEN MATCHED AND (t.status IS DISTINCT FROM s.status
                  OR t.amount IS DISTINCT FROM s.amount
                  OR t.updated_at IS DISTINCT FROM s.updated_at) THEN
     UPDATE SET status = s.status, amount = s.amount, updated_at = s.updated_at,
                _loaded_at = CURRENT_TIMESTAMP()
   WHEN NOT MATCHED THEN
     INSERT (order_id, status, amount, updated_at, _loaded_at)
     VALUES (s.order_id, s.status, s.amount, s.updated_at, CURRENT_TIMESTAMP());
   UPDATE etl_state.watermarks
     SET last_watermark = :upper, last_run_id = :run_id, updated_at = CURRENT_TIMESTAMP()
     WHERE pipeline = :pipeline AND source_table = 'orders';
   COMMIT;
   ```
2. Keep `ERROR_ON_NONDETERMINISTIC_MERGE` at its default `TRUE`. If the MERGE fails with a nondeterministic-merge error, the dedup is wrong; fix the `QUALIFY`, do not change the parameter.
3. For large targets add a pruning predicate in the `ON` clause only when the target is clustered by that column and the batch's range is known, for example `AND t.order_date >= :min_order_date`. Never add a predicate that can exclude a real match.
4. Run with snowsql: `snowsql -c etl -f sql/load/orders_merge.sql -D upper='...' -D run_id='...' -o variable_substitution=true` and use `&upper` style variables in the file (snowsql substitution syntax), or run through the Python connector with bind parameters. Check your client's docs for its bind syntax; do not mix them.

### Output
`load_sql`.

### Quality Gate
- MERGE result shows `number of rows inserted` and `number of rows updated`, and `SELECT last_run_id FROM etl_state.watermarks WHERE source_table='orders';` equals the run id.

---

## Phase 3: Prove Idempotence

### Entry Criteria
- One successful run.

### Actions
1. Record `SELECT COUNT(*), HASH_AGG(order_id, status, amount, updated_at) FROM analytics.orders;`.
2. Rerun Phases 1 and 2 for the same run id (the TRUNCATE in Phase 1 lets the same file load again). The MERGE must report 0 inserted and 0 updated, and the `HASH_AGG` must match.
3. Fill `load_report` from the COPY and MERGE result sets (`SELECT * FROM TABLE(RESULT_SCAN(LAST_QUERY_ID()));` right after each statement).

### Output
`load_report`.

### Quality Gate
- Rerun MERGE reports `0 | 0` and `HASH_AGG` values are equal.

---

## Worked Example

Illustrative.
```
COPY INTO staging.stg_orders FROM @staging.landing/orders/run_id=2026-10-20T0300/ ...
file                                     | status | rows_parsed | rows_loaded
orders/run_id=2026-10-20T0300/part-000.parquet | LOADED | 18234 | 18234

MERGE INTO analytics.orders ...
number of rows inserted | number of rows updated
                   2210 |                  15880
-- rerun of the same run id
number of rows inserted | number of rows updated
                      0 |                      0
```

---

## Exit Criteria

DONE when COPY loads every file fully, the MERGE and watermark update commit together, and a rerun of the same run id inserts and updates nothing.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | COPY reports `Copy executed with 0 files processed` on a first load | **Adjust**: the stage path or prefix is wrong; `LIST @staging.landing/orders/;` and fix the path. |
| Phase 1 | Column type errors in COPY | **Return**: the file disagrees with the contract; fix the extract schema, never set `ON_ERROR = CONTINUE`. |
| Phase 2 | Nondeterministic merge error | **Adjust**: fix the `QUALIFY` partition and order columns. |
| Phase 2 | Transaction committed early | **Adjust**: a DDL statement ran between `BEGIN` and `COMMIT`; move it to Phase 1 setup. |
| Phase 3 | Rerun updates rows | **Adjust**: a compared column changes every load; remove it from the `WHEN MATCHED` condition. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

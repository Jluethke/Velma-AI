# ETL Idempotent Upsert into PostgreSQL

**One-line description:** Loads a landed Parquet batch into PostgreSQL idempotently: COPY into a temporary staging table with psycopg 3, deduplicate with `DISTINCT ON`, upsert with `INSERT ... ON CONFLICT DO UPDATE ... WHERE ... IS DISTINCT FROM`, and advance the watermark in the same transaction.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `landing_location` (string, required): Output of `etl-extract-watermark-incremental`: run-scoped Parquet path and the state table name.
- `data_contract` (object, required): Output of `etl-target-schema-contract`.
- `extraction_keys` (object[], required): Supplies `primary_key` and `watermark_column`.
- `project_dir` (string, required): Repository root; code goes in `<project_dir>/pipelines/load/`.

---

## Outputs

- `load_sql` (string): Path to `pipelines/load/<table>_upsert.sql` and the loader module `pipelines/load/<table>_load.py`.
- `load_report` (object): `run_id`, staged rows, rows after dedup, rows inserted, rows updated, rows unchanged, new watermark.

---

## Phase 1: Prepare the Target

### Entry Criteria
- Target table exists with the contract's columns, including `_loaded_at`.

### Actions
1. `ON CONFLICT (cols)` needs a unique index or constraint on exactly those columns. Check:
   ```sql
   SELECT indexname, indexdef FROM pg_indexes
   WHERE schemaname = 'analytics' AND tablename = 'orders' AND indexdef ILIKE '%UNIQUE%';
   ```
2. If missing, create it without blocking writers: `CREATE UNIQUE INDEX CONCURRENTLY orders_order_id_uq ON analytics.orders (order_id);`. `CONCURRENTLY` cannot run inside a transaction block; run it alone. If it fails it leaves an INVALID index: find it with `SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;`, drop it, fix duplicates, retry.
3. Do not add the index by "cleaning" duplicates silently. Duplicates in the target mean an earlier load was not idempotent; report them.

### Output
Unique index present.

### Quality Gate
- The `pg_indexes` query returns a UNIQUE index on exactly `primary_key`.

---

## Phase 2: Write the Load

### Entry Criteria
- Unique index present.

### Actions
1. Write `pipelines/load/orders_upsert.sql`:
   ```sql
   -- run inside one transaction
   CREATE TEMP TABLE stg_orders (LIKE analytics.orders INCLUDING DEFAULTS) ON COMMIT DROP;
   -- (COPY into stg_orders happens here, from Python)
   INSERT INTO analytics.orders AS t (order_id, status, amount, updated_at, _loaded_at)
   SELECT DISTINCT ON (order_id) order_id, status, amount, updated_at, now()
   FROM stg_orders
   ORDER BY order_id, updated_at DESC
   ON CONFLICT (order_id) DO UPDATE
     SET status = EXCLUDED.status, amount = EXCLUDED.amount,
         updated_at = EXCLUDED.updated_at, _loaded_at = EXCLUDED._loaded_at
     WHERE (t.status, t.amount, t.updated_at)
           IS DISTINCT FROM (EXCLUDED.status, EXCLUDED.amount, EXCLUDED.updated_at)
   RETURNING (xmax = 0) AS inserted;
   ```
   - `DISTINCT ON` is required: without it, two staged rows with the same key raise `ON CONFLICT DO UPDATE command cannot affect row a second time`.
   - The `WHERE ... IS DISTINCT FROM` skips no-op updates, which otherwise write a new row version and create dead tuples for vacuum on every overlapping rerun.
   - `RETURNING (xmax = 0)` is a widely used PostgreSQL idiom: true for inserted rows, false for updated ones. It relies on internals; treat counts as diagnostic, not as a contract.
2. Write `pipelines/load/orders_load.py` with psycopg 3, in ONE transaction:
   ```python
   with psycopg.connect(os.environ["TARGET_DSN"]) as conn, conn.transaction():
       cur = conn.cursor()
       cur.execute(CREATE_TEMP_SQL)
       with cur.copy("COPY stg_orders (order_id, status, amount, updated_at) FROM STDIN") as cp:
           for batch in pq.ParquetFile(path).iter_batches(batch_size=BATCH):
               for row in zip(*(batch.column(c).to_pylist() for c in COLS)):
                   cp.write_row(row)
       flags = cur.execute(UPSERT_SQL).fetchall()
       cur.execute(
           "UPDATE etl_state.watermarks SET last_watermark=%s, last_run_id=%s, updated_at=now() "
           "WHERE pipeline=%s AND source_table=%s",
           (upper, run_id, PIPELINE, TABLE))
   ```
   The watermark update is inside the same transaction: either the data and the watermark both commit, or neither does.
3. `BATCH` is a user-supplied number; do not pick one.
4. Do NOT use `TRUNCATE` on the target, `DELETE` without a key predicate, or `autocommit=True` in this loader.

### Output
`load_sql`.

### Quality Gate
- `python -m py_compile pipelines/load/orders_load.py` exits 0.
- `grep -n "autocommit" pipelines/load/orders_load.py` returns nothing.

---

## Phase 3: Prove Idempotence

### Entry Criteria
- Loader compiles.

### Actions
1. On a dev database, load a run file. Record `SELECT COUNT(*), md5(string_agg(t::text, ',' ORDER BY order_id)) FROM (SELECT order_id, status, amount, updated_at FROM analytics.orders) t;`.
2. Load the SAME run file again. Run the same query. Count and md5 must match; inserted and updated counts in the second report must both be 0.
3. Inject a failure after COPY (raise an exception in a test) and confirm `etl_state.watermarks.last_run_id` did not change.
4. Fill `load_report`.

### Output
`load_report`.

### Quality Gate
- Second-run report shows `inserted = 0` and `updated = 0`, and the checksum query output is identical for both runs.

---

## Worked Example

Illustrative.
```
$ python -m pipelines.load.orders_load --run-id 2026-10-20T0300
{"staged": 18234, "deduped": 18101, "inserted": 2210, "updated": 15880, "unchanged": 11, "watermark": "2026-10-20 03:00:02.418211"}
$ python -m pipelines.load.orders_load --run-id 2026-10-20T0300
{"staged": 18234, "deduped": 18101, "inserted": 0, "updated": 0, "unchanged": 18101, "watermark": "2026-10-20 03:00:02.418211"}
```
`deduped` is lower than `staged` because the 5 minute overlap re-read 133 rows. `unchanged` = deduped minus returned rows.

---

## Exit Criteria

DONE when the loader commits data and watermark atomically, a repeated load changes nothing, and an injected failure leaves the watermark untouched.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `CREATE UNIQUE INDEX CONCURRENTLY` fails on duplicates | **Return**: report duplicate keys to the owner; drop the INVALID index. |
| Phase 2 | `cannot affect row a second time` | **Adjust**: add or fix the `DISTINCT ON` ordering. |
| Phase 2 | `there is no unique or exclusion constraint matching the ON CONFLICT specification` | **Adjust**: the conflict column list does not match the unique index; make them identical. |
| Phase 3 | Second run updates rows | **Adjust**: a column differs on every load (for example a load timestamp in the compare list); remove it from the `IS DISTINCT FROM` tuple. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

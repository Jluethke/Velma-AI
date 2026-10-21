# ETL Watermark Incremental Extract

**One-line description:** Implements a high-watermark incremental extract in Python (SQLAlchemy plus PyArrow) that reads a bounded window `[last_watermark - overlap, upper_bound)`, writes one Parquet file per run to a run-scoped landing path, and advances the stored watermark only after the downstream load commits.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_connection` (object, required): Read-only source connection; the extract reads `SOURCE_DSN` from the environment, never from code.
- `extraction_keys` (object[], required): Output of `etl-source-key-watermark-discovery`; supplies `watermark_column`, `watermark_type`, `primary_key`.
- `late_data_policy` (object, required): Output of `etl-late-arriving-data-policy`; supplies `watermark_overlap`.
- `project_dir` (string, required): Pipeline repository root.

---

## Outputs

- `extract_job` (string): Path of the extract module, `<project_dir>/pipelines/extract/<table>_extract.py`, plus its test file.
- `landing_location` (string): Landing path pattern, `landing/<table>/run_id=<run_id>/part-000.parquet`, and the state table name `etl_state.watermarks`.

---

## Phase 1: Create the State Table

### Entry Criteria
- `extraction_keys.watermark_type` is `timestamp`, `rowversion` or `monotonic_id`. If it is `none`, stop: this flow does not apply.

### Actions
1. Create the state table in the TARGET (or a pipeline metadata database), never in the source:
   ```sql
   CREATE SCHEMA IF NOT EXISTS etl_state;
   CREATE TABLE IF NOT EXISTS etl_state.watermarks (
     pipeline       text        NOT NULL,
     source_table   text        NOT NULL,
     last_watermark text        NOT NULL,
     last_run_id    text        NOT NULL,
     updated_at     timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (pipeline, source_table)
   );
   ```
   Store the watermark as text in ISO 8601 with full fractional seconds, or as the decimal string of a rowversion/id, so no precision is lost by a driver.
2. Seed the first row with the user's chosen start (for a first full load use the minimum from `source_profile`). Do not seed with "now"; that skips history.

### Output
State table with one seeded row per source table.

### Quality Gate
- `SELECT * FROM etl_state.watermarks WHERE pipeline = '<name>';` returns one row per source table.

---

## Phase 2: Write the Extract

### Entry Criteria
- State table seeded.

### Actions
1. Edit ONE file: `pipelines/extract/<table>_extract.py`. The extract does exactly these steps in this order:
   1. Read `last_watermark` from `etl_state.watermarks`.
   2. Read the upper bound FROM THE SOURCE clock, once, at start: Postgres `SELECT clock_timestamp()`, MySQL `SELECT NOW(6)`, SQL Server `SELECT SYSUTCDATETIME()`. For a rowversion source use `SELECT MIN_ACTIVE_ROWVERSION()` (SQL Server), which excludes rows in uncommitted transactions. Never use the extractor machine's clock.
   3. Query the bounded window with bind parameters:
      ```python
      sql = text(f"""
          SELECT {cols} FROM {table}
          WHERE {wm} >= :lower AND {wm} < :upper
          ORDER BY {wm}, {pk}
      """)
      params = {"lower": last_wm - overlap, "upper": upper}
      ```
      `>=` on the lower bound plus overlap re-reads boundary rows (safe with idempotent merges); `<` on the upper bound with an upper bound captured once prevents rows written during the extract from being half-read.
   4. Stream rows: `conn.execution_options(stream_results=True, yield_per=<batch size from user>)` and write with `pyarrow.parquet.ParquetWriter(path, schema)`; declare the PyArrow schema explicitly from `data_contract` so an all-null batch does not get type `null`.
   5. Write to `landing/<table>/run_id=<run_id>/part-000.parquet` where `run_id` is passed in by the orchestrator. Write to a temp name and rename at the end so a crash never leaves a partial file under the final name.
   6. Print a JSON line: `{"run_id":..., "lower":..., "upper":..., "rows":...}`.
2. The extract does NOT update `etl_state.watermarks`. The load step updates it to `upper` inside the load transaction (Postgres) or right after the load commits (other warehouses). Advancing it before the load commits loses data on a failed load.
3. Postgres sources: long open transactions can commit rows with an `updated_at` earlier than an upper bound you already passed. Check before the run: `SELECT now() - min(xact_start) FROM pg_stat_activity WHERE state <> 'idle';`. If this age is larger than `watermark_overlap`, report it; the overlap is too small.
4. Do NOT add filtering, renaming or business logic here. Extract copies; transforms change.

### Output
`extract_job` source file.

### Quality Gate
- `python -m py_compile pipelines/extract/<table>_extract.py` exits 0.
- `grep -n "datetime.now\|time.time" pipelines/extract/<table>_extract.py` returns nothing (no local clock used for bounds).

---

## Phase 3: Test the Window Logic

### Entry Criteria
- Extract compiles.

### Actions
1. Write `tests/test_<table>_extract.py` with pytest against a disposable database (a Docker container such as `docker run --rm -e POSTGRES_PASSWORD=x -p 55432:5432 postgres:16`, or the `testcontainers` package). Cases:
   - Row with `updated_at == lower` is extracted.
   - Row with `updated_at == upper` is NOT extracted (it belongs to the next run).
   - Running the extract twice with the same state produces identical row sets.
   - A failure after extract and before load leaves `last_watermark` unchanged.
2. Run `pytest -q tests/test_<table>_extract.py`. Do not delete or skip a failing case to get green.
3. Run once against the real source with the user's approval and record the JSON line.

### Output
`landing_location` with a real run file.

### Quality Gate
- `pytest -q` prints `4 passed` (or more) and `0 failed`.
- `python -c "import pyarrow.parquet as pq; print(pq.read_metadata('<file>').num_rows)"` equals `rows` in the JSON line.

---

## Worked Example

Illustrative. `sales.orders`, watermark `updated_at` (MySQL `TIMESTAMP(6)`), overlap 5 minutes from `late_data_policy`.

```
$ python -m pipelines.extract.orders_extract --run-id 2026-10-20T0300
{"run_id": "2026-10-20T0300", "lower": "2026-10-20 01:55:00.000000", "upper": "2026-10-20 03:00:02.418211", "rows": 18234}
$ python -c "import pyarrow.parquet as pq; print(pq.read_metadata('landing/orders/run_id=2026-10-20T0300/part-000.parquet').num_rows)"
18234
$ pytest -q tests/test_orders_extract.py
....                                                         [100%]
4 passed in 6.12s
```

---

## Exit Criteria

DONE when the extract reads a bounded window using the source clock, lands one Parquet file per run, leaves the watermark to the load step, and its boundary tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `watermark_type` is `none` | **Stop**: use the CDC flows or a full snapshot instead. |
| Phase 2 | Driver returns timestamps without fractional seconds | **Adjust**: select the column cast to text in ISO format and parse it explicitly. |
| Phase 2 | Oldest open transaction older than the overlap | **Return**: report to the user to widen `watermark_overlap` in `late_data_policy`. |
| Phase 3 | Boundary test fails | **Retry**: fix the predicate (`>=` lower, `<` upper); never change the test expectation. |
| Phase 3 | File row count differs from printed count | **Stop**: the writer is dropping a batch; do not run the load. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

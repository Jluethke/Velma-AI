# ETL Partition Overwrite with Delta replaceWhere

**One-line description:** Loads a batch into a Delta Lake table (Databricks or open-source Spark with delta-spark) by atomically overwriting exactly the date range the batch recomputes with `replaceWhere`, proving from `DESCRIBE HISTORY` that only the intended range changed, and guarding against the default overwrite that replaces the whole table.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `landing_location` (string, required): Output of `etl-extract-watermark-incremental` (Parquet files in cloud storage reachable by the cluster).
- `data_contract` (object, required): Output of `etl-target-schema-contract`; must have a `partition_column` of type DATE.
- `project_dir` (string, required): Repository root; code goes in `<project_dir>/jobs/`.

---

## Outputs

- `load_code` (string): Path to `jobs/<table>_load.py` (PySpark).
- `load_report` (object): Table version written, `replaceWhere` predicate, `operationMetrics` from history (`numOutputRows`, `numRemovedFiles`, `numAddedFiles`), and per-date row counts before and after.

---

## Phase 1: Confirm Table Layout and Range

### Entry Criteria
- The target exists as a Delta table: `DESCRIBE DETAIL analytics.events` returns `format = delta`.

### Actions
1. Read the layout: `DESCRIBE DETAIL analytics.events` (columns `partitionColumns`, `numFiles`, `location`). Tables using liquid clustering show clustering columns instead; `replaceWhere` works on any column predicate, but the check below still applies.
2. Compute the date range from the batch, never from the run date alone:
   ```python
   rng = batch_df.agg(F.min("event_date").alias("lo"), F.max("event_date").alias("hi")).first()
   ```
3. Widen the range to the reprocess window from the late-data policy if the run recomputes a lookback; the job must then read ALL source rows for those dates, not just the new batch. If it reads only the new batch, `replaceWhere` deletes the older rows of those dates. This is the most common data-loss bug with partition overwrite.

### Output
Date range `[lo, hi]` and confirmation that the input covers all rows for it.

### Quality Gate
- The job's input query has a filter on the same `[lo, hi]` range over the full source history, visible in the code.

---

## Phase 2: Write the Overwrite

### Entry Criteria
- Range computed.

### Actions
1. Write `jobs/events_load.py`:
   ```python
   predicate = f"event_date >= '{rng.lo}' AND event_date <= '{rng.hi}'"
   (df.write.format("delta")
      .mode("overwrite")
      .option("replaceWhere", predicate)
      .saveAsTable("analytics.events"))
   ```
   SQL alternative on Databricks Runtime that supports it: `INSERT INTO analytics.events REPLACE WHERE event_date BETWEEN '2026-10-18' AND '2026-10-20' SELECT ...`.
2. NEVER call `.mode("overwrite")` on this table without `replaceWhere` (or dynamic partition overwrite): the default static overwrite replaces the entire table.
3. Keep Delta's constraint check on: by default the write fails if any row in `df` falls outside the predicate. Do not disable `spark.databricks.delta.replaceWhere.constraintCheck.enabled`.
4. Alternative when the batch's dates are exactly the partitions to replace and the table is partitioned by date: dynamic partition overwrite, `.option("partitionOverwriteMode", "dynamic")` (supported in Delta Lake 2.0 and later; check your runtime's docs). It replaces only partitions present in `df`, so a date with zero rows in `df` keeps its old data; prefer `replaceWhere` when a date may legitimately become empty.
5. For retried micro-batches use Delta idempotent write options `txnAppId` and `txnVersion` (documented for `foreachBatch`) so a retried version is skipped; for plain batch jobs `replaceWhere` is already idempotent.

### Output
`load_code`.

### Quality Gate
- `grep -n 'mode("overwrite")' jobs/events_load.py` shows every match followed by a `replaceWhere` or `partitionOverwriteMode` option in the same statement.

---

## Phase 3: Verify What Changed

### Entry Criteria
- One run completed.

### Actions
1. Before the run, save per-date counts outside the range: `SELECT event_date, COUNT(*) FROM analytics.events WHERE event_date < '<lo>' OR event_date > '<hi>' GROUP BY 1` (limit to recent dates the user names).
2. After the run, inspect history: `DESCRIBE HISTORY analytics.events LIMIT 1`. Check `operation = WRITE`, `operationParameters.mode = Overwrite`, `operationParameters.predicate` equals your predicate, and read `operationMetrics`.
3. Rerun the job for the same range. Per-date counts inside the range must be equal to the first run, and counts outside must equal step 1.
4. Rollback path if wrong: `RESTORE TABLE analytics.events TO VERSION AS OF <previous version>;`. Retention of old versions depends on `delta.logRetentionDuration` and VACUUM settings; check them before relying on it.

### Output
`load_report`.

### Quality Gate
- History row shows the predicate; outside-range counts equal the pre-run counts; inside-range counts are equal across the two runs.

---

## Worked Example

Illustrative. Lookback 3 days, run on 2026-10-20.
```
>>> spark.sql("DESCRIBE HISTORY analytics.events LIMIT 1").select("version","operation","operationParameters","operationMetrics").show(truncate=False)
|412|WRITE|{mode -> Overwrite, predicate -> ["((event_date >= '2026-10-18') AND (event_date <= '2026-10-20'))"]}|{numOutputRows -> 5120933, numRemovedFiles -> 36, numAddedFiles -> 36, ...}|
```
Outside-range check for 2026-10-17: 1,702,114 before and after. Rerun produces version 413 with the same `numOutputRows`.

---

## Exit Criteria

DONE when every overwrite is bounded by `replaceWhere` (or dynamic partition mode), the job reads complete source data for the replaced range, and history plus counts prove nothing outside the range changed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Input covers only new rows for a date in the range | **Stop**: change the read to full history for the range before any run. |
| Phase 2 | Write fails because data does not match `replaceWhere` | **Adjust**: rows outside the range are in `df`; fix the filter, do not disable the check. |
| Phase 3 | Counts outside the range changed | **Stop**: `RESTORE TABLE` to the previous version and find the unbounded overwrite. |
| Phase 3 | Concurrent writer conflict (`ConcurrentAppendException` or similar) | **Retry**: rerun the job; replaceWhere is idempotent. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

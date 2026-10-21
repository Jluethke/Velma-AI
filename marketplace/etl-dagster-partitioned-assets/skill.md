# ETL Dagster Daily-Partitioned Assets with Retries

**One-line description:** Models the pipeline as Dagster software-defined assets on a `DailyPartitionsDefinition`, with each partition's time window read from `context.partition_time_window`, a `RetryPolicy` with exponential backoff, a blocking `@asset_check` for the contract, a schedule that re-requests the late-data lookback partitions, and proves it with `dagster asset materialize` and `materialize()` in pytest.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `data_contract` (object, required): Output of `etl-target-schema-contract`.
- `late_data_policy` (object, required): Output of `etl-late-arriving-data-policy` (lookback in days).
- `project_dir` (string, required): Repository root; Dagster code goes in `<project_dir>/pipelines/dagster_defs.py`.

---

## Outputs

- `dagster_definitions` (string): Path to `pipelines/dagster_defs.py` exporting `defs = Definitions(...)`, and `tests/test_dagster_defs.py`.
- `materialize_log` (string): Output of a CLI materialization for one partition, plus the pytest result.

---

## Phase 1: Define Partitions and Assets

### Entry Criteria
- `python -c "import dagster; print(dagster.__version__)"` prints a 1.x version. Record it; check API names below against that version's API reference.

### Actions
1. Edit ONE file, `pipelines/dagster_defs.py`:
   ```python
   import dagster as dg

   daily = dg.DailyPartitionsDefinition(start_date="2026-01-01", timezone="UTC")

   retry = dg.RetryPolicy(
       max_retries=MAX_RETRIES,             # user value; RetryPolicy default is 1
       delay=RETRY_DELAY_S,                 # user value, seconds
       backoff=dg.Backoff.EXPONENTIAL,
       jitter=dg.Jitter.PLUS_MINUS,
   )

   @dg.asset(partitions_def=daily, retry_policy=retry, group_name="orders")
   def raw_orders(context: dg.AssetExecutionContext) -> dg.MaterializeResult:
       window = context.partition_time_window          # start, end for this day
       from pipelines.extract.orders_extract import main
       out = main(start=window.start, end=window.end, run_id=context.run_id)
       return dg.MaterializeResult(metadata={"rows": out["rows"], "path": out["path"]})

   @dg.asset(partitions_def=daily, retry_policy=retry, deps=[raw_orders], group_name="orders")
   def fct_orders(context: dg.AssetExecutionContext) -> dg.MaterializeResult:
       from pipelines.load.orders_load import main
       rep = main(partition=context.partition_key)
       return dg.MaterializeResult(metadata={"inserted": rep["inserted"], "updated": rep["updated"]})
   ```
2. Rules:
   - Each asset computes exactly its partition's window; never "everything since last run". That makes any partition re-materializable.
   - `start_date` is the first date the user wants history for; a later date makes older partitions unreachable.
   - Imports of pipeline code inside the function body keep code-location load fast.

### Output
Asset definitions.

### Quality Gate
- `python -c "import pipelines.dagster_defs"` exits 0.

---

## Phase 2: Add the Contract Check, Job and Late-Data Schedule

### Entry Criteria
- Assets import.

### Actions
1. Blocking asset check (downstream assets do not run when it fails):
   ```python
   @dg.asset_check(asset=fct_orders, blocking=True)
   def fct_orders_key_unique() -> dg.AssetCheckResult:
       from pipelines.quality.sql_checks import duplicate_key_count
       n = duplicate_key_count("analytics.fct_orders", ["order_id"])
       return dg.AssetCheckResult(passed=(n == 0), metadata={"duplicate_keys": n})
   ```
2. Job and schedule that re-requests the lookback partitions every day (late rows land in older partitions):
   ```python
   orders_job = dg.define_asset_job("orders_job", selection=dg.AssetSelection.groups("orders"),
                                    partitions_def=daily)

   @dg.schedule(job=orders_job, cron_schedule=SCHEDULE_CRON, execution_timezone="UTC")
   def orders_schedule(context: dg.ScheduleEvaluationContext):
       keys = daily.get_partition_keys(current_time=context.scheduled_execution_time)
       for pk in keys[-LOOKBACK_DAYS:]:          # LOOKBACK_DAYS from late_data_policy
           yield dg.RunRequest(run_key=f"{pk}:{context.scheduled_execution_time.isoformat()}",
                               partition_key=pk)

   defs = dg.Definitions(assets=[raw_orders, fct_orders],
                         asset_checks=[fct_orders_key_unique],
                         jobs=[orders_job], schedules=[orders_schedule])
   ```
   `run_key` must change per tick, or Dagster skips the repeat request for an older partition.
3. Limit concurrent runs that hit the same source. Use the run-queue concurrency settings or pools available in your Dagster version (see "Limiting concurrency" in the docs); do not invent tag names.

### Output
`dagster_definitions`.

### Quality Gate
- `dagster definitions validate -m pipelines.dagster_defs` reports success (if your version lacks this command, `dagster dev -m pipelines.dagster_defs` loads with no error in the UI's code location page).

---

## Phase 3: Materialize and Test

### Entry Criteria
- Definitions validate.

### Actions
1. CLI: `dagster asset materialize -m pipelines.dagster_defs --select raw_orders,fct_orders --partition 2026-10-20 2>&1 | tee materialize.log`.
2. Pytest with the in-process API:
   ```python
   import dagster as dg
   from pipelines.dagster_defs import raw_orders, fct_orders, fct_orders_key_unique

   def test_partition_materializes_twice_identically():
       for _ in range(2):
           res = dg.materialize([raw_orders, fct_orders, fct_orders_key_unique],
                                partition_key="2026-10-20")
           assert res.success
   ```
   Point the pipeline modules at a dev database through environment variables or Dagster resources in the test; never at production.
3. Run `pytest -q tests/test_dagster_defs.py`. Read the second run's `fct_orders` metadata: `inserted` and `updated` must be 0.

### Output
`materialize_log`.

### Quality Gate
- `grep -c "RUN_SUCCESS" materialize.log` is at least 1 and `pytest -q` shows all passed.

---

## Worked Example

Illustrative. Dagster 1.9, user values: 3 retries, 60 s delay, cron `0 3 * * *`, lookback 3 days.
```
$ dagster asset materialize -m pipelines.dagster_defs --select raw_orders,fct_orders --partition 2026-10-20
... STEP_SUCCESS - raw_orders
... STEP_SUCCESS - fct_orders
... ASSET_CHECK_EVALUATION - fct_orders_key_unique passed
... RUN_SUCCESS
$ pytest -q tests/test_dagster_defs.py
.                                                            [100%]
1 passed in 9.88s
```
The schedule tick on 2026-10-21 requests partitions 2026-10-18, 2026-10-19, 2026-10-20.

---

## Exit Criteria

DONE when assets compute only their partition window, retries and lookback come from user values, the blocking check guards the key, and a partition materializes twice with the same result.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `AttributeError` for an API name | **Adjust**: look up the name in the API docs for the installed version. |
| Phase 2 | Schedule produces no runs for older partitions | **Adjust**: make `run_key` include the tick time. |
| Phase 3 | Asset check fails | **Return**: duplicates exist; route to the load flow; do not set `blocking=False` to pass. |
| Phase 3 | Second materialization changes rows | **Stop**: the load is not idempotent; fix before scheduling. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

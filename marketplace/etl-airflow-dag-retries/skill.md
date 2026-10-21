# ETL Airflow DAG with Retries and Interval-Scoped Tasks

**One-line description:** Writes an Airflow DAG for the batch pipeline whose tasks are scoped to `{{ data_interval_start }}`/`{{ data_interval_end }}` so any run can be repeated, with explicit `retries`, `retry_delay`, `retry_exponential_backoff`, `execution_timeout`, `max_active_runs`, `catchup`, and proves it with `airflow dags list-import-errors`, a DagBag pytest and `airflow dags test`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `data_contract` (object, required): Output of `etl-target-schema-contract` (table, owner, alert destination).
- `late_data_policy` (object, required): Output of `etl-late-arriving-data-policy` (lookback for the reprocess window).
- `project_dir` (string, required): Repository root containing the `dags/` folder Airflow reads.

---

## Outputs

- `dag_file` (string): Path to `dags/<pipeline>.py` and `tests/dags/test_dag_integrity.py`.
- `dag_test_log` (string): Saved output of `airflow dags test` for one logical date, showing every task `success`.

---

## Phase 1: Fix Version-Specific Syntax

### Entry Criteria
- `airflow version` runs in the same environment the scheduler uses.

### Actions
1. Record the version and use this table; mixing versions is the most common breakage:
   | Item | Airflow 2.x | Airflow 3.x |
   |---|---|---|
   | Imports | `from airflow.decorators import dag, task` | `from airflow.sdk import dag, task` |
   | Schedule argument | `schedule=` (2.4+); `schedule_interval=` deprecated | `schedule=` only |
   | Run date in templates | `{{ data_interval_start }}`, `{{ ds }}`; `execution_date` deprecated | `{{ data_interval_start }}`, `{{ logical_date }}`; `execution_date` removed |
   | `catchup` default | `True` unless `[scheduler] catchup_by_default` changed | `False` |
   | Backfill CLI | `airflow dags backfill` | `airflow backfill create` |
2. Ask the user for: retry count, retry delay, maximum retry delay, task timeout, schedule. Documented defaults if the user gives none: `retries` comes from `[core] default_task_retries` (default `0`), `retry_delay` default is 300 seconds. Report that the default of 0 retries means one transient error fails the run.

### Output
Version table row and user-supplied retry values.

### Quality Gate
- The recorded `airflow version` output and the five user values (or the stated defaults) are written at the top of the DAG file as a comment.

---

## Phase 2: Write the DAG

### Entry Criteria
- Values known.

### Actions
1. Edit ONE file, `dags/orders_pipeline.py` (2.x imports shown):
   ```python
   from datetime import timedelta
   import pendulum
   from airflow.decorators import dag, task

   default_args = {
       "owner": "sales-analytics",
       "retries": RETRIES,                         # user value
       "retry_delay": timedelta(seconds=RETRY_DELAY_S),
       "retry_exponential_backoff": True,
       "max_retry_delay": timedelta(seconds=MAX_RETRY_DELAY_S),
       "execution_timeout": timedelta(seconds=TASK_TIMEOUT_S),
       "depends_on_past": True,
   }

   @dag(
       dag_id="orders_pipeline",
       schedule=SCHEDULE,                          # user value, e.g. a cron string
       start_date=pendulum.datetime(2026, 1, 1, tz="UTC"),
       catchup=False,
       max_active_runs=1,
       default_args=default_args,
       tags=["etl", "orders"],
   )
   def orders_pipeline():
       @task
       def extract(data_interval_start=None, data_interval_end=None, run_id=None):
           from pipelines.extract.orders_extract import main
           return main(start=data_interval_start, end=data_interval_end, run_id=run_id)

       @task
       def load(landing: dict):
           from pipelines.load.orders_load import main
           return main(**landing)

       @task
       def quality():
           from pipelines.quality.orders_gx import main
           main()

       load(extract()) >> quality()

   orders_pipeline()
   ```
2. Rules that keep runs repeatable:
   - Every task reads its window from the context (`data_interval_start`, `data_interval_end`), never from `datetime.now()`.
   - `max_active_runs=1` and `depends_on_past=True` because the watermark is shared state; two concurrent runs race on it.
   - Pass only small values through XCom (paths, counts). Never return a DataFrame from a task.
   - Imports of heavy libraries and any database call go INSIDE task functions. Top-level code runs on every DAG file parse.
   - Explicit `catchup=False` (or `True` if the user wants automatic history runs) regardless of version default.
3. Use a pool to cap concurrent source queries across DAGs: create it with `airflow pools set source_db <slots> "orders source"` (slots from the source DBA) and add `pool="source_db"` to `extract`.

### Output
`dag_file`.

### Quality Gate
- `python dags/orders_pipeline.py` exits 0.
- `grep -n "datetime.now\|utcnow" dags/orders_pipeline.py` returns nothing.

---

## Phase 3: Prove It Parses and Runs

### Entry Criteria
- DAG file imports.

### Actions
1. `airflow dags list-import-errors` must print no rows for this file.
2. Add `tests/dags/test_dag_integrity.py`:
   ```python
   from airflow.models import DagBag

   def test_no_import_errors():
       bag = DagBag(dag_folder="dags", include_examples=False)
       assert bag.import_errors == {}

   def test_orders_has_retries():
       dag = DagBag(dag_folder="dags", include_examples=False).get_dag("orders_pipeline")
       assert all(t.retries >= 1 for t in dag.tasks)
   ```
   Run `pytest -q tests/dags`. The second test encodes the user's retry choice; if they chose 0, change the assertion to equal their value, not delete it.
3. Run one interval end to end on dev: `airflow dags test orders_pipeline 2026-10-20 2>&1 | tee dag_test.log`. Then rerun the same date and confirm the load reports 0 inserted and 0 updated.
4. Test one task alone when debugging: `airflow tasks test orders_pipeline extract 2026-10-20`.

### Output
`dag_test_log`.

### Quality Gate
- `grep -c "state=success" dag_test.log` (or the `Marking task as SUCCESS` lines, depending on version) equals the number of tasks; `pytest -q tests/dags` shows all passed.

---

## Worked Example

Illustrative. Airflow 2.10, user values: 3 retries, 300 s delay, 1800 s max delay, 3600 s timeout, schedule `0 3 * * *`.
```
$ airflow dags list-import-errors
No data found
$ pytest -q tests/dags
..                                                           [100%]
2 passed in 4.02s
$ airflow dags test orders_pipeline 2026-10-20
... Marking task as SUCCESS. dag_id=orders_pipeline, task_id=extract ...
... Marking task as SUCCESS. dag_id=orders_pipeline, task_id=load ...
... Marking task as SUCCESS. dag_id=orders_pipeline, task_id=quality ...
```

---

## Exit Criteria

DONE when the DAG uses the syntax of the installed Airflow version, tasks are interval-scoped and serialized on shared state, retry values come from the user, and import-error check, DagBag tests and a full `dags test` all pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Imports fail after an upgrade to 3.x | **Adjust**: switch imports and template variables per the version table. |
| Phase 2 | DAG parse is slow or times out (`dagbag_import_timeout`) | **Adjust**: move imports and I/O into task bodies. |
| Phase 3 | Task fails then succeeds on retry | **Return**: report the transient error; keep retries; do not raise retries to hide a persistent failure. |
| Phase 3 | Rerun of the same date inserts rows | **Stop**: a task is not idempotent; fix the load before scheduling. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

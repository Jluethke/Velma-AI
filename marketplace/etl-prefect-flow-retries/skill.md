# ETL Prefect Flow with Task Retries and Explicit Windows

**One-line description:** Writes the batch pipeline as a Prefect 3 flow whose window is derived from `prefect.runtime.flow_run.scheduled_start_time` (Prefect has no built-in data interval), with per-task `retries`, `retry_delay_seconds` built by `exponential_backoff`, `timeout_seconds`, caching off for side-effecting tasks, a deployment in `prefect.yaml`, and tests under `prefect_test_harness`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `data_contract` (object, required): Output of `etl-target-schema-contract`.
- `late_data_policy` (object, required): Output of `etl-late-arriving-data-policy`.
- `project_dir` (string, required): Repository root; the flow goes in `<project_dir>/flows/<pipeline>.py`.

---

## Outputs

- `prefect_flow` (string): Path to `flows/orders_pipeline.py` and `tests/test_orders_flow.py`.
- `deployment_config` (string): Path to `prefect.yaml` with the deployment, schedule and work pool, plus the output of one `prefect deployment run`.

---

## Phase 1: Write the Flow

### Entry Criteria
- `prefect version` shows 3.x. On 2.x, check the 2.x docs for deployments (`prefect deployment build` was the older path) before continuing.

### Actions
1. Edit ONE file, `flows/orders_pipeline.py`:
   ```python
   from datetime import datetime, timedelta, timezone
   from prefect import flow, task
   from prefect.cache_policies import NO_CACHE
   from prefect.tasks import exponential_backoff
   from prefect import runtime

   @task(retries=RETRIES,
         retry_delay_seconds=exponential_backoff(backoff_factor=BACKOFF_FACTOR_S),
         retry_jitter_factor=JITTER,
         timeout_seconds=TASK_TIMEOUT_S,
         cache_policy=NO_CACHE)
   def extract(start: datetime, end: datetime, run_id: str) -> dict:
       from pipelines.extract.orders_extract import main
       return main(start=start, end=end, run_id=run_id)

   @task(retries=RETRIES, retry_delay_seconds=exponential_backoff(backoff_factor=BACKOFF_FACTOR_S),
         timeout_seconds=TASK_TIMEOUT_S, cache_policy=NO_CACHE)
   def load(landing: dict) -> dict:
       from pipelines.load.orders_load import main
       return main(**landing)

   @flow(name="orders-pipeline", log_prints=True)
   def orders_pipeline(start: datetime | None = None, end: datetime | None = None):
       if end is None:
           end = runtime.flow_run.scheduled_start_time
       if start is None:
           start = end - timedelta(days=1)
       landing = extract(start, end, runtime.flow_run.id)
       report = load(landing)
       print(report)
       return report
   ```
   All capitalized names are user values; `exponential_backoff` returns a list of delays that grow per retry.
2. Rules:
   - The window comes from parameters or the scheduled start time, never `datetime.now()`: a retried or late-started run must process the same window.
   - `cache_policy=NO_CACHE` on tasks with side effects. Prefect 3 tasks have a default cache policy; adding `cache_key_fn` or `cache_expiration` to a load can make a rerun skip the load and report success.
   - Pass paths and counts between tasks, not large data.

### Output
`prefect_flow` source.

### Quality Gate
- `python -c "import flows.orders_pipeline"` exits 0 and `grep -n "datetime.now" flows/orders_pipeline.py` returns nothing.

---

## Phase 2: Test Locally

### Entry Criteria
- Flow imports.

### Actions
1. `tests/test_orders_flow.py`:
   ```python
   import pytest
   from datetime import datetime, timezone
   from prefect.testing.utilities import prefect_test_harness
   from flows.orders_pipeline import orders_pipeline

   @pytest.fixture(autouse=True, scope="session")
   def harness():
       with prefect_test_harness():
           yield

   def test_same_window_twice_is_idempotent():
       s = datetime(2026, 10, 19, tzinfo=timezone.utc)
       e = datetime(2026, 10, 20, tzinfo=timezone.utc)
       orders_pipeline(start=s, end=e)
       second = orders_pipeline(start=s, end=e)
       assert second["inserted"] == 0 and second["updated"] == 0
   ```
   For this assertion the flow must end with `return report`. Point pipeline modules at a dev database via environment variables.
2. Run `pytest -q tests/test_orders_flow.py`.
3. Prove retries fire: temporarily point `extract` at a closed port on dev, run the flow once, and read the logs for `Retrying` lines (one per configured retry), then restore. Do not commit the broken setting.

### Output
Test result.

### Quality Gate
- `pytest -q` shows all passed, and the retry experiment log shows the configured number of retry attempts.

---

## Phase 3: Deploy with a Schedule

### Entry Criteria
- Tests pass.

### Actions
1. Create a work pool and start a worker (process type shown): `prefect work-pool create etl-pool --type process` and `prefect worker start --pool etl-pool`.
2. `prefect.yaml` deployment:
   ```yaml
   deployments:
     - name: daily
       entrypoint: flows/orders_pipeline.py:orders_pipeline
       work_pool:
         name: etl-pool
       schedules:
         - cron: "<user cron>"
           timezone: "UTC"
   ```
   Then `prefect deploy --name daily`. Check `prefect deploy --help` for flags in your version.
3. Limit concurrency against the source with a global concurrency limit (see `prefect global-concurrency-limit --help`) or a deployment `concurrency_limit`; use the names your version documents. Set it to 1 when the watermark is shared state.
4. Trigger one run for a fixed window: `prefect deployment run 'orders-pipeline/daily' --param start=2026-10-19T00:00:00+00:00 --param end=2026-10-20T00:00:00+00:00` and watch it with `prefect flow-run ls --limit 1`.

### Output
`deployment_config`.

### Quality Gate
- `prefect deployment ls` lists `orders-pipeline/daily`, and the triggered run reaches state `Completed`.

---

## Worked Example

Illustrative. Prefect 3.1; user values: 3 retries, backoff factor 10 s, jitter 0.5, timeout 3600 s.
```
$ pytest -q tests/test_orders_flow.py
.                                                            [100%]
1 passed in 12.3s
Retry experiment log:
Task run 'extract-0' - Encountered exception during execution: OperationalError(...)
Task run 'extract-0' - Task run failed with exception ... - Retry 1/3 will start 10 second(s) from now
... Retry 2/3 will start 20 second(s) from now
... Retry 3/3 will start 40 second(s) from now
$ prefect deployment run 'orders-pipeline/daily' --param start=... --param end=...
Created flow run 'amber-otter'.
```

---

## Exit Criteria

DONE when the flow's window is parameter or schedule derived, side-effecting tasks never cache, retries are proven to fire with user-chosen values, and the deployment completes a run.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Import error on `prefect.cache_policies` | **Adjust**: you are on Prefect 2.x; remove `cache_policy` and confirm no `cache_key_fn` is set. |
| Phase 2 | Rerun skipped a task with state `Cached` | **Adjust**: set `cache_policy=NO_CACHE`; rerun. |
| Phase 3 | Run stays `Late` or `Scheduled` | **Return**: no worker is polling the pool; start `prefect worker start --pool etl-pool`. |
| Phase 3 | Retries exhausted | **Return**: report the final exception; do not raise retries to hide a persistent failure. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

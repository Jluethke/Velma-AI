# ETL Backfill by Partition Window

**One-line description:** Plans and runs a historical backfill as a list of explicit date windows using the orchestrator's own backfill command (Airflow 2 `airflow dags backfill`, Airflow 3 `airflow backfill create`, Dagster partition backfill, Prefect parameterized runs, cron wrapper with a date argument, dbt microbatch `--event-time-start/--event-time-end`), without moving the production watermark, and verifies each window after it lands.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `orchestrator` (string, required): One of `airflow`, `dagster`, `prefect`, `cron`, `dbt` (dbt-only backfill of a model).
- `backfill_range` (object, required): `start` and `end` dates (end exclusive), the reason (new column, bug fix, late data, new table), and the user's approval of cost and source load.
- `data_contract` (object, required): Output of `etl-target-schema-contract`.
- `project_dir` (string, required): Repository root.

---

## Outputs

- `backfill_plan` (object): Ordered windows, the exact command per window or the single range command, concurrency, the state of the production schedule during the backfill, and a rollback note.
- `backfill_report` (object): Per window: status, rows inserted/updated (from load reports), and the per-day reconciliation result.

---

## Phase 1: Plan the Windows

### Entry Criteria
- The pipeline is idempotent per window (the load flows' rerun test passed). If not, stop: a backfill of a non-idempotent pipeline duplicates data.

### Actions
1. Split the range into windows equal to the pipeline's partition grain (usually one day). Do not invent a bigger chunk to "go faster"; ask the user if they want multi-day windows, and only when the code supports them.
2. Decide concurrency with this table:
   | Condition | Concurrency |
   |---|---|
   | Pipeline reads or writes shared state (watermark, SCD snapshot) | 1, oldest window first |
   | Windows are independent partitions and the source DBA approved parallel load | the DBA's number |
   | dbt microbatch | dbt runs batches; concurrency per the dbt docs for your adapter |
3. Watermark rule: a backfill passes explicit `start`/`end` and must NOT write `etl_state.watermarks`. Confirm the extract has a code path for explicit windows that skips the state update; if it does not, stop and add it first.
4. Production schedule: pause it during the backfill if both write the same partitions (Airflow `airflow dags pause orders_pipeline`, Dagster stop the schedule in the UI or `dagster schedule stop`, Prefect `prefect deployment pause` or the UI; check `--help` for your version). Record when to resume.
5. Estimate cost where the platform supports it: BigQuery `bq query --dry_run` on one window's statements times the window count; Snowflake run one window and read `QUERY_HISTORY` credits. Present to the user for approval.

### Output
`backfill_plan` draft.

### Quality Gate
- `backfill_plan` lists every window from `start` to `end` with no gaps or overlaps (count of windows equals days between the dates for a daily grain) and records the user's cost approval.

---

## Phase 2: Run the Backfill

### Entry Criteria
- Plan approved.

### Actions
1. Use the command for the orchestrator. Check `--help` before running; flags differ by version.
   | `orchestrator` | Command (range 2026-09-01 to 2026-10-01) |
   |---|---|
   | `airflow` 2.x | `airflow dags backfill orders_pipeline -s 2026-09-01 -e 2026-09-30` (add `--reset-dagruns` to rerun existing runs; it asks for confirmation unless `-y`) |
   | `airflow` 3.x | `airflow backfill create --dag-id orders_pipeline --from-date 2026-09-01 --to-date 2026-09-30 --max-active-runs 1 --reprocess-behavior failed` (`--reprocess-behavior` is `none`, `failed` or `completed`) |
   | `dagster` | UI: Assets, select assets, Materialize, choose the partition range, launch backfill. CLI: `dagster job backfill -m pipelines.dagster_defs -j orders_job --from 2026-09-01 --to 2026-09-30` (confirm flags with `dagster job backfill --help`) |
   | `prefect` | one run per window: `prefect deployment run 'orders-pipeline/daily' --param start=2026-09-01T00:00:00+00:00 --param end=2026-09-02T00:00:00+00:00`, in a shell loop that waits for each run if concurrency is 1 (`--watch` if your version supports it) |
   | `cron` | `for d in $(seq 0 29); do bin/run_orders.sh "$(date -u -d "2026-09-01 + $d day" +%F)" || break; done` |
   | `dbt` microbatch | `dbt run --select fct_events --event-time-start "2026-09-01" --event-time-end "2026-10-01"` |
   | `dbt` other incremental | only if the model reads backfill vars: `dbt run --select fct_orders --vars '{"backfill_start": "2026-09-01", "backfill_end": "2026-10-01"}'`; otherwise `--full-refresh` with the owner's approval |
2. Note Airflow's 2.x `-e` end date is inclusive of runs whose logical date equals it; check the windows printed in the dry list with `airflow dags backfill ... --dry-run` before the real run.
3. Run the first window alone, verify it (Phase 3), then run the rest.
4. Stop on the first failure; do not skip a failed window and continue (`|| break` in the loop).

### Output
Runs launched and completed per window.

### Quality Gate
- The orchestrator shows every planned window in a success state (Airflow `airflow dags list-runs -d orders_pipeline --start-date 2026-09-01 --end-date 2026-10-01`; Dagster backfill page; Prefect `prefect flow-run ls`; cron loop log).

---

## Phase 3: Verify and Resume

### Entry Criteria
- At least one window completed.

### Actions
1. For each window, run the reconciliation per day (source vs target counts and sums) and record the result.
2. Run the data tests for the affected models or tables (`dbt build --select fct_orders` tests, GX checkpoint, or Dagster asset checks).
3. Confirm the production watermark did not move: `SELECT last_watermark, last_run_id FROM etl_state.watermarks WHERE source_table = 'orders';` equals the value recorded before the backfill.
4. Resume the production schedule (`airflow dags unpause orders_pipeline` or equivalent) and record the time.

### Output
`backfill_report`.

### Quality Gate
- Every window has a reconciliation result with zero unexplained differences, and the watermark query output equals the pre-backfill value.

---

## Worked Example

Illustrative. Airflow 2.10, bug fix in `amount` rounding, range 2026-09-01 to 2026-10-01, concurrency 1.
```
$ airflow dags pause orders_pipeline
$ airflow dags backfill orders_pipeline -s 2026-09-01 -e 2026-09-01
... DagRun Finished: dag_id=orders_pipeline, logical_date=2026-09-01T00:00:00+00:00, state=success
reconcile 2026-09-01: src_n=58110 tgt_n=58110 src_sum=4012871.20 tgt_sum=4012871.20
$ airflow dags backfill orders_pipeline -s 2026-09-02 -e 2026-09-30
...
$ psql -c "SELECT last_watermark FROM etl_state.watermarks WHERE source_table='orders';"
 2026-10-20 03:00:02.418211     (unchanged)
$ airflow dags unpause orders_pipeline
```

---

## Exit Criteria

DONE when every planned window ran through the orchestrator's backfill path, each reconciles, tests pass, the production watermark is unchanged, and the schedule is resumed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Extract has no explicit-window path | **Stop**: add one that skips the watermark update before backfilling. |
| Phase 2 | A window fails | **Retry**: rerun that window alone after fixing the cause; do not continue past it. |
| Phase 2 | Source DBA reports load | **Adjust**: lower concurrency to 1 and add the gap between windows the DBA asks for. |
| Phase 3 | Watermark moved | **Stop**: restore the recorded value in `etl_state.watermarks` with the owner, then find the code path that wrote it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

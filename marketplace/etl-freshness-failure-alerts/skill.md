# ETL Freshness and Failure Alerting

**One-line description:** Wires two independent alarms for a batch pipeline: a failure alert from the orchestrator's own hook after the final retry (Airflow `on_failure_callback`, Dagster `@run_failure_sensor`, Prefect flow `on_failure` hook, cron exit-code ping), and a freshness check on the target's `_loaded_at` that runs on its own schedule so it fires even when the pipeline never starts; both proven by forced test alerts.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `data_contract` (object, required): Output of `etl-target-schema-contract`; supplies `freshness.loaded_at_column`, `warn_after`, `error_after`, `owner`.
- `orchestrator` (string, required): `airflow`, `dagster`, `prefect` or `cron`.
- `alert_destination` (string, required): A Slack incoming webhook URL, a Microsoft Teams workflow webhook URL, or a pager integration URL, stored as a secret (environment variable name, not the literal URL).
- `project_dir` (string, required): Repository root.

---

## Outputs

- `freshness_checks` (string): Path to `sql/freshness/<table>.sql` and the scheduled job that runs it (or the dbt `source freshness` command), with thresholds copied from the contract.
- `alert_config` (string): Path to the failure hook code for the orchestrator and the record of one test alert received for failure and one for staleness.

---

## Phase 1: Failure Alert from the Orchestrator

### Entry Criteria
- The alert URL is in a secret store and available as an environment variable such as `ALERT_WEBHOOK_URL`. Never commit the URL.

### Actions
1. Write one function that posts the message, `pipelines/alerting.py`:
   ```python
   import json, os, urllib.request

   def post_alert(text: str) -> None:
       req = urllib.request.Request(
           os.environ["ALERT_WEBHOOK_URL"],
           data=json.dumps({"text": text}).encode(),
           headers={"Content-Type": "application/json"})
       urllib.request.urlopen(req, timeout=10)
   ```
   `{"text": ...}` is the Slack incoming webhook payload; for Teams or a pager, use the payload their docs specify.
2. Message content, always: pipeline name, run id, data window, failing task or step, attempt count, log link, owner from `data_contract.owner`.
3. Hook it into the orchestrator:
   | `orchestrator` | Hook |
   |---|---|
   | `airflow` | `default_args["on_failure_callback"] = notify` where `def notify(context): post_alert(f"{context['dag'].dag_id} {context['run_id']} task {context['task_instance'].task_id} failed: {context['task_instance'].log_url}")`. It fires after the final retry; `on_retry_callback` fires on each retry, so leave that unset to avoid noise. |
   | `dagster` | `@dg.run_failure_sensor(monitored_jobs=[orders_job])` with `def on_fail(context: dg.RunFailureSensorContext): post_alert(f"{context.dagster_run.job_name} {context.dagster_run.run_id} failed: {context.failure_event.message}")`, added to `Definitions(sensors=[...])`. The `dagster-slack` package also provides `make_slack_on_run_failure_sensor` (uses a bot token and channel). |
   | `prefect` | `@flow(on_failure=[hook])` with `def hook(flow, flow_run, state): post_alert(f"{flow.name} {flow_run.name} {state.message}")`; or a Prefect Automation on flow-run state `Failed` configured in the UI. |
   | `cron` | the wrapper's final failure branch calls `curl -fsS -m 10 -H 'Content-Type: application/json' -d "{\"text\":\"orders failed rc=$rc date=$RUN_DATE\"}" "$ALERT_WEBHOOK_URL"`. |
4. An alert hook must never raise into the pipeline: wrap `post_alert` in `try/except Exception` that logs, inside the hook only.

### Output
Failure hook code.

### Quality Gate
- `python -c "from pipelines.alerting import post_alert; post_alert('TEST failure alert from orders pipeline')"` delivers a message the user confirms they received (record the timestamp).

---

## Phase 2: Freshness Check Independent of the Pipeline

### Entry Criteria
- `data_contract.freshness.warn_after` and `error_after` are user values. If either is `OPEN_QUESTION`, stop and ask; do not invent one.

### Actions
1. Write `sql/freshness/fct_orders.sql`, returning the age in seconds:
   - Postgres: `SELECT EXTRACT(EPOCH FROM now() - MAX(_loaded_at))::bigint AS age_s FROM analytics.fct_orders;`
   - Snowflake: `SELECT DATEDIFF('second', MAX(_loaded_at), CURRENT_TIMESTAMP()) AS age_s FROM analytics.fct_orders;`
   - BigQuery: `SELECT TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), MAX(_loaded_at), SECOND) AS age_s FROM analytics.fct_orders;`
   An empty table returns null: treat null as `error`.
2. Compare: `age_s > error_after` gives `error`; `age_s > warn_after` gives `warn`; else `pass`. Post an alert for `warn` and `error` with the age and the thresholds.
3. Schedule it SEPARATELY from the pipeline (a different DAG, a Dagster sensor or schedule in another job, a Prefect deployment, or a separate crontab line), at an interval the user picks. If the scheduler itself is down, only an external check helps: the cron heartbeat ping or an external monitor pinging a status endpoint.
4. dbt stack: `dbt source freshness` covers raw sources (thresholds in `sources.yml`); for the mart use the SQL above or the `dbt_utils.recency` test with `datepart`, `field`, `interval` from the contract.

### Output
`freshness_checks`.

### Quality Gate
- Running the check against a dev copy where `_loaded_at` is older than `error_after` produces an `error` alert the user confirms receiving.

---

## Phase 3: Prove Both Alarms End to End

### Entry Criteria
- Both hooks deployed to dev.

### Actions
1. Force a failure on dev (bad `SOURCE_DSN`). After the final retry, exactly one failure alert must arrive (not one per retry).
2. Pause the pipeline on dev past `error_after` (or shift `_loaded_at` back on a dev copy). The freshness job must alert without the pipeline running.
3. Restore dev, record both alert timestamps in `alert_config`.

### Output
`alert_config`.

### Quality Gate
- `alert_config` lists two received test alerts with timestamps: one failure (count 1 for the forced failure) and one freshness `error`.

---

## Worked Example

Illustrative. Airflow, Slack webhook, contract freshness warn 6 h, error 12 h.
```
$ python -c "from pipelines.alerting import post_alert; post_alert('TEST failure alert from orders pipeline')"
(user confirms the message in #data-alerts at 10:02 UTC)
Forced failure on dev, retries=3:
[2026-10-20 10:31] orders_pipeline scheduled__2026-10-19T03:00 task extract failed: http://airflow/log?...   (one message)
Freshness job:
age_s = 50410 > error_after 43200 -> error
[2026-10-20 11:05] fct_orders stale: last load 14h00m ago (warn 6h, error 12h), owner sales-analytics
```

---

## Exit Criteria

DONE when failure alerts fire once per failed run after the last retry, freshness alerts fire from a separately scheduled check using contract thresholds, and both were received in a forced test.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Webhook returns HTTP 403 or 404 | **Return**: the URL is revoked or wrong; get a new one from the workspace admin. |
| Phase 1 | Alerts arrive on every retry | **Adjust**: move the hook from the retry callback to the failure callback. |
| Phase 2 | Thresholds missing in the contract | **Stop**: ask the consumer; never default them. |
| Phase 3 | Freshness alert did not fire while the pipeline was paused | **Adjust**: the check runs inside the paused pipeline; move it to its own schedule. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

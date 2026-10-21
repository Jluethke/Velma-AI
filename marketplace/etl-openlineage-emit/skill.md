# ETL Lineage with OpenLineage and Marquez

**One-line description:** Emits OpenLineage run events (START, COMPLETE, FAIL with input and output datasets) from the pipeline using the integration that matches the stack (Airflow `apache-airflow-providers-openlineage`, dbt `dbt-ol` from `openlineage-dbt`, or the `openlineage-python` client for Dagster, Prefect and cron), names datasets by the OpenLineage naming spec, and verifies the graph in a Marquez backend through its lineage API.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `orchestrator` (string, required): `airflow`, `dagster`, `prefect` or `cron`.
- `stack` (string, required): `dbt` or `python` (transform stack).
- `project_dir` (string, required): Repository root.

---

## Outputs

- `lineage_config` (string): Path to `openlineage.yml` (client transport config) and the environment variables set for the orchestrator.
- `lineage_events` (object): The dataset graph for one run as returned by Marquez `GET /api/v1/lineage`: job names, input datasets, output datasets.

---

## Phase 1: Stand Up a Backend and Transport

### Entry Criteria
- Docker available for a local Marquez, or a lineage backend URL from the platform team.

### Actions
1. Local Marquez (from its README): `git clone https://github.com/MarquezProject/marquez && cd marquez && ./docker/up.sh`. API listens on port 5000, web UI on 3000. Health: `curl -s localhost:5000/api/v1/namespaces | jq '.namespaces[].name'`.
2. Write `openlineage.yml` in `project_dir` (read by the Python client and `dbt-ol`):
   ```yaml
   transport:
     type: http
     url: http://localhost:5000
     endpoint: api/v1/lineage
   ```
   For debugging use `type: console`, which prints events to the log instead of sending them.
3. Set the namespace for jobs: `export OPENLINEAGE_NAMESPACE=etl_prod` (environment variable read by the client integrations; confirm the name in your integration's docs).

### Output
Backend reachable and transport configured.

### Quality Gate
- The namespaces `curl` returns HTTP 200 and JSON.

---

## Phase 2: Instrument the Stack

### Entry Criteria
- Transport configured.

### Actions
1. Choose the integration:
   | Condition | Integration | Setup |
   |---|---|---|
   | `stack == 'dbt'` | `openlineage-dbt` | `pip install openlineage-dbt`; replace `dbt run`/`dbt build` with `dbt-ol run`/`dbt-ol build` in the orchestrator command. It reads `target/manifest.json` and `run_results.json` and emits one job per model with inputs from `ref`/`source`. |
   | `orchestrator == 'airflow'` | `apache-airflow-providers-openlineage` (Airflow 2.7+) | `pip install apache-airflow-providers-openlineage`; set `AIRFLOW__OPENLINEAGE__TRANSPORT='{"type": "http", "url": "http://marquez:5000", "endpoint": "api/v1/lineage"}'` and `AIRFLOW__OPENLINEAGE__NAMESPACE=etl_prod`. SQL operators report datasets automatically; `@task` Python functions do not, so declare `inlets=[...]` and `outlets=[...]` with `airflow.lineage.entities.Table` or emit with the client. Check the provider docs for the supported inlet types in your version. |
   | `orchestrator` in `dagster`, `prefect`, `cron` with `stack == 'python'` | `openlineage-python` client | Step 2 below |
2. Python client emission around each job (module and class names from `openlineage-python` 1.x; older releases used `openlineage.client.run`, so check your installed version):
   ```python
   from datetime import datetime, timezone
   from uuid import uuid4
   from openlineage.client import OpenLineageClient
   from openlineage.client.event_v2 import RunEvent, RunState, Run, Job, InputDataset, OutputDataset

   client = OpenLineageClient()            # reads openlineage.yml or OPENLINEAGE_URL
   run = Run(runId=str(uuid4()))
   job = Job(namespace="etl_prod", name="orders.load")
   inputs = [InputDataset(namespace="postgres://db1:5432", name="shop.sales.orders")]
   outputs = [OutputDataset(namespace="snowflake://acme-xy12345", name="ANALYTICS.PUBLIC.FCT_ORDERS")]
   now = lambda: datetime.now(timezone.utc).isoformat()
   client.emit(RunEvent(eventType=RunState.START, eventTime=now(), run=run, job=job,
                        producer="https://example.com/etl", inputs=inputs, outputs=outputs))
   try:
       ...  # the job
       client.emit(RunEvent(eventType=RunState.COMPLETE, eventTime=now(), run=run, job=job,
                            producer="https://example.com/etl", inputs=inputs, outputs=outputs))
   except Exception:
       client.emit(RunEvent(eventType=RunState.FAIL, eventTime=now(), run=run, job=job,
                            producer="https://example.com/etl", inputs=inputs, outputs=outputs))
       raise
   ```
   Use the same `runId` for START and COMPLETE/FAIL. Re-raise after FAIL; lineage must never swallow errors.
3. Dataset names follow the OpenLineage naming spec: Postgres `postgres://host:port` + `database.schema.table`; Snowflake `snowflake://<account identifier>` + `DATABASE.SCHEMA.TABLE`; BigQuery namespace `bigquery` + `project.dataset.table`. Use the same names everywhere or the graph splits into disconnected nodes.
4. Lineage emission failures must not fail the pipeline: the HTTP transport logs errors; do not wrap the job's own work inside lineage code.

### Output
Instrumented pipeline.

### Quality Gate
- With `transport.type: console`, one run prints a START and a COMPLETE event that share a `runId` (check with `grep -c '"runId": "<id>"'` on the log, expected 2 per job).

---

## Phase 3: Verify the Graph

### Entry Criteria
- One instrumented run completed with the HTTP transport.

### Actions
1. List jobs: `curl -s "localhost:5000/api/v1/namespaces/etl_prod/jobs" | jq '.jobs[].name'`.
2. Pull the lineage around the target table:
   ```bash
   curl -s "localhost:5000/api/v1/lineage?nodeId=dataset:snowflake://acme-xy12345:ANALYTICS.PUBLIC.FCT_ORDERS&depth=3" \
     | jq '.graph[] | {id, type, in: [.inEdges[].origin], out: [.outEdges[].destination]}'
   ```
3. The graph must show the source table, every job in between, and the target. A missing hop means a job without declared inputs or outputs, or a dataset named differently in two places.
4. For dbt also keep the built-in docs lineage: `dbt docs generate` produces `target/manifest.json`; `dbt ls --select +fct_orders` lists every upstream node.

### Output
`lineage_events`.

### Quality Gate
- The lineage response contains a path from the source dataset node to the target dataset node (both `id`s present and connected through job nodes).

---

## Worked Example

Illustrative. Airflow orchestrates, dbt transforms.
```
$ curl -s localhost:5000/api/v1/namespaces/etl_prod/jobs | jq '.jobs[].name'
"orders_pipeline.extract"
"orders_pipeline.load"
"dbt.shop.fct_orders"
$ curl -s "localhost:5000/api/v1/lineage?nodeId=dataset:snowflake://acme-xy12345:ANALYTICS.PUBLIC.FCT_ORDERS&depth=3" | jq -c '.graph[] | {id, type}'
{"id":"dataset:postgres://db1:5432:shop.sales.orders","type":"DATASET"}
{"id":"job:etl_prod:orders_pipeline.load","type":"JOB"}
{"id":"dataset:snowflake://acme-xy12345:RAW.SHOP.ORDERS","type":"DATASET"}
{"id":"job:etl_prod:dbt.shop.fct_orders","type":"JOB"}
{"id":"dataset:snowflake://acme-xy12345:ANALYTICS.PUBLIC.FCT_ORDERS","type":"DATASET"}
```

---

## Exit Criteria

DONE when every job in the pipeline emits START and COMPLETE or FAIL with named inputs and outputs, and Marquez returns a connected path from source to target.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Marquez API not reachable | **Retry**: check `docker ps` for the API container and port 5000 conflicts. |
| Phase 2 | Import error for `event_v2` | **Adjust**: older client; use the module path documented for the installed version. |
| Phase 3 | Graph split into two islands | **Adjust**: dataset names differ (case, namespace); align them to the naming spec. |
| Phase 3 | Airflow Python tasks show no datasets | **Adjust**: add `inlets`/`outlets` or emit with the client inside the task. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

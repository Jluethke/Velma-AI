# Python OpenTelemetry SDK Setup For Traces And Metrics

**One-line description:** Installs `opentelemetry-distro` and the OTLP exporter, runs `opentelemetry-bootstrap` to add instrumentation packages for the libraries the service uses, launches the service under `opentelemetry-instrument` with explicit `OTEL_*` environment variables, adds one manual span and one manual metric, and proves spans and metrics are emitted with the console exporter before switching to OTLP.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Absolute path to the Python service repository.
- `service_name` (string, required): Value for `OTEL_SERVICE_NAME`.
- `otlp_endpoint` (string, required): Collector OTLP endpoint, for example `http://otel-collector:4317` (gRPC) or `http://otel-collector:4318` (HTTP).

---

## Outputs

- `otel_setup` (object): Packages added, the exact start command, the full `OTEL_*` environment block, files changed, and captured console-exporter output showing one span and one metric.

---

## Phase 1: Install The Distro And Instrumentations

### Entry Criteria
- A virtual environment with the service's dependencies installed, so `opentelemetry-bootstrap` can see them.
- Test suite passes; summary saved.

### Actions
1. Install: `pip install opentelemetry-distro opentelemetry-exporter-otlp` (or the `uv add` / `poetry add` equivalent).
2. List what bootstrap would install without installing: `opentelemetry-bootstrap -a requirements`. It prints instrumentation packages matching installed libraries (for example `opentelemetry-instrumentation-fastapi`, `-sqlalchemy`, `-requests`).
3. Add exactly those lines to the dependency file, then install. Prefer recording them in the dependency file over `opentelemetry-bootstrap -a install`, which installs into the venv only and is lost on the next build.
4. Confirm versions line up. All `opentelemetry-instrumentation-*` packages must share one release line with `opentelemetry-sdk` (the 0.x instrumentation version pairs with a 1.x SDK version). Check: `pip list | rg -i opentelemetry`. Mismatched lines cause import errors at startup.

### Output
Dependencies recorded and installed.

### Quality Gate
- `pip list | rg -i opentelemetry` shows `opentelemetry-sdk`, `opentelemetry-distro`, `opentelemetry-exporter-otlp-proto-grpc` or `-http`, and each instrumentation from step 2.
- `pip check` prints `No broken requirements found.`

---

## Phase 2: Run Under Auto-Instrumentation With Console Export

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Start the service with console exporters first, so you see telemetry without a collector:
```
OTEL_SERVICE_NAME=checkout-api \
OTEL_RESOURCE_ATTRIBUTES=service.version=1.4.2,deployment.environment.name=dev \
OTEL_TRACES_EXPORTER=console OTEL_METRICS_EXPORTER=console OTEL_LOGS_EXPORTER=none \
OTEL_METRIC_EXPORT_INTERVAL=5000 \
opentelemetry-instrument uvicorn app.main:app --port 8000
```
`OTEL_METRIC_EXPORT_INTERVAL` is in milliseconds; the spec default is 60000. 5000 is for this local check only.
2. Send traffic: `curl -s localhost:8000/orders >/dev/null`.
3. Read the console output. A span is a JSON block with `"name": "GET /orders"`, `"kind": "SpanKind.SERVER"`, a `trace_id`, and attributes such as `http.route`. A metric block lists `http.server.duration` or `http.server.request.duration` (the name depends on the instrumentation's semantic convention version; record which one).
4. Process model rules:

| Server | Rule |
|---|---|
| `uvicorn` single process | works as shown |
| `uvicorn --reload` | do not use with auto-instrumentation; the reloader forks a child |
| `gunicorn` with workers, or `uvicorn --workers N` | follow the OpenTelemetry Python docs page "Working With Fork Process Models"; the SDK must initialize in each worker (`post_fork` hook) |

### Output
Captured console spans and metrics.

### Quality Gate
- Console output contains at least one span with `SpanKind.SERVER` for the curled route.
- Console output contains an HTTP server duration histogram with a non-zero `count`.

---

## Phase 3: Manual Instrumentation And OTLP Export

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Add one manual span around one business operation in one file:
```python
from opentelemetry import trace, metrics
tracer = trace.get_tracer(__name__)
meter = metrics.get_meter(__name__)
orders_created = meter.create_counter("orders.created", unit="{order}", description="Orders created")

def create_order(req):
    with tracer.start_as_current_span("create_order") as span:
        span.set_attribute("order.item_count", len(req.items))
        ...
        orders_created.add(1, {"payment.method": req.payment_method})
```
2. Attribute values on metrics must come from a small fixed set (payment method, region). Never put an order ID, user ID or email on a metric attribute; each distinct value creates a new time series.
3. Record exceptions on spans that catch them: `span.record_exception(e); span.set_status(trace.StatusCode.ERROR)`.
4. Switch to OTLP. Match protocol and port; a mismatch is the most common silent failure:

| `OTEL_EXPORTER_OTLP_PROTOCOL` | Port in `OTEL_EXPORTER_OTLP_ENDPOINT` |
|---|---|
| `grpc` | 4317 |
| `http/protobuf` | 4318 |

```
OTEL_TRACES_EXPORTER=otlp OTEL_METRICS_EXPORTER=otlp OTEL_LOGS_EXPORTER=none
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317 OTEL_EXPORTER_OTLP_PROTOCOL=grpc
```
5. Put the final environment block in the deployment manifest (Dockerfile `ENV`, Kubernetes `env`, or `.env`), and the start command `opentelemetry-instrument <original command>` in the entrypoint. Change only those two places.

### Output
`otel_setup`.

### Quality Gate
- With console exporters, the `create_order` span appears with `parent_id` equal to the server span's `span_id`.
- With OTLP, the collector's own metric `otelcol_receiver_accepted_spans` (check with `curl -s collector:8888/metrics | rg otelcol_receiver_accepted_spans`) increases after a curl. If it does not increase, telemetry is not flowing.
- Tests pass with the same count.

---

## Worked Example

Illustrative only.

```
$ opentelemetry-bootstrap -a requirements
opentelemetry-instrumentation-asgi==0.48b0
opentelemetry-instrumentation-fastapi==0.48b0
opentelemetry-instrumentation-sqlalchemy==0.48b0
$ curl -s localhost:8000/orders > /dev/null
(service stdout)
{
    "name": "GET /orders",
    "context": {"trace_id": "0x4bf92f3577b34da6a3ce929d0e0e4736", "span_id": "0x00f067aa0ba902b7"},
    "kind": "SpanKind.SERVER",
    "attributes": {"http.method": "GET", "http.route": "/orders", "http.status_code": 200}
}
$ curl -s otel-collector:8888/metrics | rg 'otelcol_receiver_accepted_spans'
otelcol_receiver_accepted_spans{receiver="otlp",transport="grpc"} 42
```
After one more curl the value is 43; telemetry is flowing.

---

## Exit Criteria

DONE when console export shows server and manual spans plus the HTTP duration metric, OTLP export increases the collector's accepted-span count, and the environment block and start command are committed in the deployment files.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `pip check` reports opentelemetry version conflicts | **Adjust**: pin all opentelemetry packages to one release line; rerun `pip check`. |
| Phase 2 | No spans printed | **Adjust**: instrumentation for that framework is missing; rerun bootstrap and install its line. |
| Phase 2 | Spans print in dev but not under gunicorn | **Adjust**: apply the fork-model `post_fork` hook from the official docs. |
| Phase 3 | `StatusCode.UNAVAILABLE` or connection errors in stderr | **Retry**: check protocol and port pairing, then network reachability with `nc -zv otel-collector 4317`. |
| Phase 3 | Accepted span count unchanged | **Stop**: do not report success; telemetry is not reaching the collector. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

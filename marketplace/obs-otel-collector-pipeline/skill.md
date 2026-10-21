# OpenTelemetry Collector Pipeline Configuration

**One-line description:** Writes an OpenTelemetry Collector (contrib distribution) config with an OTLP receiver bound for containers, `memory_limiter` then `batch` processors, an OTLP trace exporter, a Prometheus metrics exporter, health check and internal telemetry, validates it with `otelcol-contrib validate`, and proves data flows using the collector's own `otelcol_*` counters.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `signal_plan` (object, required): Output of `obs-signal-inventory`.
- `collector_config_path` (string, required): Where the config file is written, for example `deploy/otel-collector/config.yaml`.
- `trace_backend_endpoint` (string, required): OTLP endpoint of the trace store (Tempo, Jaeger 1.35+ with OTLP, or a vendor), for example `tempo:4317`.

---

## Outputs

- `collector_config` (object): Config file path, the YAML contents, the collector image and version, the validate command output, the Prometheus scrape target for collector-exported metrics (`<host>:8889`) and for collector self-metrics (`<host>:8888`), and the before/after counter values.

---

## Phase 1: Write The Config

### Entry Criteria
- `collector_config_path` does not exist yet, or the user approved replacing it. If a file exists, stop and diff instead of overwriting.
- The collector version is chosen and recorded (image tag `otel/opentelemetry-collector-contrib:<version>`). Do not use `latest` in deployment files.

### Actions
1. Write this file at `collector_config_path`:
```yaml
extensions:
  health_check:
    endpoint: 0.0.0.0:13133

receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  memory_limiter:
    check_interval: 1s
    limit_mib: ${env:OTELCOL_LIMIT_MIB}
  batch: {}

exporters:
  otlp/traces:
    endpoint: tempo:4317
    tls:
      insecure: true
  prometheus:
    endpoint: 0.0.0.0:8889
  debug:
    verbosity: basic

service:
  extensions: [health_check]
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlp/traces]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [prometheus]
```
2. Replace `tempo:4317` with `trace_backend_endpoint`. Set `tls.insecure: true` only when the backend has no TLS; otherwise configure `tls.ca_file`.
3. Bind addresses: recent collector releases default receiver endpoints to `localhost`, which is unreachable from other containers. Keep `0.0.0.0` inside containers, and restrict exposure with network policy rather than with the bind address.
4. `memory_limiter` must be the FIRST processor in every pipeline; `batch` comes after it. `limit_mib` is read from `OTELCOL_LIMIT_MIB`; set it below the container memory limit. The size of the gap is a deployment decision: record the value chosen and its reason. `spike_limit_mib` defaults to 20 percent of `limit_mib` per the processor README.
5. `batch: {}` uses the processor defaults (documented in its README: `send_batch_size` 8192, `timeout` 200ms). Do not change them without a measured reason.
6. Do not enable `resource_to_telemetry_conversion` on the `prometheus` exporter by default. It turns every resource attribute into a label on every series and multiplies cardinality. Resource attributes are already available on the `target_info` series.

### Output
Config file written.

### Quality Gate
- `rg -n "memory_limiter, batch" "$collector_config_path"` returns one hit per pipeline.
- No `latest` tag appears in the deployment file: `rg -n "opentelemetry-collector-contrib:latest" deploy/` returns nothing.

---

## Phase 2: Validate

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Run the validator with the same image version you deploy:
```
docker run --rm -e OTELCOL_LIMIT_MIB=400 \
  -v "$PWD/deploy/otel-collector/config.yaml:/etc/otelcol-contrib/config.yaml" \
  otel/opentelemetry-collector-contrib:<version> validate --config=/etc/otelcol-contrib/config.yaml
```
2. Read the result: exit code 0 and no output means valid. Errors name the component and key, for example `'exporters' unknown type: "prometheusremotewrite"` (component missing from this distribution) or `has invalid keys: endpont` (typo).
3. Fix only the reported key; rerun. Do not delete a pipeline to make validation pass.

### Output
Validated config.

### Quality Gate
- The validate command exits 0; `echo $?` prints `0`.

---

## Phase 3: Run And Prove Flow

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Start the collector with ports 4317, 4318, 8888, 8889 and 13133 published.
2. Health: `curl -s localhost:13133/` returns a JSON status with `"status":"Server available"`.
3. Read self-metrics on port 8888. The internal telemetry endpoint and metric names (some releases add a `_total` suffix) differ by version, so match the prefix:
`curl -s localhost:8888/metrics | rg '^otelcol_(receiver_accepted|receiver_refused|exporter_sent|exporter_send_failed|processor_refused)'`
4. Send telemetry from an instrumented service (or `telemetrygen` from the contrib repo: `telemetrygen traces --otlp-insecure --otlp-endpoint localhost:4317 --traces 10`), then read the counters again.
5. Interpret with this table:

| Counter change | Meaning | Action |
|---|---|---|
| `receiver_accepted_spans` up, `exporter_sent_spans` up | flowing | done |
| `receiver_accepted` up, `exporter_send_failed` up | backend unreachable or rejecting | check `trace_backend_endpoint`, TLS |
| `receiver_refused` up | memory limiter refusing | raise `OTELCOL_LIMIT_MIB` within the container limit or add replicas |
| nothing changes | SDKs not reaching the collector | check SDK endpoint, protocol/port pairing |

6. Check exported app metrics: `curl -s localhost:8889/metrics | rg -c "^http_server"` is greater than zero after app traffic.

### Output
`collector_config`.

### Quality Gate
- Before/after values for `otelcol_receiver_accepted_spans` and `otelcol_exporter_sent_spans` are both pasted and both increased.
- `otelcol_exporter_send_failed_spans` did not increase.
- `curl -s localhost:8889/metrics` contains at least one application metric family.

---

## Worked Example

Illustrative only.

```
$ docker run --rm -e OTELCOL_LIMIT_MIB=400 -v "$PWD/deploy/otel-collector/config.yaml:/etc/otelcol-contrib/config.yaml" \
    otel/opentelemetry-collector-contrib:0.111.0 validate --config=/etc/otelcol-contrib/config.yaml; echo $?
0
$ curl -s localhost:8888/metrics | rg '^otelcol_(receiver_accepted_spans|exporter_sent_spans)'
otelcol_exporter_sent_spans{exporter="otlp/traces"} 0
otelcol_receiver_accepted_spans{receiver="otlp",transport="grpc"} 0
$ telemetrygen traces --otlp-insecure --otlp-endpoint localhost:4317 --traces 10
$ curl -s localhost:8888/metrics | rg '^otelcol_(receiver_accepted_spans|exporter_sent_spans)'
otelcol_exporter_sent_spans{exporter="otlp/traces"} 20
otelcol_receiver_accepted_spans{receiver="otlp",transport="grpc"} 20
```
(`telemetrygen` emits a parent and child span per trace by default, hence 20.)

---

## Exit Criteria

DONE when the config validates with the pinned image, the health endpoint answers, accepted and sent span counters both increase, failed sends do not, and application metrics appear on port 8889.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Config file already exists | **Stop**: show a diff of the proposed change; do not overwrite without approval. |
| Phase 2 | `unknown type` for a component | **Adjust**: the component is not in this distribution; use the contrib image or a different component. |
| Phase 3 | Ports unreachable from other containers | **Adjust**: endpoint bound to `localhost`; set `0.0.0.0` as in Phase 1 step 3. |
| Phase 3 | `exporter_send_failed_spans` rising | **Retry**: verify the backend address with `nc -zv <host> <port>` and TLS settings. |
| Phase 3 | Collector OOM-killed | **Adjust**: `limit_mib` is above the container limit; lower it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

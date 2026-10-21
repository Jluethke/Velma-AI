# Trace Sampling: Head Ratio And Collector Tail Sampling

**One-line description:** Chooses between no sampling, head sampling with `parentbased_traceidratio`, and tail sampling with the collector-contrib `tail_sampling` processor using a decision table, configures the choice with real environment variables and processor keys, keeps RED metrics unaffected by sampling, and measures the actual kept ratio.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `collector_config` (object, required): Output of `obs-otel-collector-pipeline`.
- `sampling_ratio` (number, required): Fraction of traces to keep in the baseline, between 0 and 1, chosen by the user from storage cost or backend ingest limits. This flow does not pick it.
- `tail_latency_threshold_ms` (number, optional): Keep every trace whose duration exceeds this value. Use the SLO latency threshold when one exists.

---

## Outputs

- `sampling_config` (object): The mode chosen and the table row that chose it, SDK environment variables, collector processor YAML (if tail), topology notes, and the measured kept ratio with the counts used to compute it.

---

## Phase 1: Choose The Mode

### Entry Criteria
- `sampling_ratio` is given and is in [0, 1].
- `collector_config` validated.

### Actions
1. Pick the FIRST matching row:

| Order | Condition | Mode |
|---|---|---|
| 1 | `sampling_ratio` == 1 | none: keep everything (SDK default `parentbased_always_on`) |
| 2 | Must keep every error trace or every slow trace | tail sampling in the collector |
| 3 | Otherwise | head sampling in the SDK |

2. Write the reason in `sampling_config`.
3. Record the rule that metrics are unaffected: RED metrics come from SDK metric instruments (for example `http.server.request.duration`), which count every request regardless of trace sampling. Do not derive request rates from sampled spans. If the collector's `spanmetrics` connector is used to compute RED metrics, it must receive spans BEFORE any sampling processor.

### Output
Chosen mode with reason.

### Quality Gate
- The chosen row number and condition are written in the output.

---

## Phase 2: Configure

### Entry Criteria
- Mode chosen.

### Actions
1. Head sampling: set on every service (environment variables from the OpenTelemetry SDK configuration spec):
```
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=<sampling_ratio>
```
`parentbased_` makes downstream services follow the caller's decision so traces are not broken in the middle. Never use plain `traceidratio` on non-root services.
2. Tail sampling: add to the collector config under `processors:` (contrib distribution only):
```yaml
  tail_sampling:
    decision_wait: 30s
    policies:
      - name: keep-errors
        type: status_code
        status_code: {status_codes: [ERROR]}
      - name: keep-slow
        type: latency
        latency: {threshold_ms: <tail_latency_threshold_ms>}
      - name: baseline
        type: probabilistic
        probabilistic: {sampling_percentage: <sampling_ratio * 100>}
```
Policies are OR-combined: a trace is kept if any policy says sample. `decision_wait: 30s` is the processor's documented default, shown explicitly; spans arriving after the decision for their trace are handled as late spans. Omit `keep-slow` if `tail_latency_threshold_ms` is not given.
3. Pipeline order for tail sampling: `processors: [memory_limiter, tail_sampling, batch]`. Leave SDK samplers at the default (`parentbased_always_on`) so the collector sees every span.
4. Topology rule: tail sampling needs every span of a trace on the same collector instance. If more than one collector replica receives traces, put a first tier of collectors with the `loadbalancing` exporter (`routing_key: traceID`) in front of the tail-sampling tier. Without it, traces are judged on partial data.
5. Validate with `otelcol-contrib validate` as in `obs-otel-collector-pipeline` Phase 2.

### Output
Sampling configuration applied.

### Quality Gate
- Head: `env | rg OTEL_TRACES_SAMPLER` inside a running container prints both variables.
- Tail: validate exits 0, and `rg -n "tail_sampling" "$collector_config_path"` shows the processor in the traces pipeline list.
- Tail with more than one replica: a `loadbalancing` exporter config exists, or the replica count is recorded as 1.

---

## Phase 3: Measure The Kept Ratio

### Entry Criteria
- Configuration deployed.

### Actions
1. Generate a known number of root traces: `telemetrygen traces --otlp-insecure --otlp-endpoint <collector>:4317 --traces 1000`.
2. Read collector counters before and after: received spans `otelcol_receiver_accepted_spans`, exported spans `otelcol_exporter_sent_spans`. For tail sampling, also read the processor's own counters: `curl -s <collector>:8888/metrics | rg tail_sampling` (names vary by version; record the ones you see).
3. Kept ratio = delta exported / delta accepted. With head sampling, accepted already excludes dropped traces; measure instead with spans counted in the backend for a `telemetrygen` run versus the number sent.
4. Compare with `sampling_ratio`. With 1000 traces, small deviations are expected from random sampling; report the measured number, not a pass or fail on closeness.
5. Error retention check (tail): send traces with errors (`telemetrygen traces --status-code Error --traces 50`; check `telemetrygen traces --help` for the flag in your version) and confirm all 50 are in the backend.

### Output
`sampling_config` with measured numbers.

### Quality Gate
- Before/after counter values are pasted and the kept ratio is computed from them.
- Tail mode: the count of error traces found in the backend equals the count sent.

---

## Worked Example

Illustrative only.

Input: `sampling_ratio=0.1`, `tail_latency_threshold_ms=300`, two collector replicas.

Phase 1: row 2 (must keep errors and slow traces) gives tail sampling.

Phase 2: loadbalancing tier added; tail tier pipeline `[memory_limiter, tail_sampling, batch]`.

Phase 3:
```
$ telemetrygen traces --otlp-insecure --otlp-endpoint otel-lb:4317 --traces 1000
accepted before 0, after 2000; sent before 0, after 214
kept ratio = 214 / 2000 = 0.107
$ telemetrygen traces --otlp-insecure --otlp-endpoint otel-lb:4317 --traces 50 --status-code Error
backend search status=error since run start: 50 traces
```

---

## Exit Criteria

DONE when the mode is chosen by the table, configuration validates, the kept ratio is measured from counters, and (tail mode) every error trace is retained.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No `sampling_ratio` given | **Stop**: ask the user; do not pick a ratio. |
| Phase 2 | `unknown type: "tail_sampling"` | **Adjust**: switch to the contrib collector image. |
| Phase 2 | Broken traces (missing parents) after head sampling | **Adjust**: a service uses `traceidratio` without `parentbased_`; fix that service. |
| Phase 3 | Error traces missing with tail sampling | **Adjust**: spans of one trace land on different replicas; add the loadbalancing tier. |
| Phase 3 | Collector memory climbs with tail sampling | **Adjust**: traces are held for `decision_wait`; lower `num_traces` or add memory per the processor README, and record the change. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

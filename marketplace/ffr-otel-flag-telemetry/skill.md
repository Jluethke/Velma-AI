# Flag Evaluation Telemetry with OpenTelemetry Hooks

**One-line description:** Attaches an OpenFeature hook that records each flag evaluation using the OpenTelemetry feature flag semantic conventions (`feature_flag.key`, the result variant, the provider name) on the active span, and adds the served variant as a low-cardinality label on request metrics so guardrails can compare variants.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `stack` (string, required): One of `python`, `node`, `go`, `java`, `react`.
- `repo_path` (string, required): Repository root.
- `provider_choice` (object, required): Output of `ffr-provider-select`.

---

## Outputs

- `flag_telemetry` (object): Hook package and registration line, the exact attribute names emitted (with the semantic convention version), the metric name and label carrying the variant, and a captured sample span and metric line.

---

## Phase 1: Pin the Attribute Names

### Entry Criteria
- The service already exports OpenTelemetry traces (an OTel SDK is initialized). If not, record an open question and stop; setting up OTel is outside this flow.

### Actions
1. Open the OpenTelemetry semantic conventions page for feature flags (opentelemetry.io, semantic conventions, Feature Flags) and note the version shown. Attribute names changed across versions; for example older versions used `feature_flag.provider_name` and `feature_flag.variant`, newer ones use `feature_flag.provider.name` and `feature_flag.result.variant`.
2. Find which version your OTel SDK and backend expect: check the semconv package version in the lockfile (`opentelemetry-semantic-conventions` in Python, `@opentelemetry/semantic-conventions` in Node).
3. Write down the exact attribute names you will emit, with that version. Do not mix names from two versions.

### Output
Attribute name list with semconv version.

### Quality Gate
- The semconv version and its source (lockfile line or doc page) are recorded next to each attribute name.

---

## Phase 2: Register the OpenFeature OTel Hook

### Entry Criteria
- Attribute names pinned.

### Actions
1. Use the OpenFeature OpenTelemetry hooks package for `stack`. Confirm the name in the registry before installing:

| Stack | Package to confirm | Typical registration |
|---|---|---|
| node | `@openfeature/open-telemetry-hooks` | `OpenFeature.addHooks(new TracingHook())` (a `MetricsHook` also exists; check the README) |
| python | the OpenTelemetry hook in `openfeature-python-contrib` (check PyPI for the published name) | `api.add_hooks([TracingHook()])` |
| go | `github.com/open-feature/go-sdk-contrib/hooks/open-telemetry` | `openfeature.AddHooks(otelHook)` |
| java | `dev.openfeature.contrib.hooks:otel` | `api.addHooks(new TracesHook())` |
| react | browser tracing is usually not exported; record variant in your analytics event instead | none |

2. Register the hook once, right after the provider is set, at API level so every client gets it.
3. If the hook package emits attribute names from a different semconv version than Phase 1, record the difference. Do not rename attributes by hand inside the hook.
4. Make one request through a flagged path and look at the exported span (console exporter, Jaeger, Tempo, or your backend). The evaluation is recorded as a span event or attributes on the active span depending on the hook version.

### Output
Hook registered and seen in one trace.

### Quality Gate
- `rg -n "addHooks|add_hooks|AddHooks" <repo_path>` shows one registration outside tests.
- One exported span from a real request contains `feature_flag.key` with the flag key (paste the span JSON or screenshot text).

---

## Phase 3: Put the Variant on Request Metrics

### Entry Criteria
- Hook visible in traces.

### Actions
1. Guardrails compare error rate and latency between variants, which needs the variant on metrics, not only traces. Pick one of these:
   - If your backend can derive metrics from spans (for example Tempo metrics-generator, or the OTel Collector `spanmetrics` connector with a configured dimension), add the variant attribute as a dimension.
   - Otherwise, in the request handler, read the evaluation details once and add the variant as an attribute on the request duration and error metrics you already record.
2. Label value must be the variant name (`on`, `off`, `control`, `treatment`). Never put the targeting key, user ID, or flag value objects on a metric label; that creates one time series per user.
3. Prometheus normalizes dots to underscores in label names when it ingests OTel attributes (`feature_flag.result.variant` becomes `feature_flag_result_variant`). Query the exact name you see in the backend.
4. Run one query that splits a request metric by variant and confirm both variants appear (in a test environment with the flag at a split).

### Output
`flag_telemetry`.

### Quality Gate
- A metric query grouped by the variant label returns one series per variant, pasted with its output.
- No label on the metric contains user or account IDs (list the label set returned by the backend).

---

## Worked Example

Illustrative only. Stack `node`, semconv from `@opentelemetry/semantic-conventions` in `package-lock.json`.

```
$ npm view @openfeature/open-telemetry-hooks version
0.4.0
$ rg -n "addHooks" src
src/index.ts:14:OpenFeature.addHooks(new TracingHook());
```
Span event attributes seen in the console exporter:
```
feature_flag.key: "checkout-new-tax-engine"
feature_flag.provider.name: "flagd"
feature_flag.result.variant: "on"
```
Metric query after adding the variant to the request histogram:
```
sum by (feature_flag_result_variant) (rate(http_server_request_duration_seconds_count[5m]))
{feature_flag_result_variant="on"}  2.1
{feature_flag_result_variant="off"} 39.8
```

---

## Exit Criteria

DONE when one semconv version is pinned, the OpenFeature OTel hook is registered once and visible in a real trace, and a request metric can be split by variant with no high-cardinality labels.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Service has no OpenTelemetry setup | **Return**: open question; guardrails cannot split by variant until it exists. |
| Phase 2 | Hook package not found | **Adjust**: check openfeature.dev/ecosystem for the current name; if none, write a hook implementing the SDK `Hook` interface `after` stage that sets span attributes. |
| Phase 3 | Series explosion after adding labels | **Stop**: remove any ID label immediately; keep only the variant. |
| Phase 3 | Only one variant appears | **Adjust**: the flag is not split in that environment; set a split in test and rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

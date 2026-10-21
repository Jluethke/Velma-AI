# Histogram Versus Summary Choice And Bucket Design

**One-line description:** Decides histogram or summary for each latency metric with the Prometheus documentation's rules, places the SLO latency threshold on an exact bucket boundary, overrides SDK default buckets with an OpenTelemetry View or client option per stack, considers native or exponential histograms, and verifies the exposed `le` values with a scrape.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `red_metric_spec` (object, required): Output of `obs-red-metrics-spec`.
- `latency_threshold_seconds` (number, required): The latency the SLO measures against (for example 0.3), set by the user or the product owner. This flow does not choose it.

---

## Outputs

- `histogram_config` (object): Per metric: type (histogram, summary, native histogram), bucket boundaries, the code or config that sets them per stack, the `le` values seen in a scrape, and the series cost per label combination.

---

## Phase 1: Choose The Type

### Entry Criteria
- `latency_threshold_seconds` is given.

### Actions
1. Apply this table from the Prometheus docs page "Histograms and summaries". Use the FIRST matching row.

| Order | Need | Choice |
|---|---|---|
| 1 | Aggregate across instances (any service with more than one replica) | histogram |
| 2 | SLO on "fraction of requests under X seconds" | histogram with X as a bucket boundary |
| 3 | Quantile over arbitrary ranges or in alerts | histogram |
| 4 | Single instance, quantile known in advance, exact quantile required, no aggregation ever | summary acceptable |

2. Summaries compute quantiles in the client; quantiles from several instances cannot be combined, and `avg` of them is not a quantile. In practice, row 1 makes the answer histogram for nearly every service.
3. Record the error property: `histogram_quantile` interpolates linearly within a bucket, so its error is bounded by the bucket width around the quantile. The fraction-under-threshold computed from a bucket boundary is exact.

### Output
Type per metric.

### Quality Gate
- Each metric has a type and the table row number that chose it.

---

## Phase 2: Set Bucket Boundaries

### Entry Criteria
- Type chosen.

### Actions
1. Start from a documented default set and add `latency_threshold_seconds` if it is not already present:

| Source | Default boundaries (seconds) |
|---|---|
| OTel semantic conventions advice for `http.server.request.duration` | 0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10 |
| Python `prometheus_client` `DEFAULT_BUCKETS` | 0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 7.5, 10.0, +Inf |
| Go `prometheus.DefBuckets` | 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10 |

2. Trap: the OTel SDK default explicit bucket boundaries (0, 5, 10, 25, 50, 75, 100, 250, 500, 750, 1000, 2500, 5000, 7500, 10000) are sized for milliseconds. A custom histogram in seconds without advice or a View puts almost every request in the first buckets. Always set boundaries explicitly for custom second-unit histograms.
3. Apply per stack. Change one file.
   - Python OTel: `MeterProvider(views=[View(instrument_name="http.server.request.duration", aggregation=ExplicitBucketHistogramAggregation(boundaries=[...]))], metric_readers=[...])` (from `opentelemetry.sdk.metrics.view`). With `opentelemetry-instrument`, set the provider in code before instrumentation or follow the distro docs for configuring views.
   - Node OTel: `new MeterProvider({ views: [{ instrumentName: 'http.server.request.duration', aggregation: { type: AggregationType.EXPLICIT_BUCKET_HISTOGRAM, options: { boundaries: [...] } } }] })`; the view option shape changed across `@opentelemetry/sdk-metrics` major versions, so check the README of the installed version.
   - Go OTel: `sdkmetric.WithView(sdkmetric.NewView(sdkmetric.Instrument{Name: "http.server.request.duration"}, sdkmetric.Stream{Aggregation: sdkmetric.AggregationExplicitBucketHistogram{Boundaries: []float64{...}}}))`.
   - Java agent: the agent does not take per-instrument bucket settings through a simple env var; check the agent docs for view file configuration support in your version, and record if unsupported.
   - Prometheus client libraries: `Histogram(..., buckets=[...])` (Python), `prometheus.HistogramOpts{Buckets: []float64{...}}` (Go), `new client.Histogram({ buckets: [...] })` (prom-client).
4. Cost: series per histogram = (number of boundaries + 1 for `+Inf`, + `_sum` + `_count`) x label combinations. Write the count. Every added boundary multiplies by the label combinations.
5. Native histograms (Prometheus) or OTel exponential histograms remove the need to pick boundaries. They require Prometheus with native histogram ingestion enabled (feature flag or scrape config, depending on version) and protobuf scraping or OTLP ingestion. Use only if the user's Prometheus version supports it; check its docs. Record as an option, not a default.

### Output
Boundaries and the code change.

### Quality Gate
- `latency_threshold_seconds` appears in the boundary list.
- The series cost number is written.
- Tests pass after the code change.

---

## Phase 3: Verify Exposed Buckets

### Entry Criteria
- Code change deployed to a test environment.

### Actions
1. Scrape and list `le` values: `curl -s <metrics endpoint> | rg '^http_server_request_duration_seconds_bucket' | rg -o 'le="[^"]+"' | sort -u`.
2. Confirm the threshold string as exposed. Prometheus 3 normalizes classic histogram `le` label values on ingestion (for example `le="1"` is stored as `le="1.0"`); query the stored values: `curl -s "$PROM/api/v1/label/le/values" | jq -r '.data[]' | sort -g`.
3. Write the exact stored `le` string for the threshold into `histogram_config`. The SLI recording rules must use that exact string.

### Output
`histogram_config`.

### Quality Gate
- The scrape output contains the threshold bucket.
- The stored `le` string for the threshold is copied from the Prometheus label values output.

---

## Worked Example

Illustrative only.

Input: `latency_threshold_seconds=0.3`, Python service, 3 replicas.

Phase 1: row 1, histogram. Phase 2: OTel advice set plus 0.3 gives 15 boundaries; labels `http_request_method` (4) x `http_route` (6) x `http_response_status_code` (5) = 120 combinations; series = (15 + 1 + 2) x 120 = 2160 per instance.

Phase 3:
```
$ curl -s localhost:8000/metrics | rg '^http_server_request_duration_seconds_bucket' | rg -o 'le="[^"]+"' | sort -u | head -4
le="+Inf"
le="0.005"
le="0.01"
le="0.3"
$ curl -s http://prometheus:9090/api/v1/label/le/values | jq -r '.data[]' | rg '^0\.3'
0.3
```

---

## Exit Criteria

DONE when every latency metric is a histogram (or a justified summary), the threshold is a bucket boundary verified in Prometheus, and the series cost is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No `latency_threshold_seconds` provided | **Stop**: ask the user; do not choose one. |
| Phase 2 | View has no effect | **Adjust**: the instrument name or meter provider differs from what the instrumentation uses; print the scraped name and match it exactly. |
| Phase 2 | Series cost exceeds the cardinality limit from `obs-cardinality-audit` | **Return**: reduce label combinations before reducing boundaries around the threshold. |
| Phase 3 | Threshold `le` missing in Prometheus | **Retry**: confirm the new build is running (check `service.version`), then rescrape. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

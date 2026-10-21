# Prometheus Cardinality Audit And Control

**One-line description:** Measures active series per metric and per label with the Prometheus TSDB status API and `promtool tsdb analyze`, finds the labels that cause growth (raw paths, IDs, unbounded values), and fixes them at the source, in the collector, or with `metric_relabel_configs` and scrape limits, re-measuring after each fix.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `prometheus_url` (string, required): Base URL of Prometheus.
- `service_name` (string, required): The `job` label value of the service to audit.
- `series_limit` (number, optional): A per-target series limit set by the platform owner. If absent, the flow reports numbers without a pass/fail line and records the limit as an open question.

---

## Outputs

- `cardinality_report` (object): Top metrics by series count, top labels by distinct values, the offending label for each top metric, the fix applied and where, and before/after series counts.

---

## Phase 1: Measure

### Entry Criteria
- `curl -s $PROM/-/ready` succeeds.

### Actions
1. Head block statistics (cheap, served from memory):
`curl -s $PROM/api/v1/status/tsdb | jq '.data.seriesCountByMetricName[:10], .data.labelValueCountByLabelName[:10], .data.headStats'`
2. Series per metric for this service only:
`curl -s --data-urlencode 'query=topk(15, count by (__name__) ({job="checkout-api"}))' $PROM/api/v1/query | jq -r '.data.result[] | "\(.value[1]) \(.metric.__name__)"'`
3. Series added per scrape for this target (Prometheus records it automatically): `scrape_series_added{job="checkout-api"}` and `scrape_samples_scraped{job="checkout-api"}`.
4. If you have shell access to the Prometheus data directory, `promtool tsdb analyze /prometheus` prints "Highest cardinality labels" and "Highest cardinality metric names" for a block. Use it on a copy or a read-only mount; do not run write operations on the live data directory.

### Output
Ranked metric and label lists.

### Quality Gate
- The outputs of steps 1 to 3 are pasted with numbers.
- If `series_limit` is set, the total for the job (`count({job="checkout-api"})`) is compared to it and the comparison is written.

---

## Phase 2: Find The Offending Label

### Entry Criteria
- Ranked lists exist.

### Actions
1. For each of the top five metrics, count distinct values of each label:
`for l in $(curl -s "$PROM/api/v1/series" --data-urlencode 'match[]=<metric>{job="checkout-api"}' | jq -r '.data[0] | keys[]'); do echo "$l $(curl -s --data-urlencode "query=count(count by ($l) (<metric>{job=\"checkout-api\"}))" $PROM/api/v1/query | jq -r '.data.result[0].value[1]')"; done`
2. Classify each high-count label:

| Pattern seen in values | Cause | Fix location |
|---|---|---|
| `/orders/8812`, `/orders/8813` | raw path instead of route template | source: use the framework's route template (`http.route`) |
| UUIDs, emails, user IDs | identifier on a metric | source: remove the attribute; put it on spans or logs instead |
| `le` with many values | too many buckets | `obs-histogram-bucket-design` |
| `instance`, `pod` churning | short-lived pods or frequent deploys | expected churn; record it, do not drop these labels |
| Resource attributes copied to every series | `resource_to_telemetry_conversion` enabled | collector exporter config |

3. Do not decide by count alone. Open ten values with `curl -s "$PROM/api/v1/label/<label>/values" | jq -r '.data[:10][]'` and read them.

### Output
Offending label per metric with cause.

### Quality Gate
- Each top-five metric has its highest-count label named with ten sample values pasted.

---

## Phase 3: Fix And Re-measure

### Entry Criteria
- Causes known.

### Actions
1. Prefer the source fix (code) for raw paths and IDs. Change one metric per change and run the tests.
2. When the source cannot change soon, drop or rewrite at ingestion. Choose one:
   - Collector (OTel): `transform` processor with a `metric_statements` OTTL statement such as `delete_key(datapoint.attributes, "user_id")` (contexts and syntax changed across versions; check the transform processor README for your version), placed in the metrics pipeline.
   - Prometheus scrape config:
```yaml
metric_relabel_configs:
  - action: labeldrop
    regex: user_id
```
3. Danger: dropping a label can make two series identical, which causes "duplicate sample for timestamp" errors and wrong values. Only drop a label if the remaining labels still identify each series, or aggregate with a recording rule instead.
4. Add scrape safety limits in the job config (Prometheus `scrape_config` keys): `sample_limit`, `label_limit`, `label_name_length_limit`, `label_value_length_limit`. Values come from `series_limit` or the platform owner; do not invent them. When a scrape exceeds `sample_limit`, the whole scrape fails and `up` becomes 0; alert on that.
5. Re-measure with Phase 1 step 2 after the change has been live for at least one scrape interval. Old series remain in the head block until they go stale and are compacted; judge by `scrape_series_added` and by `count` over the last few minutes, not by total TSDB size.

### Output
`cardinality_report`.

### Quality Gate
- For each fix, before and after values of `count by (__name__)` for that metric are pasted.
- `rg -n "labeldrop" <prometheus config>` shows each drop with a comment naming the metric and reason.

---

## Worked Example

Illustrative only.

```
$ curl -s --data-urlencode 'query=topk(3, count by (__name__) ({job="checkout-api"}))' http://prometheus:9090/api/v1/query \
    | jq -r '.data.result[] | "\(.value[1]) \(.metric.__name__)"'
48210 http_server_request_duration_seconds_bucket
3214 http_server_request_duration_seconds_count
3214 http_server_request_duration_seconds_sum
$ curl -s http://prometheus:9090/api/v1/label/http_route/values | jq -r '.data[:4][]'
/orders
/orders/10021
/orders/10022
/orders/10023
```
Cause: a custom middleware set `http.route` to the raw path. Fix in `app/middleware.py` to use `request.scope["route"].path`. After deploy: `_bucket` series 48210 to 1080.

---

## Exit Criteria

DONE when the top metrics' offending labels are identified from real values, fixes are applied at the source or ingestion with before/after counts, and scrape limits are set or recorded as open.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `/api/v1/status/tsdb` returns 404 | **Adjust**: older Prometheus or a compatible store (Thanos, Mimir) without it; use the `count by (__name__)` query only. |
| Phase 1 | Query times out on large data | **Adjust**: restrict to `{job="..."}` and a single metric at a time. |
| Phase 3 | "duplicate sample for timestamp" after labeldrop | **Retry**: revert the drop; use aggregation via recording rule instead. |
| Phase 3 | Target `up` becomes 0 after limits | **Stop**: the target exceeds `sample_limit`; fix the source before relaxing the limit. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

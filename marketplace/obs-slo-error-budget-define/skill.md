# SLI And SLO Definition With Error Budget

**One-line description:** Defines each SLI as a ratio of good events to valid events using concrete Prometheus series, attaches the user's SLO target and window, computes the error budget in events and minutes, writes the error budget policy decisions the user must make, and stores the result as a machine-readable spec (OpenSLO-shaped YAML).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `signal_plan` (object, required): Output of `obs-signal-inventory`.
- `red_metric_spec` (object, required): Output of `obs-red-metrics-spec`; supplies series names and error rules.
- `histogram_config` (object, required): Output of `obs-histogram-bucket-design`; supplies the exact stored `le` string for the latency threshold.
- `slo_target` (number, required): Target fraction, for example 0.999, chosen by the service owner. This flow never picks it.
- `slo_window_days` (number, required): Rolling window length in days, chosen by the service owner (the Google SRE Workbook examples use 30 days).

---

## Outputs

- `slo_spec` (object): Per SLO: name, SLI type (availability or latency), good-event and valid-event PromQL, target, window, error budget fraction, budget in minutes and in events at current traffic, `job` label, and `policy_open_questions[]`.

---

## Phase 1: Define SLIs

### Entry Criteria
- `slo_target` is in (0, 1) and is not 1. A target of 1 (100 percent) leaves no error budget and makes burn-rate alerting undefined; stop and ask the owner.
- `red_metric_spec` has at least one component.

### Actions
1. For each user-facing RED component, define at most two SLIs:

| SLI type | Good events | Valid events |
|---|---|---|
| Availability | requests not matching the error rule | all requests except excluded routes (health probes) |
| Latency | requests with duration at or below the threshold (the `le` bucket) | all requests except excluded routes |

2. Write the PromQL selectors (rate windows are added by the recording rules flow):
   - availability bad: `http_server_request_duration_seconds_count{job="JOB",http_route!~"/healthz|/readyz",http_response_status_code=~"5.."}`
   - availability valid: `http_server_request_duration_seconds_count{job="JOB",http_route!~"/healthz|/readyz"}`
   - latency good: `http_server_request_duration_seconds_bucket{job="JOB",http_route!~"/healthz|/readyz",le="<stored le string>"}`
   - latency valid: the availability valid selector
3. Take the `le` string from `histogram_config` exactly. A mismatch such as `0.30` vs `0.3` returns no data and makes the SLI look perfect.
4. Measure where users experience the service. If the server-side metric misses failures that happen before the request reaches the service (load balancer 502s), record an open question to add a load balancer SLI.

### Output
SLI selectors per SLO.

### Quality Gate
- Each selector, wrapped as `sum(rate(<selector>[1h]))`, returns a non-empty result: `curl -s --data-urlencode "query=sum(rate(<selector>[1h]))" $PROM/api/v1/query | jq '.data.result|length'` prints 1.

---

## Phase 2: Compute The Error Budget

### Entry Criteria
- SLIs defined.

### Actions
1. Error budget fraction = `1 - slo_target`.
2. Budget in minutes of full outage = `(1 - slo_target) * slo_window_days * 24 * 60`. Example: 0.999 over 30 days = 0.001 x 43200 = 43.2 minutes.
3. Budget in events = `(1 - slo_target) * valid events per window`. Get valid events: `sum(increase(<valid selector>[<slo_window_days>d]))`. If Prometheus retention is shorter than the window (`curl -s $PROM/api/v1/status/flags | jq -r '.data["storage.tsdb.retention.time"]'`), compute from the longest available window and say so.
4. Write the numbers into `slo_spec` with the formulas shown, so a reader can recompute them.

### Output
Budget numbers.

### Quality Gate
- The minutes value equals the formula result to two decimals.
- The retention value is pasted next to the events computation.

---

## Phase 3: Record Policy Questions And Write The Spec

### Entry Criteria
- Budget computed.

### Actions
1. Add these questions to `policy_open_questions` unless the owner already answered them. They are organizational decisions, not technical ones:
   - What happens to feature releases when the budget is exhausted (freeze, require approval, none)?
   - Who receives page alerts versus tickets?
   - Are planned maintenance windows excluded from the SLI?
   - Do synthetic or internal requests count as valid events?
2. Write `slo/checkout-api.slo.yaml` in OpenSLO v1 shape:
```yaml
apiVersion: openslo/v1
kind: SLO
metadata:
  name: checkout-availability
spec:
  service: checkout-api
  indicator:
    metadata: {name: checkout-availability-sli}
    spec:
      ratioMetric:
        counter: true
        bad:   {metricSource: {type: Prometheus, spec: {query: '<availability bad selector>'}}}
        total: {metricSource: {type: Prometheus, spec: {query: '<availability valid selector>'}}}
  timeWindow:
    - duration: 30d
      isRolling: true
  budgetingMethod: Occurrences
  objectives:
    - target: 0.999
```
3. Check field names against the OpenSLO v1 specification before relying on any tool to consume this file; if no tool consumes it, it serves as the human and machine-readable record.
4. If the team uses Sloth, write its spec format instead (`version: "prometheus/v1"`, `slos[].objective` in percent, `sli.events.error_query` and `total_query`), and run `sloth validate -i <file>` (check `sloth --help`).

### Output
`slo_spec`.

### Quality Gate
- `python -c "import yaml,sys; yaml.safe_load(open('slo/checkout-api.slo.yaml'))"` exits 0.
- `policy_open_questions` lists each unanswered question.

---

## Worked Example

Illustrative only.

Input: `slo_target=0.999`, `slo_window_days=30`, threshold `le="0.3"`, job `checkout-api`.

```
$ curl -s --data-urlencode 'query=sum(rate(http_server_request_duration_seconds_count{job="checkout-api",http_route!~"/healthz|/readyz"}[1h]))' \
    http://prometheus:9090/api/v1/query | jq -r '.data.result[0].value[1]'
38.2
```
Budget: 0.001 x 30 x 24 x 60 = 43.2 minutes. Valid events over 30 days at 38.2 req/s about 99.0 million, so budget about 99,000 failed requests. Retention flag shows `15d`, so the 30-day event count is extrapolated from 15 days and marked as such.

Two SLOs written: `checkout-availability` (0.999) and `checkout-latency` (0.999 of requests at or under 0.3 s, target from the owner).

---

## Exit Criteria

DONE when every SLO has verified good and valid selectors, owner-supplied target and window, budget numbers with formulas, a written spec file that parses, and open policy questions listed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Owner gives no target | **Stop**: ask; do not default to any number of nines. |
| Phase 1 | Latency selector returns no data | **Adjust**: the `le` string is wrong; read it again from `histogram_config`. |
| Phase 2 | Retention shorter than the window | **Adjust**: compute on available data and record the gap; long-term storage is a separate decision. |
| Phase 3 | Owner unavailable for policy | **Return**: deliver the spec with the questions open; alerts can still be built. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

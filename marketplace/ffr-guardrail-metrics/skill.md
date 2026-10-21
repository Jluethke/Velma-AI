# Rollout Guardrail Metrics from SLOs

**One-line description:** Defines the guardrail metrics for a rollout (error ratio, latency percentile, saturation, and one business metric) as runnable PromQL queries split by flag variant, with thresholds taken from existing SLOs and multiwindow burn-rate rules from the Google SRE Workbook rather than invented numbers.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flag_telemetry` (object, required): Output of `ffr-otel-flag-telemetry`; gives the variant label name.
- `slo_definitions` (object[], required): Existing SLOs for the affected service: SLI definition, target (for example 99.9 percent of requests succeed), and window.
- `metrics_backend` (string, required): `prometheus` (including Thanos, Mimir, Cortex, VictoriaMetrics with PromQL), `datadog`, or `other`.

---

## Outputs

- `guardrail_metrics` (object[]): One entry per guardrail: name, kind (error, latency, saturation, business), query split by variant, the comparison rule, threshold with its source, evaluation windows, and the alert rule text.

---

## Phase 1: Pick the Guardrails

### Entry Criteria
- `flag_telemetry` names a variant label that exists in the backend.

### Actions
1. Start from `slo_definitions`. Each SLO becomes one guardrail. Do not add guardrails with no SLO unless the table below says so.
2. Make sure these kinds are covered:

| Kind | Typical SLI | If no SLO exists |
|---|---|---|
| error | ratio of 5xx (or failed) responses to all responses | record an open question; use comparison against the control variant only (Phase 2 rule B) |
| latency | share of requests faster than a bound, or p99 | same |
| saturation | CPU, memory, connection pool use of the serving pods | compare canary pods to baseline pods only |
| business | conversion, checkout completion, order value | comparison against control only; owner must name the metric |

3. For each guardrail, write which variant label values to compare: treatment (`on`) against control (`off`), over the same time range.

### Output
Guardrail list.

### Quality Gate
- Every SLO in `slo_definitions` maps to one guardrail, listed by name.
- Every guardrail without an SLO is marked "comparison only" with an open question.

---

## Phase 2: Write the Queries and Rules

### Entry Criteria
- Guardrail list exists.

### Actions
1. Write each query split by variant. Replace label and metric names with the ones in your backend (check with `curl -s "$PROM/api/v1/labels"` and `curl -s "$PROM/api/v1/label/__name__/values"`). Error ratio:
```
sum by (feature_flag_result_variant) (rate(http_server_request_duration_seconds_count{http_response_status_code=~"5.."}[5m]))
/
sum by (feature_flag_result_variant) (rate(http_server_request_duration_seconds_count[5m]))
```
Latency p99:
```
histogram_quantile(0.99, sum by (le, feature_flag_result_variant) (rate(http_server_request_duration_seconds_bucket[5m])))
```
2. Run each query against the backend and confirm it returns one series per variant: `curl -s "$PROM/api/v1/query" --data-urlencode 'query=<query>' | jq '.data.result[] | {metric, value}'`.
3. Choose the comparison rule per guardrail:
   - **Rule A, SLO burn rate** (guardrails with an SLO): the treatment variant must not burn error budget faster than the SRE Workbook multiwindow alert levels. The Workbook (chapter "Alerting on SLOs") gives: page at burn rate 14.4 over 1 hour with a 5 minute short window (2 percent of a 30-day budget spent), page at burn rate 6 over 6 hours with a 30 minute short window (5 percent), ticket at burn rate 1 over 3 days with a 6 hour short window (10 percent). Burn rate = observed error ratio / (1 - SLO target).
   - **Rule B, relative to control** (no SLO): treatment is compared to control with a statistical test, done in `ffr-canary-mann-whitney-judge`. Do not write a fixed "X percent worse" threshold unless the owner gives one.
4. For Rule A, write the alert expression. Example for a 99.9 percent SLO (budget 0.001), page level 1:
```
(
  sum(rate(http_server_request_duration_seconds_count{http_response_status_code=~"5..",feature_flag_result_variant="on"}[1h]))
  / sum(rate(http_server_request_duration_seconds_count{feature_flag_result_variant="on"}[1h]))
) > (14.4 * 0.001)
and
(
  sum(rate(http_server_request_duration_seconds_count{http_response_status_code=~"5..",feature_flag_result_variant="on"}[5m]))
  / sum(rate(http_server_request_duration_seconds_count{feature_flag_result_variant="on"}[5m]))
) > (14.4 * 0.001)
```
5. Note the low-traffic problem: at a 1 percent rollout the treatment may see few requests, and a ratio from a handful of requests is noise. Record the treatment request rate from Phase 2 step 2. If it is low, record an open question to use Rule B with enough samples, or to extend the stage dwell time.

### Output
Queries, rules, and alert expressions.

### Quality Gate
- Each query was run, and its output shows one series per variant (pasted).
- Each threshold cites either an SLO from `slo_definitions` plus the SRE Workbook burn-rate row, or says "Rule B, no fixed threshold".

---

## Phase 3: Validate the Alert Rules

### Entry Criteria
- Expressions written.

### Actions
1. Put Rule A expressions in a Prometheus rules file `guardrails.rules.yml`. Add a `for:` duration only if the owner gives one; otherwise omit `for:` and rely on the two windows (the Workbook design already requires both the long and short window to exceed the rate, which is what suppresses brief spikes).
2. Validate the file: `promtool check rules guardrails.rules.yml`.
3. Unit test one rule with `promtool test rules guardrails.test.yml`, using input series where treatment errors exceed the threshold, and assert the alert fires. Also add a case where only control has errors and assert it does not fire.
4. Add labels `flag_key` and `severity` to each alert so the rollback flow can route on them.

### Output
`guardrail_metrics`.

### Quality Gate
- `promtool check rules` prints `SUCCESS` with the rule count.
- `promtool test rules` prints `SUCCESS` for both the firing and non-firing cases.

---

## Worked Example

Illustrative only. SLO: 99.9 percent of checkout requests succeed over 30 days. Prometheus backend.

```
$ curl -s "$PROM/api/v1/query" --data-urlencode 'query=sum by (feature_flag_result_variant)(rate(http_server_request_duration_seconds_count{service="checkout"}[5m]))' | jq -c '.data.result[] | [.metric.feature_flag_result_variant, .value[1]]'
["on","3.9"]
["off","388.2"]
$ promtool check rules guardrails.rules.yml
Checking guardrails.rules.yml
  SUCCESS: 3 rules found
$ promtool test rules guardrails.test.yml
Unit Testing:  guardrails.test.yml
  SUCCESS
```
Guardrails: checkout error ratio (Rule A, 14.4x and 6x pages, 1x ticket), checkout p99 latency (Rule A from latency SLO), pod CPU (Rule B), checkout completion (Rule B, owner @payments-core). Open question: treatment at 3.9 requests per second makes the 5 minute window thin at 1 percent.

---

## Exit Criteria

DONE when each guardrail has a query that returns one series per variant, a comparison rule whose threshold cites an SLO and the SRE Workbook burn-rate table or is marked relative-to-control, and Rule A alerts pass `promtool check rules` and `promtool test rules`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No SLOs exist | **Return**: all guardrails use Rule B; record an open question to define SLOs. |
| Phase 2 | Query returns no variant label | **Return**: go back to `ffr-otel-flag-telemetry` Phase 3. |
| Phase 2 | `metrics_backend` is not PromQL | **Adjust**: write the same ratio and percentile in the backend's query language; keep the thresholds and windows identical. |
| Phase 3 | `promtool test rules` does not fire on the bad case | **Adjust**: check the label matchers and the `eval_time`; do not loosen the expected alert. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

# SLI Recording Rules For Multi-Window Burn Rates

**One-line description:** Writes Prometheus recording rules that precompute each SLO's error ratio over the five windows the multi-window burn-rate alerts need (5m, 30m, 1h, 6h, 3d), named with the `level:metric:operations` convention, checks them with `promtool check rules`, loads them, and confirms every recorded series exists.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `slo_spec` (object, required): Output of `obs-slo-error-budget-define`.
- `rules_dir` (string, required): Directory of Prometheus rule files in the repo, for example `deploy/prometheus/rules`.

---

## Outputs

- `recording_rules` (object): Rule file path, rule names, the windows, `promtool check rules` output, and a per-series existence check result.

---

## Phase 1: Write The Rules

### Entry Criteria
- `slo_spec` has at least one SLO with bad (or good) and valid selectors.
- The target file `<rules_dir>/slo-<service>.rules.yml` does not exist, or the user approved editing it.

### Actions
1. Windows: 5m, 30m, 1h, 6h, 3d. These are the long and short windows of the three alert rows recommended in the Google SRE Workbook chapter "Alerting on SLOs" (1h/5m, 6h/30m, 3d/6h). The shortest window must still be at least four scrape intervals; if the scrape interval is above 75 s, record that the 5m window is too short and stop.
2. Availability rules, one per window (shown for 5m):
```yaml
groups:
  - name: slo-checkout-api
    rules:
      - record: slo:error_ratio:rate5m
        expr: |
          sum(rate(http_server_request_duration_seconds_count{job="checkout-api",http_route!~"/healthz|/readyz",http_response_status_code=~"5.."}[5m]))
          /
          sum(rate(http_server_request_duration_seconds_count{job="checkout-api",http_route!~"/healthz|/readyz"}[5m]))
        labels:
          slo: checkout-availability
```
3. Latency rules use the good bucket:
```yaml
      - record: slo:error_ratio:rate5m
        expr: |
          1 - (
            sum(rate(http_server_request_duration_seconds_bucket{job="checkout-api",http_route!~"/healthz|/readyz",le="0.3"}[5m]))
            /
            sum(rate(http_server_request_duration_seconds_count{job="checkout-api",http_route!~"/healthz|/readyz"}[5m]))
          )
        labels:
          slo: checkout-latency
```
4. Copy the block for 30m, 1h, 6h and 3d, changing BOTH the record suffix and the range in BOTH numerator and denominator. A mismatched range in one half is the most common error; the Phase 2 grep catches it.
5. Same `record` name with different `slo` labels is correct; the `slo` label keeps them apart.
6. Zero traffic: with no requests the ratio is `NaN` (0/0) or absent. Do not paper over it with `or vector(0)`; that reports a perfect SLI during an outage that blocks all traffic. Record low or zero traffic handling as an open question.

### Output
Rule file.

### Quality Gate
- `rg -c "record: slo:error_ratio:rate" <file>` equals 5 x number of SLOs.
- For each rule, both ranges match the suffix: `rg -n "\[(5m|30m|1h|6h|3d)\]" <file>` shows two hits per rule with the same range as its `record` suffix.

---

## Phase 2: Check And Load

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. `promtool check rules <rules_dir>/slo-checkout-api.rules.yml`. Expect `SUCCESS: 10 rules found` for two SLOs.
2. Load by the deployment method in use:

| Deployment | Load step |
|---|---|
| Plain Prometheus | add the file to `rule_files` in `prometheus.yml`, then `curl -X POST $PROM/-/reload` (requires `--web.enable-lifecycle`) or send SIGHUP |
| Prometheus Operator | wrap the groups in a `PrometheusRule` resource whose labels match the Prometheus `ruleSelector`; `kubectl apply -f` |
| Grafana Mimir / Cortex ruler | `mimirtool rules load <file>` (check `mimirtool rules --help`) |

3. Confirm loading: `curl -s $PROM/api/v1/rules | jq -r '.data.groups[] | select(.name=="slo-checkout-api") | .rules[] | "\(.name) \(.health) \(.lastError)"'`.

### Output
Loaded rules.

### Quality Gate
- `promtool check rules` prints `SUCCESS`.
- Every rule in the group reports `health` = `ok` and empty `lastError`.

---

## Phase 3: Confirm Series Exist

### Entry Criteria
- Rules loaded and at least one evaluation interval has passed.

### Actions
1. For each window and SLO: `curl -s --data-urlencode 'query=slo:error_ratio:rate1h{slo="checkout-availability"}' $PROM/api/v1/query | jq -r '.data.result[0].value[1]'`.
2. Sanity check each value is in [0, 1]. A value above 1 means numerator and denominator selectors differ (for example the numerator lacks the health route exclusion).
3. The 3d rule reads three days of raw samples at every evaluation and costs the most; if Prometheus reports slow rule evaluation (`prometheus_rule_group_last_duration_seconds` for this group approaching `prometheus_rule_group_interval_seconds`), record it and consider a separate group with a longer `interval:` for the 3d rule.

### Output
`recording_rules`.

### Quality Gate
- Every recorded series returns a value in [0, 1] (or `NaN` with zero traffic, recorded).
- `prometheus_rule_group_last_duration_seconds{rule_group=~".*slo-checkout-api"}` is pasted.

---

## Worked Example

Illustrative only.

```
$ promtool check rules deploy/prometheus/rules/slo-checkout-api.rules.yml
Checking deploy/prometheus/rules/slo-checkout-api.rules.yml
  SUCCESS: 10 rules found
$ curl -s -X POST http://prometheus:9090/-/reload
$ curl -s http://prometheus:9090/api/v1/rules | jq -r '.data.groups[] | select(.name=="slo-checkout-api") | .rules[] | "\(.name) \(.health)"' | head -3
slo:error_ratio:rate5m ok
slo:error_ratio:rate30m ok
slo:error_ratio:rate1h ok
$ curl -s --data-urlencode 'query=slo:error_ratio:rate1h' http://prometheus:9090/api/v1/query | jq -r '.data.result[] | "\(.metric.slo) \(.value[1])"'
checkout-availability 0.00041
checkout-latency 0.00733
```

---

## Exit Criteria

DONE when five windows per SLO are recorded, promtool passes, Prometheus reports every rule healthy, and every series returns a value in range.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Scrape interval above 75 s | **Stop**: the 5m window is under four scrapes; report and ask whether to change the scrape interval or the windows. |
| Phase 2 | `promtool` parse error | **Retry**: fix the YAML at the reported line; rerun. |
| Phase 2 | Rules not visible after reload | **Adjust**: the file is not in `rule_files` or the operator `ruleSelector` does not match; fix and reload. |
| Phase 3 | Value above 1 | **Adjust**: align numerator and denominator selectors. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

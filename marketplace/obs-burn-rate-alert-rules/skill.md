# Multi-Window Multi-Burn-Rate SLO Alert Rules

**One-line description:** Derives burn-rate thresholds from the SLO window with the Google SRE Workbook formula, writes three Prometheus alert rules per SLO (two paging, one ticket) that each require both a long and a short window to exceed the threshold, attaches severity, `slo` and `runbook_url`, and checks them with `promtool`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `slo_spec` (object, required): Output of `obs-slo-error-budget-define` (target and window per SLO).
- `recording_rules` (object, required): Output of `obs-sli-recording-rules` (series names per window).
- `rules_dir` (string, required): Directory for Prometheus rule files.
- `runbook_base_url` (string, required): Base URL where runbooks are published, for example `https://git.example.com/org/checkout/blob/main/docs/runbooks/`.

---

## Outputs

- `alert_rules` (object): Alert file path, per alert: name, expr, burn rate, the formula values used, labels, annotations, and `promtool check rules` output.

---

## Phase 1: Derive Thresholds

### Entry Criteria
- Every SLO in `slo_spec` has `slo_target` and `slo_window_days`.
- `recording_rules` lists the 5m, 30m, 1h, 6h and 3d series.

### Actions
1. Use the Workbook's three alert rows ("Alerting on SLOs", recommended multiwindow multi-burn-rate table). Each row is defined by the fraction of the error budget consumed within the long window:

| Row | Budget consumed | Long window | Short window | Severity |
|---|---|---|---|---|
| A | 2 percent | 1h | 5m | page |
| B | 5 percent | 6h | 30m | page |
| C | 10 percent | 3d | 6h | ticket |

The short window is one twelfth of the long window, as in the Workbook.
2. Burn rate for each row = `budget_consumed * (slo_window_days * 24) / long_window_hours`.
   - 30-day window: A = 0.02 x 720 / 1 = 14.4; B = 0.05 x 720 / 6 = 6; C = 0.10 x 720 / 72 = 1.
   - 28-day window: A = 0.02 x 672 / 1 = 13.44; B = 0.05 x 672 / 6 = 5.6; C = 0.10 x 672 / 72 = 0.933.
3. Threshold on the error ratio = `burn_rate * (1 - slo_target)`. For 0.999 and 30 days: A = 0.0144, B = 0.006, C = 0.001.
4. Write each number and the arithmetic into `alert_rules`. Do not copy 14.4 and 6 for a window that is not 30 days.

### Output
Threshold table per SLO.

### Quality Gate
- For each row, recomputing `budget_consumed * window_hours / long_window_hours * (1 - target)` gives the written threshold.

---

## Phase 2: Write The Alert Rules

### Entry Criteria
- Thresholds computed.

### Actions
1. Create `<rules_dir>/slo-<service>.alerts.yml` (a separate file from the recording rules). Row A for availability:
```yaml
groups:
  - name: slo-checkout-api-alerts
    rules:
      - alert: CheckoutAvailabilityBurnRateFast
        expr: |
          slo:error_ratio:rate1h{slo="checkout-availability"} > (14.4 * 0.001)
          and
          slo:error_ratio:rate5m{slo="checkout-availability"} > (14.4 * 0.001)
        labels:
          severity: page
          slo: checkout-availability
          window: 1h
        annotations:
          summary: "checkout-api availability burning error budget at 14.4x"
          description: "1h error ratio {{ $value | humanizePercentage }} exceeds 1.44 percent; 2 percent of the 30d budget is spent within 1h at this rate."
          runbook_url: "https://git.example.com/org/checkout/blob/main/docs/runbooks/CheckoutAvailabilityBurnRateFast.md"
```
2. Rows B (`...BurnRateSlow`, 6h and 30m, severity page) and C (`...BurnRateTicket`, 3d and 6h, severity ticket) follow the same shape with their own thresholds.
3. Why both windows: the long window gives significance (a short spike does not page), the short window makes the alert stop soon after the problem stops. Do not drop the short-window clause.
4. No `for:` clause. The Workbook's design relies on the windows, and `for` delays the page further. If the team insists on `for`, record it as a deviation.
5. `{{ $value }}` in the description is the value of the first operand of `and`, here the long-window ratio.
6. `runbook_url` = `runbook_base_url` + alert name + `.md`. Every alert must have it; `obs-alert-runbook-write` creates the files.
7. Low traffic: a few errors among few requests can exceed the threshold. Do not add a minimum request count with an invented number; record "low traffic guard" as an open question with the observed request rate at the quietest hour (`min_over_time(sum(rate(<valid selector>[5m]))[7d:5m])`).

### Output
Alert file.

### Quality Gate
- `rg -c "^      - alert:" <file>` equals 3 x number of SLOs.
- `rg -c "runbook_url:" <file>` equals the same number.
- `rg -n "for:" <file>` returns nothing, or each hit is recorded as a deviation.

---

## Phase 3: Check And Load

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. `promtool check rules <rules_dir>/slo-checkout-api.alerts.yml` must print `SUCCESS`.
2. Load using the same method as the recording rules (`rule_files` plus reload, or `PrometheusRule`).
3. Confirm: `curl -s $PROM/api/v1/rules?type=alert | jq -r '.data.groups[] | select(.name=="slo-checkout-api-alerts") | .rules[] | "\(.name) \(.health) \(.state)"'`. Expect `ok` health and `inactive` state on a healthy service.
4. Confirm Alertmanager routes `severity="page"` and `severity="ticket"` differently: `amtool config routes test --config.file=alertmanager.yml severity=page slo=checkout-availability` prints the receiver name (check `amtool config routes --help`). If both go to the same receiver, record it.

### Output
`alert_rules`.

### Quality Gate
- `promtool check rules` prints `SUCCESS`.
- Every alert reports `health` = `ok`.
- The `amtool` output for `severity=page` and `severity=ticket` is pasted.

---

## Worked Example

Illustrative only.

Input: `checkout-availability`, target 0.999, window 30 days.

Phase 1:
```
A: 0.02 * 720 / 1  = 14.4  -> threshold 0.0144
B: 0.05 * 720 / 6  = 6     -> threshold 0.006
C: 0.10 * 720 / 72 = 1     -> threshold 0.001
```
Phase 3:
```
$ promtool check rules deploy/prometheus/rules/slo-checkout-api.alerts.yml
  SUCCESS: 6 rules found
$ amtool config routes test --config.file=alertmanager.yml severity=page slo=checkout-availability
oncall-pager
$ amtool config routes test --config.file=alertmanager.yml severity=ticket slo=checkout-availability
team-tickets
```

---

## Exit Criteria

DONE when every SLO has three alerts with derived thresholds, both windows in each expression, a `runbook_url`, promtool success, healthy load, and verified Alertmanager routing.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | SLO window not given | **Stop**: thresholds depend on it. |
| Phase 2 | Recording rule series missing for a window | **Return**: go back to `obs-sli-recording-rules`. |
| Phase 3 | Alert fires immediately on a healthy service | **Adjust**: check the threshold arithmetic and that the SLI value is not `NaN` comparing true; inspect with the Prometheus query API. |
| Phase 3 | `severity=page` routes to a ticket receiver | **Return**: report the Alertmanager route to its owner; do not edit their config unasked. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

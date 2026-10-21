# Prometheus Rule Unit Tests With promtool

**One-line description:** Writes `promtool test rules` unit tests that feed synthetic counter series into the SLI recording rules and burn-rate alerts, asserting exact recorded values with `promql_expr_test`, that each alert fires under a sustained error rate with the expected labels and annotations, and that no alert fires under healthy traffic, then mutation-checks the tests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `recording_rules` (object, required): Output of `obs-sli-recording-rules`.
- `alert_rules` (object, required): Output of `obs-burn-rate-alert-rules`.
- `slo_spec` (object, required): Output of `obs-slo-error-budget-define` (thresholds to compute expected values).

---

## Outputs

- `rule_test_report` (object): Test file path, `promtool test rules` output, the list of positive and negative cases per alert, and the mutation check result.

---

## Phase 1: Write The Test File

### Entry Criteria
- Both rule files pass `promtool check rules`.

### Actions
1. Create `<rules_dir>/tests/slo-checkout-api.test.yml`. Input series use the expanding notation `start+stepxN` (N increments after the start value), one sample per `interval`:
```yaml
rule_files:
  - ../slo-checkout-api.rules.yml
  - ../slo-checkout-api.alerts.yml
evaluation_interval: 1m
tests:
  # Case 1: 10 percent errors, sustained 70 minutes -> fast and slow page alerts fire
  - interval: 1m
    input_series:
      - series: 'http_server_request_duration_seconds_count{job="checkout-api",http_route="/orders",http_response_status_code="200"}'
        values: '0+90x70'
      - series: 'http_server_request_duration_seconds_count{job="checkout-api",http_route="/orders",http_response_status_code="500"}'
        values: '0+10x70'
    promql_expr_test:
      - expr: slo:error_ratio:rate5m{slo="checkout-availability"}
        eval_time: 60m
        exp_samples:
          - labels: 'slo:error_ratio:rate5m{slo="checkout-availability"}'
            value: 0.1
    alert_rule_test:
      - eval_time: 65m
        alertname: CheckoutAvailabilityBurnRateFast
        exp_alerts:
          - exp_labels:
              severity: page
              slo: checkout-availability
              window: 1h
            exp_annotations:
              summary: "checkout-api availability burning error budget at 14.4x"
              description: "1h error ratio 10% exceeds 1.44 percent; 2 percent of the 30d budget is spent within 1h at this rate."
              runbook_url: "https://git.example.com/org/checkout/blob/main/docs/runbooks/CheckoutAvailabilityBurnRateFast.md"
  # Case 2: healthy traffic (0.05 percent errors) -> no alert
  - interval: 1m
    input_series:
      - series: 'http_server_request_duration_seconds_count{job="checkout-api",http_route="/orders",http_response_status_code="200"}'
        values: '0+1999x70'
      - series: 'http_server_request_duration_seconds_count{job="checkout-api",http_route="/orders",http_response_status_code="500"}'
        values: '0+1x70'
    alert_rule_test:
      - eval_time: 65m
        alertname: CheckoutAvailabilityBurnRateFast
        exp_alerts: []
```
2. Compute expected values by hand before running, from the input rates: errors 10 per minute over 100 per minute gives 0.1. Write the arithmetic as a YAML comment. Never run the test first and paste whatever value it prints; that turns the test into a recording of current behavior.
3. Annotation strings must match exactly, including the rendered template (`humanizePercentage` of 0.1 renders `10%`).
4. Add cases for every alert: a positive case where both windows exceed the threshold, a negative case for healthy traffic, and a "spike ended" case for the fast alert (errors for 10 minutes, then healthy) asserting `exp_alerts: []` at a time when the 5m window has recovered but the 1h window still exceeds; this proves the short window clause works.
5. Row C (3d window) needs inputs covering at least the short window (6h); use `interval: 5m` and a larger N to keep the file small, and note that the 3d rate over partial data still computes from what exists.

### Output
Test file.

### Quality Gate
- Every alert name in the alert file appears in at least two `alert_rule_test` entries: one with non-empty `exp_alerts`, one with `exp_alerts: []`. Check: `rg -c "alertname: CheckoutAvailabilityBurnRateFast" <test file>` prints 2 or more.

---

## Phase 2: Run The Tests

### Entry Criteria
- Test file written.

### Actions
1. Run from the tests directory so relative `rule_files` paths resolve: `cd <rules_dir>/tests && promtool test rules slo-checkout-api.test.yml`.
2. Read failures. promtool prints the expected and actual alerts or samples, for example:
```
  FAILED:
    alertname: CheckoutAvailabilityBurnRateFast, time: 1h5m,
        exp:[ 0: Labels:{alertname="...", severity="page", slo="checkout-availability", window="1h"} ... ],
        got:[]
```
3. Resolve a failure with this table. Never change an expected value to match `got` without finding the reason in the rule or the arithmetic.

| Symptom | Likely cause | Fix |
|---|---|---|
| `got: []` for a positive case | `eval_time` before enough data for the long window, or threshold arithmetic wrong | move `eval_time` past the long window, recheck Phase 1 numbers in `obs-burn-rate-alert-rules` |
| Extra labels in `got` | rule adds labels not in `exp_labels` | add them to the test if the rule is correct |
| Annotation mismatch | template renders differently | copy the rendered string from `got` only after confirming the template is correct |
| Sample value off slightly | rate extrapolation at window edges | use `eval_time` well inside the series; compare with the hand value |

### Output
Passing run.

### Quality Gate
- `promtool test rules` prints `SUCCESS` and exits 0.

---

## Phase 3: Mutation Check

### Entry Criteria
- Phase 2 passed.

### Actions
1. Copy the alert file to a scratch location outside the repo, change the fast threshold from `14.4` to `144` in the copy, point a copy of the test file at it, and run `promtool test rules` on the copy.
2. The positive case must FAIL. If it passes, the test does not check the threshold; strengthen the test.
3. Second mutation: delete the short-window clause in the copy; the "spike ended" case must FAIL.
4. Delete the scratch copies. The repo files stay unchanged: `git status --short <rules_dir>` shows only the new test file.

### Output
`rule_test_report`.

### Quality Gate
- Both mutation runs printed `FAILED`.
- `git status --short` shows no modification to the rule or alert files.

---

## Worked Example

Illustrative only.

```
$ cd deploy/prometheus/rules/tests && promtool test rules slo-checkout-api.test.yml
Unit Testing:  slo-checkout-api.test.yml
  SUCCESS
$ sed 's/14.4 \*/144 */g' ../slo-checkout-api.alerts.yml > /tmp/mut/alerts.yml
$ promtool test rules /tmp/mut/test.yml
  FAILED:
    alertname: CheckoutAvailabilityBurnRateFast, time: 1h5m, exp:[...], got:[]
```
Hand arithmetic for case 1: 10/100 = 0.1 > 0.0144 on both 1h and 5m, so the fast alert fires at 65m.

---

## Exit Criteria

DONE when every alert has positive and negative cases, recorded values match hand-computed numbers, `promtool test rules` succeeds, and both mutations make the suite fail.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Rule file paths do not resolve | **Adjust**: paths in `rule_files` are relative to the test file; fix them. |
| Phase 2 | Positive case fails | **Adjust**: follow the symptom table; never edit expectations to match blindly. |
| Phase 2 | Test passes but hand arithmetic disagrees | **Stop**: one of them is wrong; recompute before continuing. |
| Phase 3 | Mutation does not fail | **Retry**: add an assertion that depends on the mutated part, rerun both mutations. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

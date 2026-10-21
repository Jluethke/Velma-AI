# Canary Versus Baseline Mann-Whitney Judgment

**One-line description:** Judges a canary against a same-age baseline for each relative-to-control guardrail using the one-sided Mann-Whitney U test (the nonparametric test Kayenta's judge uses), with interval samples collected from the metrics backend, a significance level supplied by the owner, and a PASS, FAIL, or NOT_ENOUGH_DATA verdict per metric.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `guardrail_metrics` (object[], required): Output of `ffr-guardrail-metrics`; the Rule B (relative-to-control) entries are judged here.
- `canary_metric_samples` (object, required): For each Rule B metric, two lists of per-interval values over the same time range: `canary` and `baseline`. Or the PromQL range query and time range to fetch them.
- `significance_level` (number, optional): The alpha for each one-sided test, set by the owner or the team's release policy. If absent, the verdict is reported as p-values only, with an open question.

---

## Outputs

- `canary_verdict` (object): Per metric: sample counts, medians, U statistic, p-value, direction tested, verdict; and an overall verdict (FAIL if any metric fails).

---

## Phase 1: Collect Comparable Samples

### Entry Criteria
- At least one Rule B guardrail exists.

### Actions
1. Compare the canary against a baseline that started at the same time on the old version (a fresh baseline group with the same pod count and traffic share), not against the long-running production fleet. Long-running pods differ in warm caches, JIT state, and memory growth, which biases the comparison. If no fresh baseline exists, record that the verdict compares against production and add an open question.
2. Fetch per-interval values for each group with a range query over the same window and step:
```
curl -s "$PROM/api/v1/query_range" \
  --data-urlencode 'query=sum(rate(http_server_request_duration_seconds_count{group="canary",http_response_status_code=~"5.."}[1m])) / sum(rate(http_server_request_duration_seconds_count{group="canary"}[1m]))' \
  --data-urlencode "start=2026-10-20T12:00:00Z" --data-urlencode "end=2026-10-20T13:00:00Z" --data-urlencode "step=60" \
  | jq '[.data.result[0].values[][1] | tonumber]'
```
Repeat with `group="baseline"`. Use your real label for canary versus baseline (pod template hash, Deployment name, or flag variant).
3. Remove `NaN` values (intervals with zero requests) from both lists and record how many were removed. Do not replace them with 0.
4. Record the sample count per group. Check the minimum count for the test: with very small samples (for example 4 per group gives 1 / C(8,4) = 1/70, about 0.014), the exact Mann-Whitney test cannot reach small p-values at all. Compute the smallest achievable one-sided p-value for your counts as `1 / C(n1+n2, n1)` and compare it to `significance_level`; if it is larger, the verdict is NOT_ENOUGH_DATA.

### Output
Two clean sample lists per metric.

### Quality Gate
- Both lists for a metric cover the same start, end, and step (shown).
- Removed NaN counts are recorded per list.
- The smallest achievable p-value is computed and compared to `significance_level`.

---

## Phase 2: Run the Test

### Entry Criteria
- Clean samples.

### Actions
1. Choose the direction per metric: for "bad when higher" metrics (error ratio, latency, CPU), test whether the canary is greater than the baseline (`alternative='greater'` with canary first). For "bad when lower" metrics (success rate, conversion), test `alternative='less'`.
2. Run with SciPy (install with `pip install scipy` in a scratch environment; do not add it to the service's dependencies):
```
python -c "from scipy.stats import mannwhitneyu; c=[...]; b=[...]; print(mannwhitneyu(c, b, alternative='greater'))"
```
3. Also report both medians. A significant test with a tiny difference in medians is still a statistical difference; whether it matters is decided by an owner-given tolerance if one exists. Do not invent a tolerance.
4. Apply the verdict table:

| Condition | Verdict |
|---|---|
| smallest achievable p > `significance_level` | NOT_ENOUGH_DATA |
| p < `significance_level` | FAIL (canary significantly worse in the tested direction) |
| otherwise | PASS |
| `significance_level` absent | report p-value, verdict UNDECIDED, open question |

5. Testing several metrics multiplies the chance of a false FAIL. If the owner wants a family-wide error rate, apply a Bonferroni correction (divide `significance_level` by the number of metrics) and state it. Do not apply it silently.

### Output
Per-metric results.

### Quality Gate
- Each metric shows the exact SciPy output line (`MannwhitneyuResult(statistic=..., pvalue=...)`).
- The direction (`greater` or `less`) for each metric matches the table in step 1.

---

## Phase 3: Report the Verdict

### Entry Criteria
- Per-metric results.

### Actions
1. Overall verdict: FAIL if any metric is FAIL; NOT_ENOUGH_DATA if none failed and any is NOT_ENOUGH_DATA; otherwise PASS.
2. On FAIL, the action is the stage rollback command from the rollout plan. Do not rerun the test with a new window hoping for a PASS; that is repeated testing and inflates false passes.
3. On NOT_ENOUGH_DATA, extend the stage (more intervals) and run once more at the planned end; do not lower the significance level.
4. Write `canary_verdict` with all numbers.

### Output
`canary_verdict`.

### Quality Gate
- Overall verdict follows the rule in step 1 from the per-metric verdicts (shown).
- No metric was retested after a FAIL (the report lists one test run per metric per stage).

---

## Worked Example

Illustrative only. One Rule B metric: canary error ratio per minute, 12 one-minute intervals each, `significance_level` 0.01 from the team's release policy.

Smallest achievable one-sided p for 12 and 12: 1 / C(24,12) = 1 / 2704156, far below 0.01, so the test can decide.

```
$ python -c "from scipy.stats import mannwhitneyu; c=[0.0029,0.0031,0.0026,0.0034,0.0028,0.0030,0.0027,0.0033,0.0029,0.0032,0.0025,0.0030]; b=[0.0021,0.0018,0.0025,0.0019,0.0022,0.0020,0.0023,0.0017,0.0024,0.0021,0.0019,0.0022]; print(mannwhitneyu(c, b, alternative='greater'))"
MannwhitneyuResult(statistic=143.5, pvalue=2.025564418128468e-05)
```
Medians: canary 0.00295, baseline 0.0021. p = 2.0e-05 < 0.01, verdict FAIL. Action: stage rollback command from the plan.

---

## Exit Criteria

DONE when every Rule B metric has same-window canary and baseline samples, a one-sided Mann-Whitney result in the correct direction, a verdict from the table using the owner's significance level, and an overall verdict with its action.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No fresh baseline group | **Adjust**: compare against production, state the bias, add an open question. |
| Phase 1 | Most intervals are NaN | **Return**: traffic is too low; extend the stage or add load. |
| Phase 2 | All values identical in both groups | **Adjust**: SciPy may warn or return p = 1; report PASS with the note that the metric has no variation. |
| Phase 3 | Owner asks to rerun after FAIL | **Stop**: roll back first; investigate; a new canary gets a new test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

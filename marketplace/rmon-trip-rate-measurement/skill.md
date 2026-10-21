# False-Trip and Missed-Trip Rate Measurement

**One-line description:** Pools labeled fault injection results and nominal runs, counts missed trips per `must_trip` case and false trips per `must_not_trip` case and per operating hour, and reports each rate with an exact Clopper-Pearson binomial interval or an exact Poisson interval from SciPy, plus the rule-of-three bound when the count is zero.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_fault_results` (object[], required): Output of `rmon-py-pytest-fault-injection` (empty when the stack is C++).
- `cpp_fault_results` (object[], required): Output of `rmon-cpp-gtest-fault-injection` (empty when the stack is Python).
- `nominal_run_log` (string, required): Path to monitor event logs from fault-free nominal runs, with the total operating time per run.
- `timing_fault_results` (object[], optional): Output of `rmon-linux-netem-stress-timing`.
- `can_replay_results` (object[], optional): Output of `rmon-can-vcan-replay-test`.

---

## Outputs

- `trip_rate_report` (object): Per check and pooled: `missed_trips`, `must_trip_trials`, missed-trip proportion with interval; `false_trips_in_cases`, `must_not_trip_trials`, proportion with interval; `false_trips_nominal`, `nominal_hours`, rate per hour with interval; the confidence level used and its source.

---

## Phase 1: Assemble Labeled Trials

### Entry Criteria
- At least one of the result inputs is non-empty.
- The confidence level is given by the user or a requirement. Do not default it silently.

### Actions
1. Concatenate all result rows into one table with columns `source`, `case_id`, `rep`, `label`, `detected`, `on_time`.
2. Rules:
   - `must_trip` and detected within deadline: correct trip.
   - `must_trip` and not detected, or detected after deadline: missed trip (count late separately as `late`, and also as missed for the safety rate).
   - `must_not_trip` and detected: false trip.
3. From `nominal_run_log`, count trip records (`event == "trip"`) per run and sum operating hours. Every nominal trip is a false trip unless an independent record (for example a video or operator note) shows a real envelope violation; such a trip is relabeled `true_positive_nominal` with the evidence path.
   ```
   jq -s '[.[] | select(.event=="trip")] | length' nominal/*.jsonl
   ```

### Output
Labeled trial table.

### Quality Gate
- Row count equals the sum of rows in all result inputs.
- Every relabeled nominal trip has an evidence path.

---

## Phase 2: Compute Rates and Intervals

### Entry Criteria
- Trial table complete.

### Actions
1. Proportions (missed-trip and in-case false-trip) with SciPy 1.7 or newer:
   ```python
   from scipy.stats import binomtest
   r = binomtest(k, n)
   ci = r.proportion_ci(confidence_level=CL, method="exact")   # Clopper-Pearson
   print(k, n, k / n, ci.low, ci.high)
   ```
2. Rate per hour for nominal false trips (exact Poisson interval via chi-square):
   ```python
   from scipy.stats import chi2
   a = 1 - CL
   low = 0.0 if k == 0 else chi2.ppf(a / 2, 2 * k) / 2 / hours
   high = chi2.ppf(1 - a / 2, 2 * k + 2) / 2 / hours
   ```
3. When k is 0, also report the rule of three: the one-sided 95 percent upper bound is about 3/n (Hanley and Lippman-Hand, JAMA 1983). It applies only to a 95 percent level; for other levels use the exact formulas above.
4. Report per check and pooled. Never report a bare "0 percent missed trips"; always give n and the upper bound.
5. Compare against acceptance targets only if the requirements give them. If none exist, write "no acceptance target defined" and leave the decision open.

### Output
Rates with intervals.

### Quality Gate
- Every reported proportion has `k`, `n`, `low`, `high` and the confidence level.
- Running the script twice gives identical numbers.

---

## Phase 3: Write the Report

### Entry Criteria
- Rates computed.

### Actions
1. Write `trip_rate_report.json` and a table in Markdown with rows per check.
2. List every missed trip case ID; each one goes back to the checker flow as a defect.
3. State the limits: results cover only the injected fault models and the operated nominal hours; they say nothing about faults not in the plan.

### Output
`trip_rate_report`.

### Quality Gate
- Every missed trip case ID in the results appears in the report's defect list.
- The report text contains the confidence level and the total nominal hours.

---

## Worked Example

Illustrative only. Python stack: 120 `must_trip` trials, 0 missed; 96 `must_not_trip` trials, 1 false trip; 14.5 nominal hours, 2 false trips; confidence level 0.95 from the test plan.
```
>>> binomtest(0, 120).proportion_ci(confidence_level=0.95, method="exact")
ConfidenceInterval(low=0.0, high=0.0302...)
>>> chi2.ppf(0.975, 6) / 2 / 14.5
0.4982...
```
Missed-trip proportion 0 of 120, upper bound 0.030 (rule of three: 3/120 = 0.025, one-sided). Nominal false-trip rate 0.14 per hour, interval up to 0.50 per hour. No acceptance target in requirements: decision open.

---

## Exit Criteria

DONE when every rate has counts, denominators and an exact interval at a sourced confidence level, missed trips are listed as defects, and the report states its coverage limits.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Confidence level not given | **Stop**: request it; do not assume one. |
| Phase 1 | Nominal hours missing from logs | **Return**: to the test owner; a false-trip rate needs a time denominator. |
| Phase 2 | `binomtest` not found | **Adjust**: upgrade SciPy (`pip install -U scipy`); `binom_test` is the deprecated older function without `proportion_ci`. |
| Phase 3 | Missed trips present | **Return**: to the relevant checker flow; do not drop the cases from the denominator. |

**Do not:** report point estimates alone, drop inconvenient trials, merge late detections into correct trips, or claim the monitor is safe from these numbers alone.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

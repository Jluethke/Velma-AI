# Experiment Sample Ratio Mismatch Check

**One-line description:** Tests whether the observed count of units per experiment arm matches the configured allocation using a chi-square goodness-of-fit test, and when it does not, walks a fixed list of known SRM causes (bucketing key changes, bots, redirects, late or conditional exposure logging, flag caching) before any result is read.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sample_size_plan` (object, required): Output of `ffr-ab-sample-size`; holds the allocation ratio.
- `assignment_counts` (object, required): Count of distinct randomization units per arm from the exposure log, the query used to count them, and the time range.

---

## Outputs

- `srm_result` (object): Observed counts, expected counts, chi-square statistic, p-value, the threshold used and its source, verdict (OK or SRM), and, on SRM, the causes checked with findings.

---

## Phase 1: Count Units Correctly

### Entry Criteria
- The experiment has started and exposure events exist.

### Actions
1. Count distinct randomization units per arm, not events or sessions: `SELECT variant, COUNT(DISTINCT user_id) FROM exposures WHERE flag_key = 'checkout-tax-display' AND ts BETWEEN :start AND :end GROUP BY variant;` (adapt to your warehouse).
2. Count units that appear in more than one arm: `SELECT COUNT(*) FROM (SELECT user_id FROM exposures WHERE flag_key = ... GROUP BY user_id HAVING COUNT(DISTINCT variant) > 1) t;`. A nonzero result means assignment is not sticky; record it.
3. Exposure must be logged at the moment the variant is served (an OpenFeature `after` hook or the provider's exposure event), not when a later page loads. Check where the exposure event is emitted in the code and write the file and line.

### Output
Per-arm unit counts and the multi-arm count.

### Quality Gate
- The counting query is shown and counts distinct units.
- The multi-arm unit count is recorded as a number.

---

## Phase 2: Run the Test

### Entry Criteria
- Counts collected.

### Actions
1. Expected counts = total units times each arm's configured share from `sample_size_plan`.
2. Run:
```
python -c "from scipy.stats import chisquare; obs=[50110,49890]; t=sum(obs); print(chisquare(obs, f_exp=[t*0.5, t*0.5]))"
```
3. Threshold: use the team's policy value if there is one. Otherwise use p < 0.0005, the threshold used by Fabijan et al., "Diagnosing Sample Ratio Mismatch in Online Controlled Experiments" (KDD 2019), and record the source. A strict threshold is used because the check runs on every experiment, and a loose one would flag many healthy experiments.
4. Verdict: SRM if p is below the threshold, otherwise OK.
5. Run the check at the planned analysis date and also early (after the first day). An early SRM saves a week of wasted traffic. Running the SRM check repeatedly is fine; it guards data quality and does not inflate the treatment effect test.

### Output
Statistic, p-value, verdict.

### Quality Gate
- The SciPy output line is pasted.
- The threshold and its source are written next to the verdict.

---

## Phase 3: Diagnose an SRM

### Entry Criteria
- Verdict is SRM, or the multi-arm count is nonzero.

### Actions
1. Do not read the treatment effect. An SRM means the arms are not comparable; any lift is untrustworthy.
2. Check each cause in order and write a finding for each:

| Cause | How to check |
|---|---|
| Targeting key changed during the run (for example anonymous ID replaced by user ID at login) | count units per arm by login state; compare ratios |
| Bucketing salt or `groupId` changed, or allocation changed mid-run | provider audit log for the flag since start |
| Bots or crawlers filtered differently per arm | ratio per arm after removing known bot user agents |
| Treatment redirects or crashes before logging exposure | exposure-to-pageview ratio per arm; client error rate per arm |
| Exposure logged only on a path one arm reaches more often | code location of the exposure event (Phase 1 step 3) |
| Flag result cached per device while assignment is per user | cache code near the evaluation call |

3. Fix the cause, then restart the experiment with a fresh start date. Do not reweight or drop rows to force a balanced count.

### Output
`srm_result`.

### Quality Gate
- On SRM, every cause in the table has a written finding (found, not found, or could not check with reason).
- The report states that no effect was read.

---

## Worked Example

Illustrative only. 50/50 allocation.

Day 1:
```
$ python -c "from scipy.stats import chisquare; obs=[50421,49102]; t=sum(obs); print(chisquare(obs, f_exp=[t*0.5, t*0.5]))"
Power_divergenceResult(statistic=17.48099434301619, pvalue=2.9019424381395044e-05)
```
p = 2.9e-05 < 0.0005 (Fabijan et al. 2019): SRM. Cause check found that treatment's new page redirected before the exposure event in some browsers. Fixed by logging exposure in the server-side `after` hook; experiment restarted.

After restart, day 7:
```
Power_divergenceResult(statistic=0.484, pvalue=0.4866160457640505)
```
OK.

---

## Exit Criteria

DONE when distinct units per arm are counted, the chi-square test is run against the configured split with a sourced threshold, and any SRM is traced through every listed cause with no effect read.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Units appear in more than one arm | **Stop**: fix stickiness (see `ffr-targeting-rules` Phase 3) before trusting any count. |
| Phase 2 | Configured split unknown | **Return**: read it from the provider; do not assume 50/50. |
| Phase 3 | No cause found | **Return**: report SRM with every check listed; the experiment result stays unusable. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

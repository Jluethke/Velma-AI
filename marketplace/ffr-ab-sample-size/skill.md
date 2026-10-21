# A/B Experiment Sample Size and Duration

**One-line description:** Computes the per-arm sample size for a two-arm conversion experiment from the baseline rate, the minimum detectable effect, alpha, and power using the two-proportion normal approximation (and cross-checks it with statsmodels), then converts it into a fixed run duration in whole weeks from eligible daily traffic.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flag_spec` (object, required): Output of `ffr-flag-type-classify`; type must be `experiment`.
- `baseline_rate` (number, required): Current conversion rate of the primary metric for the eligible population, measured over a recent period (state the period).
- `minimum_detectable_effect` (object, required): The smallest change worth detecting, given as absolute (for example 0.01) or relative (for example 10 percent of baseline), chosen by the experiment owner.
- `alpha` (number, optional): Two-sided significance level. If absent, record that 0.05 is used as the conventional value (Fisher's convention, the default in most experimentation tools) and list it as an open question for the owner to confirm.
- `power` (number, optional): Probability of detecting the effect if it is real. If absent, record that 0.80 is used as the conventional value (Cohen, Statistical Power Analysis for the Behavioral Sciences, 1988) and list it as an open question.
- `daily_traffic` (number, required): Eligible units (users, accounts) entering the experiment per day across all arms, measured, with the measurement period stated.

---

## Outputs

- `sample_size_plan` (object): Per-arm sample size, total, the formula inputs, the statsmodels cross-check, allocation ratio, run duration in days and whole weeks, the fixed analysis date, and `open_questions`.

---

## Phase 1: Fix the Inputs

### Entry Criteria
- `flag_spec.type` == "experiment".

### Actions
1. Write the primary metric as a ratio per randomization unit (for example "orders per user who reached checkout"). The unit must match the targeting key from `ffr-targeting-rules`. If the metric is per session but you randomize by user, the variance formula below is wrong; record an open question and stop.
2. Convert the effect to absolute: `p1 = baseline_rate`, `p2 = p1 + absolute_effect` (or `p1 * (1 + relative_effect)`).
3. Record alpha and power with their source (owner input or the named convention).
4. Use a 50/50 allocation unless the owner sets another ratio. Unequal allocation needs more total samples for the same power.

### Output
`p1`, `p2`, alpha, power, ratio.

### Quality Gate
- `p1`, `p2`, alpha, and power are written with a source for each.
- The randomization unit and the metric denominator unit are the same.

---

## Phase 2: Compute the Sample Size

### Entry Criteria
- Inputs fixed.

### Actions
1. Normal approximation for two proportions, equal arms:
```
n_per_arm = (z_{1-alpha/2} + z_{power})^2 * (p1*(1-p1) + p2*(1-p2)) / (p2 - p1)^2
```
Compute with SciPy in a scratch environment:
```
python -c "from scipy.stats import norm; p1,p2,a,pw=0.10,0.11,0.05,0.80; z=norm.ppf(1-a/2)+norm.ppf(pw); print(z**2*(p1*(1-p1)+p2*(1-p2))/(p2-p1)**2)"
```
2. Cross-check with statsmodels (Cohen's h effect size):
```
python -c "from statsmodels.stats.power import NormalIndPower; from statsmodels.stats.proportion import proportion_effectsize as es; print(NormalIndPower().solve_power(effect_size=es(0.11,0.10), alpha=0.05, power=0.80, ratio=1.0, alternative='two-sided'))"
```
The two results should be close (they use slightly different variance forms). Take the larger and round up to a whole number.
3. Do not divide the result by 2 or by the number of arms; it is already per arm. With more than two arms, compute per pairwise comparison against control and record the multiple-comparison open question.

### Output
Per-arm and total sample size.

### Quality Gate
- Both command outputs are pasted, and the chosen value is the ceiling of the larger.

---

## Phase 3: Convert to Duration and Freeze the Plan

### Entry Criteria
- Sample size known.

### Actions
1. Days = total sample size / `daily_traffic`, rounded up.
2. Round up to whole weeks so every weekday is represented equally; user behavior differs by day of week, and Kohavi, Tang, and Xu (Trustworthy Online Controlled Experiments, 2020) recommend running at least one full week for this reason.
3. If unique users repeat across days, `daily_traffic` overstates new units. Use the count of unique new units per day if you can measure it; otherwise record the overstatement as an open question.
4. Write the fixed analysis date = start date + duration. The experiment is analyzed once, on that date, in `ffr-experiment-readout`. Looking at significance daily and stopping when p < alpha inflates false positives (repeated significance testing). If the owner needs early stopping, record an open question for a sequential method (group sequential boundaries or an always-valid test) instead.
5. Write the allocation for the rollout plan: the experiment percentage of eligible traffic and the split between arms.

### Output
`sample_size_plan`.

### Quality Gate
- Duration in days and whole weeks is shown with the division.
- A single fixed analysis date is recorded.

---

## Worked Example

Illustrative only. Baseline checkout conversion 0.10 (last 28 days), relative MDE 10 percent (owner), alpha 0.05 and power 0.80 (conventions, confirmed by owner), 50/50 split, 9000 eligible new users per day.

```
$ python -c "from scipy.stats import norm; p1,p2,a,pw=0.10,0.11,0.05,0.80; z=norm.ppf(1-a/2)+norm.ppf(pw); print(z**2*(p1*(1-p1)+p2*(1-p2))/(p2-p1)**2)"
14748.045...
$ python -c "...NormalIndPower().solve_power(effect_size=es(0.11,0.10), ...)"
14744.14...
```
Per arm 14,749; total 29,498. Days = 29,498 / 9,000 = 3.28, rounded up to 4, then to 1 week (7 days). Analysis date: start + 7 days.

---

## Exit Criteria

DONE when per-arm sample size is computed two ways from sourced inputs, converted into whole weeks from measured traffic, and a single analysis date is frozen.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Metric unit differs from randomization unit | **Stop**: change the metric or the unit; the formula does not apply (a delta-method variance is needed). |
| Phase 2 | The two methods disagree by a large margin | **Adjust**: recheck that `p2` is absolute, not the relative effect. |
| Phase 3 | Duration is longer than the owner accepts | **Return**: report the duration for the owner to choose a larger MDE or accept the time; never shrink the sample silently. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

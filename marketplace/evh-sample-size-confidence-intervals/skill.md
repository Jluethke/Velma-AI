# Sample Size and Confidence Intervals for Eval Scores

**One-line description:** Puts error bars on every eval number: Wilson score intervals for pass rates via statsmodels, cluster bootstrap intervals when items share a group or have several epochs, paired differences between two system versions with McNemar's exact test and a paired bootstrap, and a power calculation that tells you how many items you need to detect the smallest change the product owner cares about.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `scored_results` (string, required): `scored.jsonl` from `evh-results-normalize`.
- `variance_report` (string, required): From `evh-repeat-variance-epochs`; supplies within-item variance and the epoch count.
- `min_detectable_effect` (number, required): Smallest pass-rate change (absolute, for example 0.03) the product owner wants the eval to detect. A product decision, not a statistical default.
- `alpha` (number, optional): Significance level. If absent, use 0.05 (the conventional level since Fisher, 1925) and state it.
- `power` (number, optional): Desired power. If absent, use 0.80 (the convention proposed by Cohen, 1988, Statistical Power Analysis) and state it.

---

## Outputs

- `ci_report` (string): `logs/<system_version>/CI.md` and `ci.json`: per criterion and per stratum the n, pass rate, interval, method used; and when a baseline exists, the paired difference with interval and p-value.
- `required_n` (object): Items needed per criterion (and per stratum when strata are reported separately) to detect `min_detectable_effect` at `alpha` and `power`, compared with items available.

---

## Phase 1: Pick the Interval Method

### Entry Criteria
- `scored.jsonl` has non-error rows.

### Actions
1. Choose the method with this table:

| Data shape | Method | Call |
|---|---|---|
| One epoch, items independent (distinct `group_id` per item) | Wilson score interval | `statsmodels.stats.proportion.proportion_confint(count, nobs, alpha=alpha, method="wilson")` |
| Several items share `group_id` (same conversation, same source doc) | Cluster bootstrap over groups | resample groups with replacement, recompute mean; percentile interval |
| Several epochs per item | Average epochs per item first, then bootstrap over items (or over groups if clustered) | same as above on item means |
| Pass rate of 0 or 1, small n | Wilson (do not use the normal approximation; it gives a zero-width interval) | as row 1 |

2. Do not use the normal approximation `p +/- 1.96*sqrt(p(1-p)/n)` for small samples or rates near 0 or 1; it can exceed [0, 1] and undercover.
3. Errors are excluded from n and reported separately. State the number excluded next to every interval.

### Output
Method chosen per criterion and stratum.

### Quality Gate
- The method table entry used is written next to every interval in `CI.md`.

---

## Phase 2: Compute Intervals

### Entry Criteria
- Methods chosen.

### Actions
1. Wilson: run the statsmodels call per criterion and per stratum.
2. Cluster bootstrap (write `evals/tools/cluster_boot.py`): `rng = numpy.random.default_rng(20261020)`; for `b` in range(B): sample group ids with replacement, concatenate their item means, compute the mean; take `numpy.percentile(stats, [100*alpha/2, 100*(1-alpha/2)])`. Use `B = 9999` to match the default `n_resamples` of `scipy.stats.bootstrap`, or call `scipy.stats.bootstrap` on group-level means when every group has the same size.
3. Strata: compute intervals per stratum. Small strata get wide intervals; print them anyway. Never report a stratum pass rate without its n.
4. Paired comparison against a baseline run on the same items (when `logs/<baseline>/scored.jsonl` exists):
   - Binary per item, one epoch: build the 2x2 table of (baseline pass/fail) by (candidate pass/fail) on items valid in both runs, then `statsmodels.stats.contingency_tables.mcnemar(table, exact=True)`; read `.pvalue`. Only the discordant cells matter.
   - Several epochs or clustered: paired bootstrap on per-item (or per-group) differences `candidate_mean - baseline_mean`.
   - Pairing removes between-item variance; never compare two runs on the same items with unpaired intervals.
5. Multiple criteria or strata compared at once inflate false alarms. If more than one comparison decides a release, apply the Holm correction: `statsmodels.stats.multitest.multipletests(pvals, alpha=alpha, method="holm")`.

### Output
`ci.json` and `CI.md`.

### Quality Gate
- Sanity check run once: `proportion_confint(9, 10, alpha=0.05, method="wilson")` prints approximately `(0.596, 0.982)`; if not, the call is wrong.
- Every pass rate in `CI.md` has n, interval, method, and errors excluded.

---

## Phase 3: Required Sample Size

### Entry Criteria
- Baseline pass rate `p1` known (from this run).

### Actions
1. Unpaired (two separate item sets): `from statsmodels.stats.power import NormalIndPower`; `from statsmodels.stats.proportion import proportion_effectsize`; `es = proportion_effectsize(p1, p1 - min_detectable_effect)`; `n = NormalIndPower().solve_power(effect_size=abs(es), alpha=alpha, power=power, ratio=1.0, alternative="two-sided")`. This is items per arm.
2. Paired (same items, the normal case for regression evals): the needed n depends on the discordant rate `pd`. Estimate it from Phase 2's table (share of items that flip), then use Connor's (1987, Biometrics) approximation for McNemar's test, `n = (z_a*sqrt(pd) + z_b*sqrt(pd - d**2))**2 / d**2` with `d = min_detectable_effect`, `z_a = scipy.stats.norm.ppf(1 - alpha/2)`, `z_b = scipy.stats.norm.ppf(power)`, and confirm it by simulation: draw paired outcomes with the observed flip rates shifted by `min_detectable_effect`, run the exact McNemar test, and find the smallest n where the rejection rate reaches `power`. Write the simulation in `evals/tools/power_sim.py` with a fixed seed.
3. Compare required n to available n per criterion. If available is smaller, write "cannot detect a change of size `min_detectable_effect` with this set" into `required_n` and `CI.md`. Do not claim "no regression" from an underpowered test; report "no detectable regression at this n".
4. Feed the gap back to `evh-test-set-stratify` (`target_items_per_stratum`).

### Output
`required_n`.

### Quality Gate
- `required_n` lists required and available n for every criterion that gates a release.
- `CI.md` uses the phrase "no detectable regression" (never "no regression") wherever a non-significant result is reported.

---

## Worked Example

Illustrative only. 197 items, C2 pass 180/195 valid (2 errors), groups are conversations (1.3 items per group on average), baseline v41 exists. `min_detectable_effect` 0.03; alpha 0.05 and power 0.80 stated as conventions.

- Phase 1: clustered, so cluster bootstrap.
- Phase 2: C2 0.923, 95% cluster bootstrap CI 0.882 to 0.959. Baseline table: both pass 171, baseline only 6, candidate only 9, both fail 9. `mcnemar([[171,6],[9,9]], exact=True).pvalue` = 0.61. Stratum `refused_benign_request`: 25/30, CI 0.66 to 0.93 (Wilson).
- Phase 3: unpaired n per arm at p1 0.92 vs 0.89 is about 745. Paired, with the observed 7.7 percent discordant rate, Connor's (1987) approximation `n = (z_a*sqrt(pd) + z_b*sqrt(pd - d**2))**2 / d**2` gives about 670 items; the simulation is run to confirm it. Available 195: "no detectable regression at this n; detectable change at this n is about 0.06".

---

## Exit Criteria

DONE when every reported pass rate has n, interval and method, every version comparison is paired with a p-value or interval, and required versus available n is stated for every release-gating criterion.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `group_id` missing | **Return**: add groups in `evh-test-set-stratify`; until then state that intervals assume independence. |
| Phase 2 | Baseline and candidate ran on different item sets | **Adjust**: restrict the paired test to the intersection and report how many items were dropped. |
| Phase 2 | Bootstrap interval unstable between seeds | **Retry**: increase B and report the seed. |
| Phase 3 | `min_detectable_effect` not provided | **Stop**: ask the product owner; do not pick one. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

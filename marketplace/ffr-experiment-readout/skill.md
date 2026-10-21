# Experiment Readout and Ship Decision

**One-line description:** Reads out a two-arm conversion experiment once at its planned analysis date with a two-proportion z-test and a confidence interval for the difference, checks guardrails, and applies a fixed decision table to ship, not ship, or record no detected effect.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sample_size_plan` (object, required): Output of `ffr-ab-sample-size`; holds alpha, MDE, sample size, and the analysis date.
- `srm_result` (object, required): Output of `ffr-srm-check`; verdict must be OK.
- `experiment_results` (object, required): Per arm: units, conversions for the primary metric, and the guardrail metric values, from the warehouse queries (queries included).

---

## Outputs

- `experiment_decision` (object): z statistic, p-value, observed difference and its confidence interval, guardrail results, the decision (SHIP, DO_NOT_SHIP, NO_DETECTED_EFFECT), the winning variant to keep in code, and the flag action.

---

## Phase 1: Confirm the Readout Is Allowed

### Entry Criteria
- Today is on or after the analysis date in `sample_size_plan`.

### Actions
1. If `srm_result.verdict` is not OK, stop. No readout.
2. Confirm each arm reached the planned per-arm sample size. If not, do not read the result early; extend to the planned size or record an open question.
3. Confirm the allocation did not change during the run (provider audit log). A change means the start date resets.

### Output
Readout allowed or blocked.

### Quality Gate
- SRM verdict OK, per-arm counts at or above the plan, and the audit log shows no allocation change (each shown).

---

## Phase 2: Compute the Effect

### Entry Criteria
- Readout allowed.

### Actions
1. Two-proportion z-test with pooled variance:
```
python -c "
import math; from scipy.stats import norm
xt,nt,xc,nc=4620,42000,4310,42000
p=(xt+xc)/(nt+nc); se=math.sqrt(p*(1-p)*(1/nt+1/nc)); z=(xt/nt-xc/nc)/se
print('z',z,'p',2*norm.sf(abs(z)))"
```
2. Confidence interval for the difference (unpooled Wald) at level 1 - alpha:
```
python -c "
import math; from scipy.stats import norm
xt,nt,xc,nc,a=4620,42000,4310,42000,0.05
d=xt/nt-xc/nc; se=math.sqrt(xt/nt*(1-xt/nt)/nt+xc/nc*(1-xc/nc)/nc); k=norm.ppf(1-a/2)
print('diff',d,'ci',d-k*se,d+k*se)"
```
statsmodels offers the same (`proportions_ztest`, `confint_proportions_2indep`); if you use it, record the method argument because defaults differ by version.
3. Compute each guardrail the same way, in the "worse" direction. Guardrails are checked for harm, not for improvement.
4. Do not slice the result by segments to find a significant subgroup after the fact. If segments were pre-registered in the plan, report them with a multiple-comparison note.

### Output
Effect, interval, guardrails.

### Quality Gate
- Both command outputs are pasted, and the inputs match `experiment_results`.

---

## Phase 3: Apply the Decision Table

### Entry Criteria
- Effect computed.

### Actions
1. Decide with the first matching row:

| Row | Condition | Decision | Flag action |
|---|---|---|---|
| 1 | any guardrail significantly worse at alpha | DO_NOT_SHIP | turn treatment off; keep control in code |
| 2 | p < alpha and the difference is in the good direction | SHIP | roll treatment to 100 percent through the rollout plan; keep treatment in code |
| 3 | p < alpha and the difference is in the bad direction | DO_NOT_SHIP | turn treatment off; keep control |
| 4 | p >= alpha | NO_DETECTED_EFFECT | the owner chooses which variant to keep for non-metric reasons; record that no effect was detected, not that there is no effect |

2. Write the variant to keep in code. This feeds `ffr-flag-removal-pr`.
3. Report the interval, not only the p-value. An interval that includes values smaller than the MDE in a SHIP decision means the true effect may be below what was worth detecting; say so.
4. Change the flag type from experiment to release in the provider if you will ramp to 100 percent, so stale detection uses the release lifetime.

### Output
`experiment_decision`.

### Quality Gate
- The decision names the table row used.
- The variant to keep in code is recorded.

---

## Worked Example

Illustrative only. Plan: alpha 0.05, 42,000 per arm needed and reached, SRM OK.

```
z 3.4701032694804566 p 0.0005202582929865111
diff 0.007380952380952377 ci 0.0032123070729771705 0.011549597688927583
```
Treatment 11.00 percent vs control 10.26 percent; difference 0.74 points (95 percent CI 0.32 to 1.15 points). Guardrails: checkout p99 latency and payment error ratio not significantly worse. Row 2: SHIP, keep `treatment`. The interval's lower end (0.32 points) is below the MDE of 1.03 points (10 percent of baseline), recorded in the report.

---

## Exit Criteria

DONE when the readout ran once on or after the planned date with SRM OK and full sample, the effect and interval are computed and pasted, guardrails are checked for harm, and a decision row and the variant to keep are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | SRM verdict not OK | **Stop**: return to `ffr-srm-check` Phase 3. |
| Phase 1 | Sample below plan | **Return**: extend the run; do not read early. |
| Phase 2 | Inputs do not match the warehouse query output | **Retry**: rerun the queries and recompute. |
| Phase 3 | Owner wants to ship on row 4 citing the point estimate | **Adjust**: allowed as an owner decision, recorded as "no detected effect", never as a win. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

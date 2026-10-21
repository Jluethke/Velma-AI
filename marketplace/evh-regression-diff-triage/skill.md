# Regression Diff Triage Between Two Eval Runs

**One-line description:** Joins a candidate run and a baseline run item by item, lists every flip (pass to fail and fail to pass) per criterion and stratum, separates real regressions from judge noise and run-to-run variance using the instability lists, assigns each confirmed regression to a failure taxonomy category, and writes a triage table that names the item, the evidence and the next action.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `scored_results` (string, required): Candidate `scored.jsonl` from `evh-results-normalize`.
- `baseline_results` (string, optional): Baseline `scored.jsonl`. If absent, use the newest run under `logs/` whose `system_version` equals the one in `evals/baseline/<feature>.json`.
- `failure_taxonomy` (object[], required): From `evh-trace-error-analysis`; regressions are assigned to its categories.
- `alpha` (number, optional): Significance level used by the paired tests; read from `ci_report` when absent.

---

## Outputs

- `regression_triage` (string): `logs/<system_version>/TRIAGE.md` and `triage.json`: per criterion the paired table and p-value, per stratum flip counts, and one row per pass-to-fail flip with item id, stratum, criterion, baseline and candidate output excerpts, judge evidence quote, noise flag, taxonomy category, and action.

---

## Phase 1: Join and Count Flips

### Entry Criteria
- Both runs exist and their manifests list the same dataset sha256. If they differ, stop: the runs are not comparable item by item.

### Actions
1. Load both files; keep non-error rows; average epochs per item and criterion into a pass probability; call an item passed in a run when its pass probability is 1 for one-epoch runs, or report pass probability deltas directly for multi-epoch runs.
2. Join on `(item_id, criterion)`. Items valid in only one run go in a `dropped` list with the reason (error in the other run).
3. Per criterion: counts of pass-pass, pass-fail (regression), fail-pass (fix), fail-fail. Exact McNemar p-value on the discordant pair (`statsmodels.stats.contingency_tables.mcnemar(table, exact=True)`).
4. Per stratum: regression and fix counts. A stratum where regressions outnumber fixes is flagged even when the overall test is not significant; small strata will not reach significance but the flips are still real items to read.

### Output
Flip tables per criterion and stratum.

### Quality Gate
- `pass-pass + pass-fail + fail-pass + fail-fail` equals the number of joined items for each criterion.
- Dataset sha256 values from both manifests are printed and equal.

---

## Phase 2: Separate Noise from Regression

### Entry Criteria
- Flip list exists.

### Actions
1. For each pass-to-fail flip apply in order:

| Check | Source | If true |
|---|---|---|
| Item listed as inconsistent across epochs for the baseline | `VARIANCE.md` | mark `noise: sampling`; keep it, but it is not evidence alone |
| Judge verdict for this item unstable | `evals/judge/UNSTABLE.md` | mark `noise: judge`; rerun the judge 3 times uncached on this item and take the majority |
| Judge criterion not approved | `judge_approved` from `evh-judge-calibration` | mark `unvalidated`; a human reads it |
| None of the above | | mark `confirmed` |

2. For every `confirmed` flip, read both outputs in full and the judge's `evidence_quote`. Write one line on what changed ("candidate now answers only the first of two questions").
3. Assign each confirmed flip to a `failure_taxonomy` category. If none fits, add a new category and return it to `evh-trace-error-analysis` so the taxonomy and test set grow.

### Output
Annotated flip rows.

### Quality Gate
- Every pass-to-fail flip has a noise flag and, if `confirmed`, a one-line change description and a category.

---

## Phase 3: Decide Actions

### Entry Criteria
- Annotated flips exist.

### Actions
1. Assign each confirmed regression an action:

| Situation | Action |
|---|---|
| Critical item regressed | Block release; fix the prompt or code for this failure class first |
| Several confirmed flips share one category | Fix the root cause; add 2 or more new items of that category to dev for iteration |
| Single confirmed flip, standard severity, paired test not significant | Record; ship decision is the owner's, with the flip listed |
| Flip caused by a scorer bug | Fix the scorer in its own commit; rerun both runs' scoring |

2. Write `TRIAGE.md` with the tables from Phase 1 and the rows from Phase 2, sorted critical first, then by category size.
3. Do not adjust golden targets to turn a regression into a pass. If the golden target is wrong, fix it through `evh-golden-labels-annotation` with adjudication and rescore both runs.

### Output
`regression_triage`.

### Quality Gate
- Every confirmed regression has exactly one action from the table.
- Any golden target change is backed by an adjudication row in `human_labels.jsonl`.

---

## Worked Example

Illustrative only. Baseline v41 vs candidate v42 on 197 items, criteria C2 and C3.

- Phase 1: C3 table: pass-pass 160, pass-fail 14, fail-pass 4, fail-fail 19; `mcnemar([[160,14],[4,19]], exact=True).pvalue` about 0.031. Stratum `ignored_second_question`: 9 regressions, 1 fix.
- Phase 2: of 14 C3 regressions, 3 inconsistent in `VARIANCE.md` (sampling), 1 judge-unstable (majority rerun says pass), 10 confirmed. All 10 are multi-question messages where v42 drops the second question; category `ignored_second_question`.
- Phase 3: action "fix root cause"; the new prompt line "Answer every question" was removed in v42's shortening; 4 new dev items added. No critical regressions.

---

## Exit Criteria

DONE when every pass-to-fail flip is counted, flagged for noise, described and categorized if confirmed, and every confirmed regression has one action.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Dataset hashes differ | **Stop**: rerun the baseline on the current dataset version. |
| Phase 1 | Baseline not found | **Return**: run the baseline version through the harness first. |
| Phase 2 | Majority judge rerun still split | **Adjust**: send the item to a human reviewer; record the human label. |
| Phase 3 | Pressure to edit golden targets to pass | **Stop**: golden changes only via adjudication. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

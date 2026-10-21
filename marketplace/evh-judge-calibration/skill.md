# Judge Calibration Against Human Labels

**One-line description:** Runs the LLM judge on the human-labeled calibration items it never saw as few-shot examples, measures judge-to-human agreement per criterion (Cohen's kappa, confusion matrix, true positive and true negative rates) next to the human-to-human agreement ceiling, iterates the judge prompt on dev only, then confirms once on a held-out labeled slice and emits an approve or reject verdict per criterion.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `judge_prompt` (string, required): `evals/judge/` from `evh-judge-prompt-design`.
- `human_labels` (string, required): `evals/data/human_labels.jsonl` with adjudicated labels from `evh-golden-labels-annotation`.
- `project_dir` (string, required): Repository root containing the judge runner.
- `stack` (string, required): `python` or `node`; selects the judge runner command.
- `min_judge_agreement` (number, optional): The project's required judge-to-human agreement per criterion. If absent, the flow reports against Krippendorff's (2004) reliability levels and the human ceiling and leaves approval as an open question.

---

## Outputs

- `calibration_report` (string): `evals/judge/CALIBRATION.md` with, per criterion: item count, confusion matrix, kappa, true positive rate (judge says fail when humans say fail), true negative rate, human-to-human kappa, prompt versions tried.
- `judge_approved` (object): Per criterion `approved` true or false with the reason, and the corrected-pass-rate parameters (judge TPR and TNR) for use in reporting.

---

## Phase 1: Split the Labeled Items

### Entry Criteria
- `human_labels.jsonl` has adjudicated labels; `judge_config.yaml` lists few-shot ids.

### Actions
1. Remove every few-shot id from the labeled pool. A judge scored on its own examples looks better than it is.
2. Split the remaining labeled items into `calib_dev` (for prompt iteration) and `calib_holdout` (scored once at the end) with a seeded stratified split on the human label: `sklearn.model_selection.train_test_split(ids, stratify=labels, test_size=H, random_state=20261020)`. `H` is the holdout share chosen by the user; record it.
3. Count labels per class in each split. If the minority class (usually `fail`) has very few items, kappa and TNR will have wide intervals; report the counts, do not hide them.

### Output
`evals/judge/calib_dev.jsonl` and `evals/judge/calib_holdout.jsonl`.

### Quality Gate
- `python -c "import json,yaml;f={i for k in yaml.safe_load(open('evals/judge/judge_config.yaml'))['criteria'] for i in k['few_shot_ids']};c={json.loads(l)['item_id'] for l in open('evals/judge/calib_dev.jsonl')}|{json.loads(l)['item_id'] for l in open('evals/judge/calib_holdout.jsonl')};print(len(f&c))"` prints `0`.

---

## Phase 2: Measure and Iterate on calib_dev

### Entry Criteria
- Splits exist.

### Actions
1. Run the judge on `calib_dev` outputs:
   - `stack == python`: `python evals/judge_runner.py --in evals/judge/calib_dev.jsonl --out evals/judge/calib_dev_verdicts.jsonl --criterion <id>`
   - `stack == node`: `npx tsx evals/judgeRunner.ts --in evals/judge/calib_dev.jsonl --out evals/judge/calib_dev_verdicts.jsonl --criterion <id>`
2. Compute per criterion, treating `fail` as the positive class (the judge's job is to catch failures):
   `from sklearn.metrics import cohen_kappa_score, confusion_matrix`; `cm = confusion_matrix(human, judge, labels=["fail","pass"])`; `tpr = cm[0,0]/cm[0].sum()`; `tnr = cm[1,1]/cm[1].sum()`; `kappa = cohen_kappa_score(human, judge)`.
3. Compare with the human-to-human kappa from `evals/data/AGREEMENT.md`. The judge cannot be expected to agree with the adjudicated label better than humans agree with each other; that number is the ceiling.
4. Do not report raw percent agreement alone. With a skewed label distribution, a judge that always says `pass` gets high percent agreement and zero TPR.
5. Read every disagreement. Classify each with this table and act:

| Disagreement pattern | Action |
|---|---|
| Judge misreads an anchor the same way repeatedly | Rewrite the anchor wording in the judge prompt (not the human rubric) and add a few-shot example from dev covering it |
| Judge lacks context the human had | Add that context to the judge inputs |
| Human label looks wrong on re-read | Return it to adjudication; do not silently change it |
| Judge ignores an instruction (for example grades tone) | Move that instruction next to the verdict format and restate it |

6. After each prompt change, rerun step 1 and 2 and log the version and metrics in `CALIBRATION.md`. Change one thing per iteration.

### Output
Iteration log and the final candidate judge prompt.

### Quality Gate
- `CALIBRATION.md` has one row per iteration with prompt sha256, kappa, TPR, TNR, and item counts.
- Every disagreement in the last iteration is listed with its pattern from the table.

---

## Phase 3: Holdout Confirmation and Verdict

### Entry Criteria
- Final candidate prompt chosen on `calib_dev`.

### Actions
1. Run the judge once on `calib_holdout` with the final prompt. Do not change the prompt after seeing holdout results; if you do, the holdout becomes dev and you need fresh labeled items.
2. Compute kappa, TPR, TNR with a 95 percent bootstrap interval: `scipy.stats.bootstrap((idx,), stat_fn, confidence_level=0.95, method="percentile", random_state=0)` resampling item indices (the default `n_resamples` is 9999).
3. Approval rule per criterion:
   - If `min_judge_agreement` is given: `approved = kappa_holdout >= min_judge_agreement`.
   - If not given: report kappa against Krippendorff's 0.800 and 0.667 reliability levels and the human ceiling; set `approved: null` and add the decision to open questions.
   - If the human-to-human kappa itself is below the level used, `approved: false` regardless: the rubric is not reliable enough to calibrate against.
4. Record TPR and TNR in `judge_approved`. `evh-eval-report` uses them to state the judge's measured error rates next to every judge-graded pass rate.
5. Criteria with `approved: false` must be graded by humans or rewritten; do not ship judge scores for them.

### Output
`calibration_report` and `judge_approved`.

### Quality Gate
- Holdout metrics appear exactly once per criterion in `CALIBRATION.md` with confidence intervals.
- `judge_approved` has a value and reason for every judge criterion.

---

## Worked Example

Illustrative only. Criterion C2, 240 labeled items, few-shot ids removed (3), H = 0.3, `min_judge_agreement` = 0.8 (set by the team lead).

- Phase 1: `calib_dev` 166 (21 fail), `calib_holdout` 71 (9 fail). Overlap check prints `0`.
- Phase 2: iteration 1 kappa 0.62, TPR 0.67, TNR 0.97. Seven misses were "we can look into a refund" replies; anchor clarified and a dev example added. Iteration 2 kappa 0.83, TPR 0.86, TNR 0.97. Human-to-human kappa for C2 was 0.91.
- Phase 3: holdout kappa 0.82 (95% CI 0.61 to 0.96), TPR 0.89 (8 of 9), TNR 0.97. `approved: true`; the wide interval is noted because holdout has only 9 fail items.

---

## Exit Criteria

DONE when every judge criterion has holdout kappa, TPR and TNR with intervals, a comparison with the human ceiling, and an approval value with its reason.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Too few labeled fail items to estimate TPR | **Return**: label more items from strata likely to fail (see `failure_taxonomy`) before calibrating. |
| Phase 2 | Judge agreement does not improve across iterations | **Adjust**: try a different judge model or split the criterion; record each attempt. |
| Phase 3 | Prompt changed after viewing holdout | **Stop**: holdout is spent; collect new labeled items for a fresh holdout. |
| Phase 3 | `approved: false` | **Return**: keep human grading for that criterion or rewrite it in `evh-task-rubric-spec`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

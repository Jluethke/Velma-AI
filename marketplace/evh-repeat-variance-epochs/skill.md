# Repeat Runs, Item Variance and pass^k

**One-line description:** Measures how much scores move from sampling randomness by running each item several times (Inspect `--epochs` or promptfoo `--repeat`), computes per-item pass probability, the share of items that are inconsistent across runs, the unbiased pass@k estimator (Chen et al., 2021) and pass^k reliability (Yao et al., 2024, tau-bench), and reports which epoch count to use for later runs.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `scored_results` (string, required): `scored.jsonl` from `evh-results-normalize`. If it has one epoch only, this flow triggers a repeat run first.
- `project_dir` (string, required): Repository root.

---

## Outputs

- `variance_report` (string): `logs/<system_version>/VARIANCE.md` and `variance.json` with per criterion: epochs run, mean pass rate, share of inconsistent items, within-item variance component, pass@k and pass^k for the k values the product cares about, and the epoch count recommended for regression runs.

---

## Phase 1: Repeat the Run

### Entry Criteria
- A scored single-epoch run exists.

### Actions
1. Choose the number of repeats `n`. It is bounded by cost: `cost_per_epoch` is known from `evh-cost-latency-tracking` or from the first run's tokens. If the user gave no budget, ask for one before running.
2. Rerun with repeats, no output cache:
   - Inspect: `inspect eval evals/inspect_task.py@main_eval --model <model> --epochs n --log-dir logs/<system_version>-rep`
   - promptfoo: `npx promptfoo eval -c evals/promptfooconfig.yaml --no-cache --repeat n -o logs/<system_version>-rep/results.json`
3. Normalize with `evh-results-normalize`.
4. If the judge is also stochastic, its own instability (from `UNSTABLE.md`) adds to this variance; record that the measured variance includes judge variance.

### Output
Multi-epoch `scored.jsonl`.

### Quality Gate
- Every `(item_id, criterion)` has exactly `n` non-error rows, or the missing ones are listed as errors.

---

## Phase 2: Compute Variance Statistics

### Entry Criteria
- Multi-epoch rows exist.

### Actions
1. Per item and criterion: `c` = passes, `n` = valid epochs, `p_i = c/n`.
2. Inconsistent items: items with `0 < c < n`. Report the share. These items cause most run-to-run swings.
3. Within-item variance of the mean: following Miller (2024, "Adding Error Bars to Evals", arXiv:2411.00640), the variance of the eval mean from resampling answers is `mean(p_i*(1-p_i)/n)/N` over the `N` items; averaging more epochs per item shrinks this term. Report it next to the between-item variance `var(p_i)/N`.
4. pass@k (at least one of k attempts passes), unbiased estimator from Chen et al. (2021): `1 - comb(n-c, k)/comb(n, k)` per item, averaged. Use `math.comb`. Valid only for `k <= n`.
5. pass^k (all k attempts pass), from Yao et al. (2024): per item `comb(c, k)/comb(n, k)`, averaged. Use pass^k for features where a user hits the same request repeatedly and every failure counts.
6. Which k values to report is a product input (how many times a user retries). Do not invent k.

### Output
`variance.json` with all statistics.

### Quality Gate
- A test with fabricated rows (one item, n=4, c=2, k=2) gives pass@2 = 5/6 and pass^2 = 1/6; run it with `python -c "from math import comb;print(1-comb(2,2)/comb(4,2), comb(2,2)/comb(4,2))"` and confirm it prints values that round to `0.8333 0.1667` before trusting the script.

---

## Phase 3: Recommend Epochs

### Entry Criteria
- Variance statistics exist.

### Actions
1. Compute the standard error of the mean pass rate for epoch counts 1 through n using the two variance terms from Phase 2 (within-item term divided by epochs, between-item term fixed).
2. Report the smallest epoch count whose standard error meets the precision the user requested in `evh-sample-size-confidence-intervals`. If none requested yet, report the table and leave the choice to that flow.
3. Write `VARIANCE.md`: the table, inconsistent item ids (top of the list by `p_i` closest to 0.5), and the recommendation.

### Output
`variance_report`.

### Quality Gate
- `VARIANCE.md` contains the standard error table for every epoch count from 1 to n.
- The inconsistent-item list matches `0 < c < n` from the data (recount with a one-line script).

---

## Worked Example

Illustrative only. 197 items, criterion C2, budget allows n = 5.

- Phase 1: `inspect eval ... --epochs 5 --log-dir logs/a41f0c9e2b7d-rep`; 985 rows, 4 errors.
- Phase 2: mean pass 0.906; 23 of 197 items inconsistent (11.7 percent); within-item variance term 2.1e-4 at 1 epoch, between-item term 3.9e-4. pass@3 0.962, pass^3 0.861.
- Phase 3: SE at 1 epoch 0.0245, at 3 epochs 0.0213, at 5 epochs 0.0206. Recommendation passed to the CI flow; inconsistent items listed (`test-0071`, `test-0144`, ...).

---

## Exit Criteria

DONE when per-item pass probabilities, inconsistency share, both variance terms, the requested pass@k and pass^k values, and the standard error table by epoch count are written.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No budget given for repeats | **Stop**: ask for a budget; do not choose `n`. |
| Phase 1 | Outputs identical across epochs | **Adjust**: check the output cache was disabled and the temperature from config was applied. |
| Phase 2 | Requested k exceeds n | **Adjust**: run more epochs or report only k up to n. |
| Phase 3 | Judge instability dominates | **Return**: fix the judge in `evh-judge-prompt-design` before spending on more epochs. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

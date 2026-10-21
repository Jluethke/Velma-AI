# Pairwise A/B Comparison with Position Swap

**One-line description:** Compares two system versions head to head on the same inputs with a pairwise judge that sees both replies twice in swapped order, counts a win only when both orders agree, measures position bias from the order flips, tests the win rate with an exact binomial sign test on non-tied items, and fits Bradley-Terry strengths with `choix` when more than two versions are compared.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `golden_set` (string, required): `evals/data/golden.jsonl`; supplies the shared inputs.
- `judge_prompt` (string, required): `evals/judge/`; the pairwise prompt is added here and must be calibrated like the single-reply prompts.
- `baseline_outputs` (string, required): JSONL of `item_id, output` from the baseline system version.
- `candidate_outputs` (string, required): JSONL of `item_id, output` from the candidate version.
- `compare_mode` (string, required): `pairwise` to run this flow. Use pairwise when the rubric is `rubric_only` open text and absolute scores do not separate the versions.
- `project_dir` (string, required): Repository root with a judge runner.
- `alpha` (number, optional): Significance level; 0.05 by convention if absent, stated in the report.

---

## Outputs

- `pairwise_report` (string): `logs/pairwise/<baseline>_vs_<candidate>/PAIRWISE.md` and `pairwise.json`: counts of candidate wins, baseline wins, ties and inconsistent (order-dependent) verdicts, position-bias rate, win rate on decisive items with exact binomial interval and p-value, per-stratum breakdown.

---

## Phase 1: Pairwise Judge Prompt

### Entry Criteria
- Both output files cover the same item ids (`comm` on sorted id lists shows no unique lines).

### Actions
1. Write `evals/judge/pairwise.txt`: the criterion (one question), the input, `<reply_a>` and `<reply_b>`, instructions to quote the deciding difference, then a verdict in `{"A","B","tie"}`. Allow `tie`; forcing a choice turns noise into fake wins.
2. Tell the judge: "Do not prefer a reply for being longer or for appearing first." Zheng et al. (2023) document position and verbosity bias in LLM judges; the instruction alone does not remove them, so Phase 2 swaps order.
3. Calibrate this prompt with `evh-judge-calibration` on human pairwise labels (annotators pick A, B or tie on dev pairs). Without calibration, report pairwise results as unvalidated.

### Output
`pairwise.txt` with verdict schema `{"verdict": {"enum": ["A","B","tie"]}}`.

### Quality Gate
- Item id sets are equal: `diff <(jq -r .item_id baseline.jsonl | sort) <(jq -r .item_id candidate.jsonl | sort)` prints nothing.
- The prompt contains the length and position instruction verbatim.

---

## Phase 2: Run Both Orders

### Entry Criteria
- Pairwise prompt ready.

### Actions
1. For every item run the judge twice: order 1 with baseline as A and candidate as B; order 2 swapped. Use the same judge runner (`--criterion pairwise`), cache on, temperature from config.
2. Map both verdicts back to version names. Final outcome per item:

| Order 1 says | Order 2 says | Outcome |
|---|---|---|
| candidate | candidate | candidate win |
| baseline | baseline | baseline win |
| tie | tie | tie |
| candidate | tie, or tie then candidate | candidate weak win (count as tie in the main test; report separately) |
| baseline | tie, or tie then baseline | baseline weak win (count as tie in the main test; report separately) |
| candidate | baseline, or the reverse | inconsistent (position-dependent); count as tie |

3. Position-bias rate: share of items where the verdict followed the slot (A both times or B both times in slot terms). Report it; a high rate means the judge reads position, not content.

### Output
Per-item outcomes in `pairwise.json`.

### Quality Gate
- Every item has two verdicts (one per order) or an error recorded.
- Outcome counts sum to the item count.

---

## Phase 3: Test and Rank

### Entry Criteria
- Outcomes exist.

### Actions
1. Sign test on decisive items: `k` = candidate wins, `n` = candidate wins + baseline wins. `scipy.stats.binomtest(k, n, p=0.5)`; read `.pvalue` and `.proportion_ci(confidence_level=1-alpha, method="exact")` (Clopper-Pearson).
2. Report the tie and inconsistent counts next to the win rate. A win rate on few decisive items out of many ties is weak evidence; say so with the numbers.
3. Per stratum: repeat the counts; mark strata where the baseline wins more than the candidate even if the overall result favors the candidate.
4. More than two versions: collect all decisive pairs as `(winner_index, loser_index)` tuples and fit `choix.ilsr_pairwise(n_items, data, alpha=reg)` (`pip install choix`); `reg` is a small regularization the user sets to keep strengths finite when a version never loses. Report the strengths with bootstrap intervals over items.

### Output
`pairwise_report`.

### Quality Gate
- `PAIRWISE.md` shows k, n, ties, inconsistent, position-bias rate, p-value and exact interval.
- A sanity call `scipy.stats.binomtest(15, 20, 0.5).pvalue` prints about `0.041` before trusting the script.

---

## Worked Example

Illustrative only. Baseline v41 vs candidate v42 on 197 items, criterion "Which reply resolves the customer's issue more completely?".

- Phase 1: pairwise prompt calibrated on 90 dev pairs, kappa 0.79 against adjudicated human picks.
- Phase 2: candidate wins 61, baseline wins 38, ties 72, inconsistent 26; position-bias rate 0.10.
- Phase 3: `binomtest(61, 99, 0.5)` p-value about 0.027, win rate 0.616 with exact 95% CI 0.513 to 0.712. Stratum `ignored_second_question`: candidate 14, baseline 3. Stratum `refused_benign_request`: baseline 6, candidate 2; flagged.

---

## Exit Criteria

DONE when every item has both orders judged, outcomes follow the table, the sign test with exact interval and the tie, inconsistency and position-bias counts are reported overall and per stratum.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Output files cover different items | **Adjust**: compare only the intersection and report the dropped ids. |
| Phase 1 | No human pairwise labels | **Adjust**: run, but label the report "judge not calibrated for pairwise". |
| Phase 2 | Position-bias rate high | **Return**: revise the pairwise prompt and recalibrate before trusting wins. |
| Phase 3 | Almost all items tie | **Adjust**: report "no detectable preference"; do not switch to forced choice to manufacture a winner. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

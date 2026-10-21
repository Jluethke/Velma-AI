# RAG Answer Faithfulness Scoring

**One-line description:** Scores whether each generated answer is supported by the sources it was given, by splitting answers into atomic claims and judging each claim against the cited sources with an LLM judge or an NLI model, and calibrates the judge against human labels with Cohen's kappa before its numbers are used.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `question_set` (string, required): Path to `questions.jsonl` (dev split used for tuning).
- `prompt_template` (string, required): Path to `work_dir/prompt/` with `assemble.py` and `validate_citations.py`.
- `judge_model` (string, required): The judge: an LLM id different from the generator if possible, or an NLI cross-encoder such as `cross-encoder/nli-deberta-v3-base`.
- `work_dir` (string, required): Build folder; writes `work_dir/answers/` and `work_dir/faithfulness/`.

---

## Outputs

- `faithfulness_report` (string): Path to `work_dir/faithfulness/report.json`: per question the answer, claims, per-claim verdict (supported, contradicted, not supported), citation correctness, NOT_FOUND handling on unanswerable questions, and aggregate rates.
- `judge_agreement` (object): Human-labeled sample size, Cohen's kappa between judge and human per verdict class, and the confusion matrix.

---

## Phase 1: Generate and Freeze Answers

### Entry Criteria
- Retrieval, reranking and prompt template are fixed for this measurement.

### Actions
1. Run every dev question through the full pipeline. Save, per question: retrieved `chunk_id`s, the exact assembled prompt, the answer, the generator id and settings (temperature, max tokens), and the timestamp, in `work_dir/answers/<run_id>.jsonl`.
2. Use a fixed temperature (the lowest the provider allows) for evaluation runs so reruns are comparable; record it.
3. Run `validate_citations.py` on every answer; store invalid ids and uncited sentences.

### Output
Frozen answers file.

### Quality Gate
- The answers file has one line per dev question with the prompt and settings recorded.

---

## Phase 2: Claim Split and Judging

### Entry Criteria
- Answers frozen.

### Actions
1. Split each answer into atomic claims (one fact each). With an LLM judge, ask it to list claims as a JSON array; validate the JSON with `json.loads` and retry once on failure. Keep each claim's citation markers.
2. Judge each claim against the text of the sources it cites, and separately against all supplied sources:
   - LLM judge: a fixed prompt asking for one label in `{"supported", "contradicted", "not_supported"}` and a quoted evidence span, returned as JSON.
   - NLI model: `CrossEncoder("cross-encoder/nli-deberta-v3-base").predict([(source_text, claim)])`; map the argmax to labels using the label order on the model card (do not assume the order).
3. Derived checks:
   - claim supported by all sources but not by its cited source: wrong citation;
   - unanswerable question answered without `NOT_FOUND`: hallucinated answer;
   - answerable question answered `NOT_FOUND` while a gold chunk was retrieved: missed answer.
4. Optional library route: `ragas` provides a faithfulness metric built on the same claim-then-verify idea; its API changes between versions, so pin the version and read its docs for the call signature.

### Output
Per-claim verdicts.

### Quality Gate
- Every claim has exactly one label and an evidence quote (or empty quote for `not_supported`).
- The JSON parse failure count is logged.

---

## Phase 3: Calibrate the Judge, Then Report

### Entry Criteria
- Verdicts exist.

### Actions
1. Draw a random claim sample (seeded; size is a user decision). A person labels each claim with the same three labels without seeing the judge's label.
2. Compute `sklearn.metrics.cohen_kappa_score(human, judge)` and `confusion_matrix`. Report them in `judge_agreement`.
3. Read the confusion matrix: if the judge often calls `not_supported` claims `supported`, its faithfulness rate is inflated; state the direction of bias in the report.
4. Report: claim-level supported rate, answer-level rate (answers with every claim supported), wrong-citation rate, hallucinated-answer rate on unanswerable questions, missed-answer rate. Include counts, not only percentages.
5. Do not compare faithfulness numbers across different judges or judge prompts; changing either requires a new calibration.

### Output
`faithfulness_report`, `judge_agreement`.

### Quality Gate
- `judge_agreement` contains sample size, kappa and the confusion matrix.
- `report.json` contains all five rates with counts.

---

## Worked Example

Illustrative. 136 dev questions, 412 claims, LLM judge.

```
human sample 80 claims: kappa=0.68
confusion (rows human, cols judge): supported 51/2/1, contradicted 0/6/1, not_supported 5/1/13
bias: judge marks 5 of 19 unsupported claims as supported -> rate inflated
claim supported 0.91 (375/412) | answers fully supported 0.82 (93/113)
wrong citation 0.04 (16/412) | hallucinated on unanswerable 2/23 | missed answer 4/113
```

---

## Exit Criteria

DONE when every dev answer is judged claim by claim, the judge is calibrated against human labels with kappa reported, and the five rates are reported with counts.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Generator nondeterminism makes reruns differ | **Adjust**: freeze answers once and judge the frozen file; never regenerate between judge runs. |
| Phase 2 | Judge returns invalid JSON repeatedly | **Adjust**: use the provider's structured output or JSON mode; log failures as unjudged, never as supported. |
| Phase 3 | Low kappa | **Return**: revise the judge prompt or switch judge, then recalibrate; do not report its numbers as faithfulness. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

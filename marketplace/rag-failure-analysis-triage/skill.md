# RAG Failure Analysis Triage

**One-line description:** Assigns every failed question to exactly one pipeline stage (corpus gap, parsing loss, chunk split, embedding miss, ranking miss, filter exclusion, budget truncation, generation error, citation error) with a fixed decision order over recorded artifacts, so fixes go to the stage that caused the most failures.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `question_set` (string, required): Path to `questions.jsonl` with gold spans available via `qrels_spans.jsonl` beside it.
- `eval_harness` (string, required): Path to `eval_retrieval.py`; the run files in `work_dir/runs/` are read.
- `faithfulness_report` (string, required): Path to `work_dir/faithfulness/report.json`.
- `work_dir` (string, required): Build folder; writes `work_dir/failures/`.

---

## Outputs

- `failure_report` (string): Path to `work_dir/failures/report.json`: per failed question the assigned class, the evidence (ranks, offsets, verdicts), and counts per class, with the class each count points to for a fix.

---

## Phase 1: Collect Evidence per Question

### Entry Criteria
- `faithfulness_report` exists for the same pipeline version as the run files.

### Actions
1. A question has failed when any is true: no gold chunk in the final prompt; answer not fully supported; wrong citation; hallucinated answer on an unanswerable question; missed answer.
2. For each failed question gather:
   - gold spans and whether each span's text appears in `clean_records` (corpus coverage);
   - whether the span text appears in the raw source (`pdftotext` or the HTML) but differs or is missing in extracted text (parsing loss);
   - whether a gold span is split across chunks so that no single chunk holds the answer sentence;
   - rank of the first relevant chunk in `dense.run`, `lexical.run` (if present), `hybrid.run`, and the rerank run, from exact search too if available;
   - whether the question's filter excludes the gold chunk's metadata;
   - whether the gold chunk was ranked within k but dropped by the token budget (assembly log);
   - faithfulness verdicts and citation checks.

### Output
Evidence table `failures/evidence.jsonl`.

### Quality Gate
- One evidence line per failed question with every field filled or explicitly `null`.

---

## Phase 2: Classify with a Fixed Order

### Entry Criteria
- Evidence table exists.

### Actions
1. Apply the first matching row, top to bottom. Earlier stages explain later symptoms, so order matters:

| Order | Condition | Class | Fix goes to |
|---|---|---|---|
| 1 | Answerable but no gold span text in the raw source | `label_error` | `rag-gold-question-set-label` |
| 2 | Span in raw source, missing or garbled in `clean_records` | `parse_loss` | the extractor or OCR flow |
| 3 | Question filter excludes every gold chunk | `filter_exclusion` | `rag-metadata-filter-verify` or the label's `filters` |
| 4 | No single chunk contains the answer sentence | `chunk_split` | `rag-chunk-size-select` |
| 5 | Gold chunk not in first-stage top depth (exact search also misses) | `embedding_miss` | `rag-embedding-model-select` or hybrid |
| 6 | Gold chunk found by exact search but not by ANN | `ann_miss` | the index flow's recall tuning |
| 7 | Gold in first-stage top depth, not in final top k | `rank_miss` | `rag-cross-encoder-rerank` |
| 8 | Gold in top k, dropped by token budget | `budget_truncation` | `rag-prompt-citation-assembly` |
| 9 | Gold in prompt, claim not supported or missed answer | `generation_error` | prompt instructions or generator |
| 10 | Claims supported but cited id wrong | `citation_error` | citation format or validator policy |
| 11 | Unanswerable question answered | `hallucinated_answer` | NOT_FOUND instructions |

2. Do not assign two classes to one question. Do not add a class without adding a row with an objective condition.
3. Count per class on dev; list 3 example questions per class with their evidence.

### Output
Classified failures.

### Quality Gate
- Sum of class counts equals the number of failed questions.
- Every class with a nonzero count has examples.

---

## Phase 3: Report and Hand Off

### Entry Criteria
- Classification done.

### Actions
1. Sort classes by count. The top class is the next fix; name the flow from the table.
2. For the top class, write one testable hypothesis, for example "section chunking at 512 tokens splits table rows from their headers; heading-aware table chunking will move chunk_split from 14 to under 14 on dev, measured with the harness".
3. After the fix, rerun the whole measurement chain and this flow; compare class counts before and after. Fixes in one stage can move failures into another class; report the full table both times.
4. Never edit labels to remove failures unless row 1 applies and a second person agrees.

### Output
`failure_report`.

### Quality Gate
- `report.json` has class counts, examples, the top class, and its hypothesis with the metric that will test it.

---

## Worked Example

Illustrative. 136 dev questions, 31 failed.

```
class               count  fix flow
chunk_split         11     rag-chunk-size-select
rank_miss            7     rag-cross-encoder-rerank
parse_loss           5     rag-py-pdf-extract-pymupdf (tables in scanned annex)
generation_error     4     prompt instructions
embedding_miss       2     hybrid
hallucinated_answer  2     NOT_FOUND instructions
total               31
hypothesis: keep table rows with header row in one chunk; expect chunk_split < 11 on dev
```

---

## Exit Criteria

DONE when every failed dev question has exactly one class from the table with evidence, counts sum to the failures, and the top class has a testable hypothesis.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Run files from a different pipeline version than the answers | **Stop**: regenerate runs and answers together. |
| Phase 2 | Many questions match no row | **Adjust**: a field in the evidence table is missing; fill it rather than adding a vague class. |
| Phase 3 | Fix moves failures to another class | **Return**: report both tables and pick the next top class. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

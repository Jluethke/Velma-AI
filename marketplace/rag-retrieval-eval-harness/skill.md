# RAG Retrieval Evaluation Harness

**One-line description:** Builds one reusable script that maps span-level gold labels onto any chunking, scores TREC-format runs with ranx for recall@k, MRR@k and nDCG@k, compares runs with a paired significance test, and proves itself with oracle and random runs before anyone trusts its numbers.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `question_set` (string, required): Path to `questions.jsonl` from `rag-gold-question-set-label`.
- `qrels_spans` (string, required): Path to `qrels_spans.jsonl` from `rag-gold-question-set-label`.
- `k_values` (list, required): Cutoffs to report, for example `[5, 10, 20]`. Pick the k values your prompt will actually use; the largest should cover the reranker depth.
- `significance_alpha` (number, required): Significance level for paired comparisons. A user decision; record it.
- `work_dir` (string, required): Build folder; writes `work_dir/eval/harness/` and `work_dir/runs/`.

---

## Outputs

- `eval_harness` (string): Path to `work_dir/eval/harness/eval_retrieval.py` with its README. Contract: input a chunk table (`chunk_id, doc_id, char_start, char_end`) and one or more TREC run files; output a JSON report per run and a comparison table. Fixed run paths: `work_dir/runs/<name>.run`.
- `harness_sanity_report` (string): Path to `work_dir/eval/harness/sanity.json` with oracle, random and shuffled-label results.

---

## Phase 1: Span-to-Chunk Qrels Mapping

### Entry Criteria
- `sha256sum -c work_dir/eval/SHA256SUMS` passes.

### Actions
1. `pip install ranx`. Record `pip show ranx`.
2. Write `spans_to_qrels(chunks, spans)`: a chunk is relevant to a question when its `[char_start, char_end)` range overlaps a gold span in the same `doc_id`. Overlap test: `c.start < s.end and s.start < c.end`.
3. Relevance grade of a chunk = the highest grade of the spans it overlaps. When a gold span is split across two chunks, both are relevant; recall then counts the question as found if any one is retrieved, which matches how a reader sees it. Document this choice in the README.
4. Write qrels in TREC format `qid 0 chunk_id grade` (four columns). Ranx loads them with `Qrels.from_file(path, kind="trec")`.
5. Exclude unanswerable questions from retrieval metrics (they have no relevant chunk; ranx would score them 0 and drag every system down equally). Report them separately in the answer-level flows.
6. Only `dev` questions are scored unless `--split test` is passed explicitly.

### Output
`spans_to_qrels` function and a qrels writer.

### Quality Gate
- Unit test: a chunk `[0,100)` and span `[90,120)` overlap; a chunk `[0,100)` and span `[100,120)` do not. `pytest` passes.
- Every answerable dev question has at least one relevant chunk for a chunk table that covers the whole corpus.

---

## Phase 2: Metrics and Comparison

### Entry Criteria
- Qrels mapping tested.

### Actions
1. Runs are TREC files: `qid Q0 chunk_id rank score tag`. Load with `Run.from_file(path, kind="trec")`.
2. Compute `evaluate(qrels, run, ["recall@K", "mrr@K", "ndcg@K", "hit_rate@K"])` for each K in `k_values` (ranx metric names; check the ranx docs for your version if one is rejected).
3. Definitions to put in the README so readers interpret numbers correctly:
   - recall@k: fraction of the relevant chunks for a question found in the top k, averaged over questions.
   - hit_rate@k: fraction of questions with at least one relevant chunk in the top k. For RAG answer quality this is often the more direct number.
   - MRR@k: mean of 1/rank of the first relevant chunk (0 if none in top k).
   - nDCG@k: uses the 2/1 grades.
4. Comparison: `compare(qrels, runs=[run_a, run_b], metrics=[...], max_p=significance_alpha, stat_test="student")` gives a paired t-test per metric. Print the table and save it as JSON.
5. Also report a per-question bootstrap 95% interval for the main metric (resample questions with replacement, fixed seed, number of resamples logged).
6. Write the CLI: `python eval_retrieval.py --chunks chunks.jsonl --runs work/runs/a.run work/runs/b.run --k 5 10 20 --alpha <alpha> --out report.json`.

### Output
Working `eval_retrieval.py`.

### Quality Gate
- `python eval_retrieval.py --help` prints the options above.
- A run file with a duplicate `(qid, chunk_id)` pair is rejected with an error message, not silently scored.

---

## Phase 3: Prove the Harness

### Entry Criteria
- CLI works.

### Actions
1. Build a trivial chunk table (fixed windows over every document) and three runs:
   - oracle: for each question, the relevant chunks first;
   - random: random chunks with a fixed seed;
   - shuffled labels: the oracle run scored against qrels with question ids permuted.
2. Expected results, derived from the definitions: oracle hit_rate@k equals 1.0 for every k at or above 1; random hit_rate@k is near (relevant chunks per question x k) / total chunks; shuffled labels drop close to random. If any expectation fails, the harness has a bug.
3. Write the results to `sanity.json`.
4. Do NOT tune anything in this flow. The harness is the instrument; it must be fixed before any system is compared on it.

### Output
`eval_harness`, `harness_sanity_report`.

### Quality Gate
- `sanity.json` shows oracle hit_rate@k = 1.0 at every k.
- Random and shuffled hit_rate@k are below the oracle and close to the derived random expectation.

---

## Worked Example

Illustrative. 136 dev questions, `k_values=[5,10,20]`, `significance_alpha=0.05`.

```
$ python eval_retrieval.py --chunks work/eval/harness/trivial_chunks.jsonl \
    --runs work/runs/oracle.run work/runs/random.run --k 5 10 20 --alpha 0.05
run      hit_rate@5  recall@10  mrr@10  ndcg@10
oracle   1.000       1.000      1.000   1.000
random   0.004       0.006      0.002   0.003
shuffled 0.007       0.009      0.004   0.005
sanity: PASS
```

---

## Exit Criteria

DONE when the harness maps spans to any chunking, scores and compares runs with the chosen alpha, and passes the oracle, random and shuffled checks.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `SHA256SUMS` check fails | **Stop**: the gold set changed; rerun `rag-gold-question-set-label` freeze step or restore it. |
| Phase 2 | ranx rejects a metric name | **Adjust**: read the ranx metrics docs for the installed version and use its name. |
| Phase 3 | Oracle below 1.0 | **Stop**: chunk ids in the run and qrels differ (type or format); fix before use. |
| Phase 3 | Random scores high | **Stop**: relevance is too broad (for example whole-document chunks); check the overlap test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

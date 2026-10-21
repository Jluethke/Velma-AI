# RAG Cross-Encoder Reranking

**One-line description:** Reranks the first-stage candidates with a sentence-transformers `CrossEncoder`, measures hit rate and MRR against the first stage at each candidate depth, records the p95 latency cost of each depth, and keeps the reranker only where the harness shows a significant gain.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `eval_harness` (string, required): Path to `eval_retrieval.py`; reads `work_dir/runs/hybrid.run` as the first stage. If no hybrid step ran, use `work_dir/runs/dense.run`, or the exact-search run `work_dir/runs/chunk-<config_id>.run` of the chosen chunk config when no index has been built yet; log which file was used.
- `rerank_models` (list, required): Cross-encoder ids, for example `["cross-encoder/ms-marco-MiniLM-L-6-v2", "BAAI/bge-reranker-v2-m3"]`.
- `rerank_depths` (list, required): Numbers of first-stage candidates to rerank, for example `[20, 50]`. Each must be at least the final k.
- `work_dir` (string, required): Build folder; writes `work_dir/runs/rerank-<model>-<depth>.run` and `work_dir/rerank/report.json`.
- `rerank_latency_budget_ms` (number, optional): Maximum p95 reranking time per query the service allows. When absent, no combination is excluded for latency and the report states it.

---

## Outputs

- `rerank_config` (object): `enabled` (bool), `model_id`, `revision`, `depth`, `max_length`, `batch_size`, final `k`, and measured p95 latency.
- `rerank_eval_report` (string): Path to `work_dir/rerank/report.json` with metrics, p-values and latency per model and depth.

---

## Phase 1: Prepare Candidates and Models

### Entry Criteria
- `hybrid.run` exists with at least max(`rerank_depths`) candidates per question. If not, regenerate it at that depth with the hybrid flow.

### Actions
1. `pip install sentence-transformers`. Load `CrossEncoder(model_id, revision=<sha>, max_length=<model max>)`. Read the model card for its maximum input length; inputs beyond it are truncated (query plus passage together).
2. Check passage lengths: count tokens of query plus chunk with `model.tokenizer`. If chunks exceed the reranker's max length, the end of the chunk is never seen; log the share of truncated pairs.
3. Multilingual corpora need a multilingual reranker (for example `BAAI/bge-reranker-v2-m3`); the `ms-marco` MiniLM models are trained on English.
4. Load chunk texts by `chunk_id` from the chosen chunk file.

### Output
Loaded models, candidate texts.

### Quality Gate
- The truncation share is logged per model.
- Every candidate `chunk_id` in `hybrid.run` resolves to a text.

---

## Phase 2: Rerank and Score

### Entry Criteria
- Candidates resolved.

### Actions
1. For each model and depth, per question: take the top `depth` candidates, `scores = model.predict([(question, text) for text in texts], batch_size=<n>)`, sort descending, keep top k.
2. Use the raw scores only for ordering within one query. Do not compare scores across queries or models, and do not set a fixed score cutoff without calibrating it on labeled data.
3. Write `rerank-<model>-<depth>.run`.
4. Time each query end to end (all `predict` batches) on the target hardware; record p50 and p95.
5. Score with the harness against `hybrid.run` at `significance_alpha`.

### Output
Rerank runs, timings.

### Quality Gate
- Each rerank run has k lines per question and only `chunk_id`s that were in that question's first-stage top `depth`.
- `report.json` has metrics, p-values and latency for every model and depth.

---

## Phase 3: Decide

### Entry Criteria
- Report complete.

### Actions
1. If `rerank_latency_budget_ms` is given, drop combinations whose p95 exceeds it.
2. Among the rest, take the highest primary metric. If it is not significantly better than the first stage, set `enabled=false`.
3. If two combinations are not significantly different, pick the smaller depth, then the faster model.
4. Note: reranking cannot recover a relevant chunk that is not in the first-stage top `depth`. Report first-stage hit_rate@depth as the ceiling for each depth.

### Output
`rerank_config`, `rerank_eval_report`.

### Quality Gate
- `rerank_config` states `enabled` and the rule branch.
- The report shows the first-stage hit_rate@depth ceiling beside each reranked result.

---

## Worked Example

Illustrative. k=9.

```
first stage hybrid: hit_rate@9 0.897  mrr@9 0.668  ceiling hit_rate@20 0.941  @50 0.963
model                    depth  hit_rate@9  mrr@9  p95 ms (T4 GPU)  vs first stage
ms-marco-MiniLM-L-6-v2   20     0.919       0.742   38              p=0.02
ms-marco-MiniLM-L-6-v2   50     0.926       0.748   81              p=0.01
bge-reranker-v2-m3       20     0.927       0.761  142              p=0.01
MiniLM d50 vs d20: p=0.39; bge d20 vs MiniLM d20: p=0.21
decision: MiniLM-L-6-v2, depth 20 (smaller depth and faster model within significance)
```

---

## Exit Criteria

DONE when each model and depth is scored against the first stage with latency, and `rerank_config` records the decision and rule branch.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | First-stage run shallower than the largest depth | **Return**: regenerate `hybrid.run` at that depth. |
| Phase 2 | Out of memory | **Retry**: lower `batch_size`. |
| Phase 2 | Reranked metrics below first stage | **Adjust**: check the (query, passage) order in pairs and truncation share. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

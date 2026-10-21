# RAG FAISS Index Build

**One-line description:** Builds a FAISS index for chunk embeddings with an explicit id map, chooses Flat, HNSW or IVF by corpus size and measured recall against an exact `IndexFlatIP`, tunes `efSearch` or `nprobe`, and persists the index with a sidecar id table.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `chunk_config` (object, required): From `rag-chunk-size-select` (`chunks_path`, `k`).
- `embedding_choice` (object, required): From `rag-embedding-model-select`.
- `eval_harness` (string, required): Path to `eval_retrieval.py`.
- `work_dir` (string, required): Build folder; writes `work_dir/index/faiss/`.
- `target_ann_recall` (number, required): Minimum fraction of the exact top-k the ANN index must return. A user decision.
- `latency_budget_ms` (number, optional): Per-query search latency the service must meet. When absent, the flow reports Flat latency and asks.

---

## Outputs

- `vector_index` (object): `store` `faiss`, index type and factory string, parameters (`M`, `efSearch` or `nlist`, `nprobe`), file path of `chunks.faiss`, path of `ids.jsonl` (int64 id to `chunk_id`), FAISS version.
- `ann_recall_report` (string): Path to `work_dir/index/faiss/ann.json` with ANN recall@k against exact search per parameter value, latency, memory, and the harness result for `work_dir/runs/dense.run`.

---

## Phase 1: Prepare Vectors and the Exact Baseline

### Entry Criteria
- Chunk embeddings available (from the embedding cache or a fresh encode).

### Actions
1. `pip install faiss-cpu` (or `faiss-gpu-cu12` where supported; check the FAISS install docs). Record `faiss.__version__`.
2. Load vectors as `np.ascontiguousarray(X, dtype=np.float32)`. FAISS requires C-contiguous float32; float64 input raises an error or gives wrong results through implicit copies.
3. If the embeddings are not already unit length, call `faiss.normalize_L2(X)` (in place) and do the same to every query. Inner product on unit vectors equals cosine.
4. Assign int64 ids 0..N-1 and write `ids.jsonl` mapping id to `chunk_id`. Wrap indexes with `faiss.IndexIDMap2(index)` and use `add_with_ids(X, ids)` so ids survive removals and rebuilds. Do not rely on insertion position as the id.
5. Exact baseline: `flat = faiss.IndexFlatIP(d); flat.add(X); D, I = flat.search(Q, k)`. Save `I` as ground truth.

### Output
Normalized vectors, id table, exact top-k per question.

### Quality Gate
- `X.dtype == np.float32` and `X.flags["C_CONTIGUOUS"]` are both True.
- `np.allclose(np.linalg.norm(X[:100], axis=1), 1, atol=1e-4)` is True.

---

## Phase 2: Choose and Build the Index

### Entry Criteria
- Baseline saved.

### Actions
1. Choose with this table, starting from the top row:

| Condition | Index |
|---|---|
| Flat search latency per query on the target machine is at or below `latency_budget_ms` | `IndexFlatIP` (exact, nothing to tune) |
| Vectors fit in RAM, need lower latency | `faiss.IndexHNSWFlat(d, M, faiss.METRIC_INNER_PRODUCT)` |
| Vectors do not fit, or very large N | `IndexIVFFlat` or IVF with product quantization (`index_factory(d, "IVF<nlist>,PQ<m>", faiss.METRIC_INNER_PRODUCT)`); read the FAISS wiki "Guidelines to choose an index" |

   Measure Flat latency first: time `flat.search(Q, k)` over the dev questions.
2. HNSW: `M` is user-chosen (FAISS examples use 32); set `index.hnsw.efConstruction` before `add` (FAISS default 40). HNSW does not support removal; rebuild for deletes.
3. IVF: `quantizer = faiss.IndexFlatIP(d); index = faiss.IndexIVFFlat(quantizer, d, nlist, faiss.METRIC_INNER_PRODUCT); index.train(X_train); index.add_with_ids(...)`. FAISS k-means prints a warning when there are fewer than 39 x nlist training points; if it does, lower `nlist`. The FAISS wiki gives guidance on nlist relative to N; cite it in the report.
4. Without `faiss.METRIC_INNER_PRODUCT`, HNSW and IVF default to L2. On unit vectors L2 ranking equals inner-product ranking, but scores differ in sign and scale; pick one and keep it consistent with the fusion flow.

### Output
Built index.

### Quality Gate
- `index.ntotal` equals the chunk count.
- `index.metric_type == faiss.METRIC_INNER_PRODUCT` (or L2, logged deliberately).

---

## Phase 3: Tune, Persist, Verify

### Entry Criteria
- Index built.

### Actions
1. For HNSW, sweep `index.hnsw.efSearch` (FAISS default 16; must be at least k). For IVF, sweep `index.nprobe` (default 1). Through an `IndexIDMap2`, reach the inner index with `faiss.downcast_index(index.index)`; or pass `params=faiss.SearchParametersHNSW(efSearch=v)` to `search` where supported.
2. ANN recall@k = overlap with the Flat ids / k, averaged. Choose the smallest value whose ANN recall@k is at or above `target_ann_recall`.
3. Persist: `faiss.write_index(index, "chunks.faiss")`. Reload with `faiss.read_index` and repeat the search for 10 questions; ids must match the in-memory results.
4. Write `work_dir/runs/dense.run` with the chosen setting (map ids through `ids.jsonl`) and score with the harness against the exact run.
5. Record process memory (`resource.getrusage` on Linux, or `psutil.Process().memory_info().rss`).

### Output
`vector_index`, `ann_recall_report`.

### Quality Gate
- Reloaded index returns the same ids for the 10 check questions.
- `ann.json` lists recall per parameter value and the harness p-value against exact.

---

## Worked Example

Illustrative. N=9,207, d=384, k=9, target ANN recall 0.98 (user).

```
flat: 136 queries in 21 ms total (0.15 ms/query)  -> meets 5 ms latency requirement
decision: IndexFlatIP (exact); no tuning needed
faiss 1.8.0  ntotal=9207  write_index chunks.faiss (14.1 MB); reload check 10/10 identical
dense.run hit_rate@9 0.874 (identical to exact run)
```
At N=4.2M the same flow picked `IndexHNSWFlat(d, 32)` with `efSearch=96` for ANN recall 0.981.

---

## Exit Criteria

DONE when the index is built with an id map, its parameter is chosen by measured recall against Flat, the persisted file reloads with identical results, and `dense.run` is scored.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `TypeError` or assertion on `add` | **Adjust**: convert to contiguous float32 and check the shape is (N, d). |
| Phase 2 | k-means training-size warning | **Adjust**: lower `nlist` or add training vectors. |
| Phase 3 | `efSearch` attribute error on an IDMap | **Adjust**: downcast to the inner index first. |
| Phase 3 | Reloaded results differ | **Stop**: the id table and the index were written from different builds; rebuild both together. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

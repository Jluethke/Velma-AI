# RAG Qdrant Sparse BM25 plus Dense Hybrid

**One-line description:** Adds BM25-style sparse vectors from FastEmbed `Qdrant/bm25` to the Qdrant collection with server-side IDF, runs dense and sparse prefetches fused by the Query API's RRF in one request, and keeps the hybrid only if the harness shows a significant gain.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `vector_index` (object, required): From `rag-qdrant-collection-index` (collection with `dense` vector and `bm25` sparse vector config).
- `eval_harness` (string, required): Path to `eval_retrieval.py`; reads `work_dir/runs/dense.run`.
- `qdrant_url` (string, required): Same server as the collection.

---

## Outputs

- `hybrid_run` (string): Path to `work_dir/runs/hybrid.run`.
- `hybrid_eval_report` (string): Path to `work_dir/index/qdrant_hybrid.json` with dense, sparse and fused metrics, p-values, prefetch limits, server version and the decision.

---

## Phase 1: Compute and Upload Sparse Vectors

### Entry Criteria
- `vector_index.store == "qdrant"`; server version 1.10 or later (Query API).
- The collection has `sparse_vectors_config` `bm25` with `modifier=IDF`. If it does not, sparse vectors cannot be added to an existing collection's config by upsert; check `client.update_collection` support for sparse configs in your version, or recreate the collection.

### Actions
1. `pip install fastembed`. `from fastembed import SparseTextEmbedding; bm25 = SparseTextEmbedding(model_name="Qdrant/bm25")`.
2. Documents: `for emb in bm25.embed(texts, batch_size=<n>)`: each has `.indices` and `.values`. Queries use `bm25.query_embed(question)`, which differs from `embed` for this model. Using `embed` on queries is a common mistake.
3. The `Qdrant/bm25` model emits term frequencies; IDF is applied by the server because the sparse config has `modifier=IDF`. Without the modifier, scoring is TF only.
4. Attach sparse vectors to existing points without touching dense vectors: `client.update_vectors("chunks", points=[models.PointVectors(id=pid, vector={"bm25": models.SparseVector(indices=e.indices.tolist(), values=e.values.tolist())}) ...])` in batches.

### Output
Points carrying both `dense` and `bm25` vectors.

### Quality Gate
- `client.retrieve("chunks", ids=[sample_id], with_vectors=True)` shows both `dense` and `bm25` for a sample point.
- Sparse-only query for a rare term from a known chunk returns that chunk in the top 3.

---

## Phase 2: Fused Query

### Entry Criteria
- Sparse vectors uploaded.

### Actions
1. Query:
```
client.query_points(
  "chunks",
  prefetch=[
    models.Prefetch(query=qdense, using="dense", limit=depth),
    models.Prefetch(query=models.SparseVector(indices=qs.indices.tolist(), values=qs.values.tolist()), using="bm25", limit=depth),
  ],
  query=models.FusionQuery(fusion=models.Fusion.RRF),
  limit=k,
  query_filter=<filter or None>,
)
```
2. Put the filter where it applies to both prefetches; check the Qdrant hybrid query docs for whether `filter` is set on each `Prefetch` or on the outer call in your version, and test that filtered results contain no out-of-filter points.
3. Qdrant also offers `Fusion.DBSF` (distribution-based score fusion). Treat it as a separate candidate run, not a replacement, and measure it the same way.
4. Write `sparse.run`, and one fused run per depth and fusion method.

### Output
Fused runs.

### Quality Gate
- Every fused run has k lines per question.
- A question with no sparse matches returns the dense top k.

---

## Phase 3: Measure and Decide

### Entry Criteria
- Runs written.

### Actions
1. Score `dense.run`, `sparse.run` and fused runs with the harness at `significance_alpha`.
2. Decide:

| Result | Decision |
|---|---|
| A fused run is significantly better than dense | Keep it: smallest depth, then RRF over DBSF if they tie |
| No significant difference | Keep dense-only; copy `dense.run` to `hybrid.run` |
| Fused significantly worse | Keep dense-only; check `query_embed` use and the IDF modifier |

3. Record the latency of the single fused request vs dense-only (p50, p95).

### Output
`hybrid_run`, `hybrid_eval_report`.

### Quality Gate
- `qdrant_hybrid.json` contains every system's metrics, p-values, latencies and the decision row.

---

## Worked Example

Illustrative.

```
fastembed Qdrant/bm25: 9,207 docs embedded in 22 s; update_vectors batches of 256
system          hit_rate@9  mrr@9
dense           0.873       0.652
sparse          0.716       0.531
rrf depth 30    0.899       0.671   vs dense p=0.02
dbsf depth 30   0.895       0.668   vs rrf p=0.61
decision: RRF depth 30; p95 latency 6.8 ms vs 3.1 ms dense
```

---

## Exit Criteria

DONE when every point has both vectors, fused queries are verified, and the decision is taken from harness significance tests.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Not existing vector name: bm25` | **Return**: the collection lacks the sparse config; recreate it via `rag-qdrant-collection-index` with `sparse_vectors_config`. |
| Phase 2 | `query_points` has no `prefetch` argument | **Adjust**: upgrade `qdrant-client` and the server to 1.10 or later. |
| Phase 2 | Out-of-filter points in results | **Stop**: filter placement is wrong; fix before any multi-tenant use. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

# RAG Metadata Filter Verification

**One-line description:** Implements metadata filters (tenant, document type, date) the right way for the chosen vector store (pgvector iterative index scans, Qdrant payload-indexed filters, FAISS `IDSelector`), then proves zero out-of-filter leaks and measures filtered recall and short results against exact filtered search.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `eval_harness` (string, required): Path to `eval_retrieval.py`; questions carry `filters` from the gold set.
- `metadata_fields` (list, required): Filter fields and types, for example `[{"name": "tenant", "type": "keyword", "access_control": true}, {"name": "published", "type": "datetime"}]`.
- `store` (string, required): `pgvector`, `faiss` or `qdrant`.
- `work_dir` (string, required): Build folder; writes `work_dir/index/filters.json`.

---

## Outputs

- `filter_report` (string): Path to `work_dir/index/filters.json`: per filter value tested, leak count, short-result count, filtered ANN recall@k against exact filtered search, latency, the store settings used, and the fixes applied.

---

## Phase 1: Implement Filters per Store

### Entry Criteria
- The store's index flow finished and the field values are in the store (column, payload or sidecar table).

### Actions
1. Access-control fields (`access_control: true`) are set by the server from the authenticated caller, never from text in the user's question or from model output. Write this rule at the top of the retrieval module.
2. pgvector:
   1. Add a B-tree index on each scalar filter column (or a GIN index on `metadata jsonb` with `jsonb_path_ops` when filtering by `@>`).
   2. HNSW with a `WHERE` clause filters after the index returns `ef_search` candidates, so selective filters return fewer than k rows. On pgvector 0.8.0 or later, enable iterative scans: `SET hnsw.iterative_scan = strict_order;` (exact distance order) or `relaxed_order` (faster; then re-sort in an outer query, as the pgvector README shows with a materialized CTE). `hnsw.max_scan_tuples` caps the work (read its default in the README).
   3. For a few large tenants, a partial index per tenant (`CREATE INDEX ... USING hnsw (embedding vector_cosine_ops) WHERE tenant = 'acme'`) or table partitioning by tenant are the documented alternatives.
3. Qdrant: one payload index per field (created in `rag-qdrant-collection-index`), and `query_filter=models.Filter(must=[models.FieldCondition(key="tenant", match=models.MatchValue(value=t)), models.FieldCondition(key="published", range=models.DatetimeRange(gte=...))])`. For a tenant field, read the Qdrant multitenancy guide (keyword index option `is_tenant=True` in recent versions).
4. FAISS has no metadata. Keep a sidecar table (SQLite or a dict) from FAISS id to fields. Build the allowed id set, then search with `params=faiss.SearchParametersHNSW(sel=faiss.IDSelectorBatch(allowed_ids))` (or `SearchParametersIVF` for IVF). When the allowed set is small, exact search over just those vectors (`IndexFlatIP` on the subset) is both exact and fast; choose by measured latency in Phase 2.

### Output
Filtered retrieval function for the store.

### Quality Gate
- The code passes access-control values only from a `caller` argument (grep the module: no access-control field is read from the question string).

---

## Phase 2: Leak and Recall Test

### Entry Criteria
- Filtered retrieval function exists.

### Actions
1. Build test cases: every filter combination present in the dev questions, plus for each access-control field the 3 values with the fewest chunks (most selective filters fail first).
2. For each case and each dev question, run filtered ANN search for top k, and exact filtered search (pgvector: `SET LOCAL enable_indexscan = off`; Qdrant: `SearchParams(exact=True)`; FAISS: brute force over the allowed subset).
3. Count:
   - leaks: results whose stored field value does not satisfy the filter. Must be 0.
   - short results: fewer than k results while the exact search returns k.
   - filtered ANN recall@k: overlap with exact / min(k, exact count).
4. Record latency p50 and p95 per case.

### Output
Raw test results.

### Quality Gate
- Leak count is 0 for every case.
- Every case has a short-result count and filtered recall recorded.

---

## Phase 3: Fix and Report

### Entry Criteria
- Raw results exist.

### Actions
1. Apply fixes with this table and rerun Phase 2 after each single change:

| Symptom | Store | Fix |
|---|---|---|
| Short results on selective filters | pgvector | Enable `hnsw.iterative_scan`; if on an older pgvector, upgrade or use a partial index |
| Short results | FAISS HNSW with `IDSelector` | Exact subset search for small allowed sets |
| Low filtered recall | Qdrant | Confirm the payload index exists for the field; raise `hnsw_ef` |
| Any leak | Any | Stop; the filter is not applied in the query path |

2. Change one setting at a time. Do not change several store settings and rerun once; you cannot tell which change helped.
3. Write `filters.json` with final settings and results.

### Output
`filter_report`.

### Quality Gate
- Final `filters.json` shows 0 leaks in every case and states the short-result count after fixes.

---

## Worked Example

Illustrative. pgvector 0.8.0, k=9, field `tenant`.

```
case tenant=smallco (41 chunks)  before: short results 37/40 questions, recall 0.29
SET hnsw.iterative_scan = strict_order;
case tenant=smallco              after:  short results 0/40, recall 1.00, p95 4.9 ms
leaks: 0 in all 14 cases
```

---

## Exit Criteria

DONE when every filter case shows zero leaks, short results are fixed or explained, and the final settings are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `unrecognized configuration parameter "hnsw.iterative_scan"` | **Adjust**: pgvector is older than 0.8.0; upgrade the extension or use partial indexes. |
| Phase 2 | Any leak | **Stop**: block release; fix the query path and rerun all cases. |
| Phase 3 | Fix lowers unfiltered recall | **Return**: rerun the index flow's recall test and record both numbers. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

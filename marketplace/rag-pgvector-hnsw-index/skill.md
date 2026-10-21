# RAG pgvector HNSW Index

**One-line description:** Loads chunk embeddings into PostgreSQL with pgvector, builds an HNSW index with the operator class that matches the embedding's similarity, confirms the planner uses it with EXPLAIN ANALYZE, and tunes `hnsw.ef_search` by measured recall against exact search.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `chunk_config` (object, required): From `rag-chunk-size-select` (`chunks_path`, `k`).
- `embedding_choice` (object, required): From `rag-embedding-model-select` (`dimension`, `normalize`, prefixes).
- `eval_harness` (string, required): Path to `eval_retrieval.py`; runs go to `work_dir/runs/`.
- `database_url` (string, required): `postgresql://user:pass@host:5432/db` for a database where the user may run `CREATE EXTENSION vector`.
- `target_ann_recall` (number, required): Minimum fraction of the exact top-k that the ANN search must return. A user decision trading latency for recall.

---

## Outputs

- `vector_index` (object): `store` `pgvector`, table name, column, index name, operator class, `m`, `ef_construction`, chosen `hnsw.ef_search`, pgvector version, and the query SQL.
- `ann_recall_report` (string): Path to `work_dir/index/pgvector_ann.json`: ANN recall@k against exact search per `ef_search` value, latency p50 and p95, and the harness metrics of the final run (`work_dir/runs/dense.run`).

---

## Phase 1: Schema and Bulk Load

### Entry Criteria
- `psql "$DATABASE_URL" -c "select version()"` succeeds.

### Actions
1. `CREATE EXTENSION IF NOT EXISTS vector;` then `SELECT extversion FROM pg_extension WHERE extname = 'vector';`. Record it; filtered-search features below depend on the version.
2. Create the table with the exact dimension:
   `CREATE TABLE chunks (id bigserial PRIMARY KEY, chunk_id text UNIQUE NOT NULL, doc_id text NOT NULL, char_start int NOT NULL, char_end int NOT NULL, section_path text[], metadata jsonb NOT NULL DEFAULT '{}', text text NOT NULL, embedding vector(<dimension>) NOT NULL);`
   HNSW on the `vector` type supports up to 2,000 dimensions; for larger models use `halfvec(<dimension>)` (up to 4,000 indexed) and `halfvec_cosine_ops`. Check the pgvector README for your version.
3. Bulk load with COPY, not row-by-row INSERT: `pip install "psycopg[binary]" pgvector`, `from pgvector.psycopg import register_vector`, `register_vector(conn)`, then `with cur.copy("COPY chunks (chunk_id, doc_id, char_start, char_end, section_path, metadata, text, embedding) FROM STDIN WITH (FORMAT BINARY)") as copy: copy.set_types([...]); copy.write_row(...)`. The pgvector-python README shows the binary COPY example; follow it.
4. Load before building the index. Building HNSW on a full table is faster than inserting into an existing index.
5. `ANALYZE chunks;`

### Output
Loaded `chunks` table.

### Quality Gate
- `SELECT count(*) FROM chunks;` equals the line count of `chunks_path`.
- `SELECT vector_dims(embedding) FROM chunks LIMIT 1;` equals `dimension`.

---

## Phase 2: Build the Index

### Entry Criteria
- Table loaded and analyzed.

### Actions
1. Pick the operator class from the embedding settings:

| Embeddings | Query operator | Operator class |
|---|---|---|
| Normalized, cosine | `<=>` (cosine distance) | `vector_cosine_ops` |
| Normalized, want speed | `<#>` (negative inner product) | `vector_ip_ops` (same ranking as cosine only when normalized) |
| Unnormalized L2 model | `<->` | `vector_l2_ops` |

   The query operator must match the operator class or the planner ignores the index.
2. Raise build memory for the session: `SET maintenance_work_mem = '<value>';` sized so the graph fits (pgvector prints a notice when the graph no longer fits in memory; read it). Optionally `SET max_parallel_maintenance_workers = <n>;`.
3. `CREATE INDEX chunks_embedding_hnsw ON chunks USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);` These are the pgvector defaults; start there and change them only if Phase 3 cannot reach the target recall by raising `ef_search`.
4. For a live table, use `CREATE INDEX CONCURRENTLY` to avoid blocking writes.

### Output
HNSW index.

### Quality Gate
- `\d chunks` lists `chunks_embedding_hnsw` with `hnsw`.
- `EXPLAIN ANALYZE SELECT chunk_id FROM chunks ORDER BY embedding <=> '<vector literal>' LIMIT 10;` shows `Index Scan using chunks_embedding_hnsw`.

---

## Phase 3: Tune ef_search by Measured Recall

### Entry Criteria
- Index used by the planner.

### Actions
1. Ground truth: for each dev question, run exact search in a transaction with `SET LOCAL enable_indexscan = off;` and the same ORDER BY ... LIMIT k query. Save the top-k ids.
2. For `ef_search` values the user lists (the pgvector default is 40; `ef_search` must be at least k to return k rows), run `SET LOCAL hnsw.ef_search = <v>;` and the same query. ANN recall@k = |ANN ids intersect exact ids| / k, averaged over questions. Record p50 and p95 latency from client-side timing.
3. Choose the smallest `ef_search` whose ANN recall@k is at or above `target_ann_recall`. If none does, rebuild with a larger `m` or `ef_construction` and repeat.
4. Write the final dense run with the chosen setting to `work_dir/runs/dense.run` and score it with the harness. Compare with the exact-search run from `rag-chunk-size-select`: a significant drop means the ANN setting costs answer quality.
5. Filtered queries (`WHERE metadata->>'tenant' = $1`) apply the filter after the index scan and can return fewer than k rows. Handle them in `rag-metadata-filter-verify` (iterative index scans, pgvector 0.8.0 and later).

### Output
`vector_index`, `ann_recall_report`.

### Quality Gate
- `pgvector_ann.json` lists recall and latency for every tested `ef_search`.
- The harness comparison between `dense.run` and the exact run is in the report with its p-value.

---

## Worked Example

Illustrative. 9,207 chunks, dimension 384, k=9, target ANN recall 0.98 (user).

```
db=> SELECT extversion FROM pg_extension WHERE extname='vector';
 0.8.0
db=> EXPLAIN ANALYZE SELECT chunk_id FROM chunks ORDER BY embedding <=> $1 LIMIT 9;
 Limit  (actual time=0.61..0.74 rows=9)
   ->  Index Scan using chunks_embedding_hnsw on chunks  (actual time=0.60..0.73 rows=9)
ef_search  ann_recall@9  p50 ms  p95 ms
40         0.962         0.7     1.4
80         0.989         1.1     2.0
160        0.997         1.9     3.3
chosen ef_search=80; dense.run hit_rate@9 0.872 vs exact 0.874 (p=0.66)
```

---

## Exit Criteria

DONE when the HNSW index is used by the planner, `ef_search` is chosen by measured recall against exact search, and `dense.run` is scored with the harness.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `permission denied to create extension` | **Return**: ask a database owner to run `CREATE EXTENSION vector`; do not work around it. |
| Phase 1 | `expected N dimensions, not M` | **Stop**: the table dimension and the model disagree; recreate the table with the model's dimension. |
| Phase 2 | Plan shows `Seq Scan` | **Adjust**: match operator and operator class, keep ORDER BY distance ASC with LIMIT, and run `ANALYZE`. |
| Phase 3 | Fewer than k rows returned | **Adjust**: `ef_search` is below k or a filter removed rows; raise `ef_search` or go to the filter flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

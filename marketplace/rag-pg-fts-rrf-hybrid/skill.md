# RAG Postgres Full-Text plus pgvector Hybrid with RRF

**One-line description:** Adds a stored `tsvector` column with a GIN index next to the pgvector embedding, fuses full-text and vector rankings in one SQL query with Reciprocal Rank Fusion (k = 60, Cormack, Clarke and Buettcher, SIGIR 2009), and keeps the hybrid only if the harness shows it beats dense-only.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `vector_index` (object, required): From `rag-pgvector-hnsw-index` (table, operator, `ef_search`).
- `eval_harness` (string, required): Path to `eval_retrieval.py`; reads `work_dir/runs/dense.run`.
- `database_url` (string, required): Same database as the vector index.
- `fts_config` (string, required): PostgreSQL text search configuration matching the corpus language, for example `english`, `german`, or `simple` (no stemming, no stopwords; for codes and mixed languages). List available ones with `\dF` in psql.

---

## Outputs

- `hybrid_run` (string): Path to `work_dir/runs/hybrid.run`, the fused ranking for dev questions at the chosen candidate depth.
- `hybrid_eval_report` (string): Path to `work_dir/index/hybrid_pg.json` with dense-only, lexical-only and hybrid metrics, p-values, the chosen depth, the fusion SQL, and the decision.

---

## Phase 1: Full-Text Column and Index

### Entry Criteria
- `vector_index.store == "pgvector"`.

### Actions
1. Add a generated column with an explicit configuration (the two-argument form is immutable; the one-argument form depends on `default_text_search_config` and is rejected in generated columns):
   `ALTER TABLE chunks ADD COLUMN tsv tsvector GENERATED ALWAYS AS (to_tsvector('<fts_config>', text)) STORED;`
2. `CREATE INDEX chunks_tsv_gin ON chunks USING gin (tsv);` then `ANALYZE chunks;`.
3. Parse user queries with `websearch_to_tsquery('<fts_config>', $1)`; it accepts free text with quotes and `-` without syntax errors, unlike `to_tsquery`.
4. Know the limit: `ts_rank` and `ts_rank_cd` are not BM25 (no document-length normalization by default and no IDF saturation). If lexical-only scores are weak, a BM25 extension for Postgres (for example ParadeDB `pg_search`) is an option; read its docs before adopting it. This flow uses built-in FTS.

### Output
Indexed `tsv` column.

### Quality Gate
- `EXPLAIN ANALYZE SELECT id FROM chunks WHERE tsv @@ websearch_to_tsquery('<fts_config>', 'travel reimbursement');` shows `Bitmap Index Scan on chunks_tsv_gin`.

---

## Phase 2: Fusion Query

### Entry Criteria
- GIN index used.

### Actions
1. Write the RRF query. `$1` query vector, `$2` query text, `$3` candidate depth per list, `$4` final k:
```
WITH dense AS (
  SELECT id, row_number() OVER (ORDER BY dist) AS r
  FROM (SELECT id, embedding <=> $1 AS dist FROM chunks ORDER BY dist LIMIT $3) d
),
lex AS (
  SELECT id, row_number() OVER (ORDER BY rank DESC) AS r
  FROM (SELECT id, ts_rank_cd(tsv, q) AS rank
        FROM chunks, websearch_to_tsquery('<fts_config>', $2) q
        WHERE tsv @@ q ORDER BY rank DESC LIMIT $3) l
)
SELECT coalesce(dense.id, lex.id) AS id,
       coalesce(1.0 / (60 + dense.r), 0) + coalesce(1.0 / (60 + lex.r), 0) AS score
FROM dense FULL OUTER JOIN lex ON dense.id = lex.id
ORDER BY score DESC LIMIT $4;
```
2. The inner `ORDER BY dist LIMIT $3` subquery is what lets the planner use the HNSW index; putting `row_number()` directly on the base table prevents it. Check with EXPLAIN.
3. Set `SET hnsw.ef_search` to at least `$3` in the same session, or the dense list returns fewer than `$3` rows.
4. RRF uses ranks, not scores, so cosine distances and `ts_rank_cd` values never need normalizing against each other. Do not replace it with a weighted sum of raw scores.

### Output
Fusion SQL file `hybrid.sql`.

### Quality Gate
- `EXPLAIN ANALYZE` of the full query shows both `Index Scan using chunks_embedding_hnsw` and `Bitmap Index Scan on chunks_tsv_gin`.
- For a query with zero full-text matches, the result equals the dense-only top k in the same order.

---

## Phase 3: Measure and Decide

### Entry Criteria
- Fusion SQL verified.

### Actions
1. Write `work_dir/runs/lexical.run` (lex list only) and hybrid runs for each candidate depth the user lists (each depth must be at least the final k).
2. Score `dense.run`, `lexical.run` and each hybrid run with the harness; compare at `significance_alpha`.
3. Decide:

| Result | Decision |
|---|---|
| A hybrid depth is significantly better than dense-only | Keep hybrid at the smallest such depth with the best primary metric |
| No significant difference | Keep dense-only (fewer moving parts); write `hybrid.run` as a copy of `dense.run` and record the decision |
| Hybrid significantly worse | Keep dense-only; inspect lexical-only for a wrong `fts_config` |

4. Inspect 10 questions where hybrid wins: typical wins are exact identifiers, product codes and rare names that embeddings blur. Record examples.

### Output
`hybrid_run`, `hybrid_eval_report`.

### Quality Gate
- `hybrid_pg.json` contains all three systems' metrics with p-values and the decision row used.

---

## Worked Example

Illustrative. `fts_config=english`, k=9, depths [20, 50].

```
system        hit_rate@9  mrr@9
dense         0.872       0.651
lexical       0.704       0.522
hybrid d=20   0.897       0.668   vs dense p=0.03
hybrid d=50   0.901       0.671   vs dense p=0.02; vs d=20 p=0.48
decision: hybrid, depth 20 (smallest significant)
win example: "What is form TR-7?" -> lexical rank 1, dense rank 14
```

---

## Exit Criteria

DONE when the FTS index and fusion query are verified by EXPLAIN, and the hybrid-or-dense decision is made from harness significance tests.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `generation expression is not immutable` | **Adjust**: use the two-argument `to_tsvector('<fts_config>', text)`. |
| Phase 2 | Dense CTE does a sequential scan | **Adjust**: keep the ORDER BY ... LIMIT subquery form and the matching operator. |
| Phase 3 | Lexical-only near zero | **Adjust**: wrong language config; test `simple` and the corpus language, compare. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

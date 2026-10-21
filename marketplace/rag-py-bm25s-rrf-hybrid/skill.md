# RAG Python BM25 plus FAISS Hybrid with RRF

**One-line description:** Builds a BM25 index over chunk text with the `bm25s` library (stemming and stopwords chosen per language), fuses it with the FAISS dense ranking by Reciprocal Rank Fusion (k = 60, Cormack, Clarke and Buettcher, SIGIR 2009), and keeps the hybrid only if the harness shows a significant gain.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `vector_index` (object, required): From `rag-faiss-index-build` (index path, id table).
- `eval_harness` (string, required): Path to `eval_retrieval.py`; reads `work_dir/runs/dense.run`.
- `work_dir` (string, required): Build folder; writes `work_dir/index/bm25/`.

---

## Outputs

- `hybrid_run` (string): Path to `work_dir/runs/hybrid.run`, fused ranking for dev questions.
- `hybrid_eval_report` (string): Path to `work_dir/index/bm25/hybrid.json` with dense, BM25 and hybrid metrics, p-values, tokenizer settings, BM25 parameters, and the decision.

---

## Phase 1: Build the BM25 Index

### Entry Criteria
- `vector_index.store == "faiss"` and `ids.jsonl` exists.

### Actions
1. `pip install bm25s PyStemmer`. Record versions.
2. Load chunk texts in the same id order as `ids.jsonl`, so BM25 document index i is FAISS id i.
3. Tokenize: `stemmer = Stemmer.Stemmer("english")` (choose the corpus language), `corpus_tokens = bm25s.tokenize(texts, stopwords="en", stemmer=stemmer)`. Use the same stemmer and stopwords for queries.
4. `retriever = bm25s.BM25(); retriever.index(corpus_tokens)`. Log `retriever.k1`, `retriever.b` and `retriever.method` (library defaults; read the bm25s README for the variant names). Do not tune k1 and b on the test split.
5. Save with `retriever.save(str(work_dir / "index/bm25"))` and reload with `bm25s.BM25.load(...)` for queries.

### Output
Saved BM25 index.

### Quality Gate
- Reloaded retriever returns the same top 10 for 5 sample queries as the in-memory one.
- The number of indexed documents equals `len(ids.jsonl)`.

---

## Phase 2: Lexical Run and Fusion

### Entry Criteria
- BM25 index saved.

### Actions
1. For each dev question: `q = bm25s.tokenize([question], stopwords="en", stemmer=stemmer)`; `docs, scores = retriever.retrieve(q, k=depth)`. `docs[0]` holds document indexes (equal to FAISS ids by construction).
2. A query whose tokens are all stopwords or out of vocabulary returns zero scores; drop zero-score results from the lexical list instead of ranking them.
3. Write `work_dir/runs/lexical.run`.
4. RRF per question over the dense list and lexical list, both cut at `depth`: `score(id) = sum over lists of 1 / (60 + rank)`, ranks starting at 1. Sort by score, tie-break by dense rank. Write one hybrid run per depth.
5. Keep fusion as its own function with a unit test: ids A (dense rank 1, absent from lexical) and B (dense rank 2, lexical rank 1): A = 1/61 = 0.016393, B = 1/62 + 1/61 = 0.032522, so B ranks first.

### Output
Lexical and hybrid runs.

### Quality Gate
- The fusion unit test passes with `pytest`.
- Each hybrid run has exactly k lines per question.

---

## Phase 3: Measure and Decide

### Entry Criteria
- Runs written.

### Actions
1. Score `dense.run`, `lexical.run` and each hybrid run with the harness at `significance_alpha`.
2. Decide with this table:

| Result | Decision |
|---|---|
| A hybrid depth is significantly better than dense | Keep the smallest depth with the best primary metric |
| No significant difference | Keep dense-only; copy `dense.run` to `hybrid.run` and record the decision |
| Hybrid significantly worse | Keep dense-only; check tokenizer language and stemmer |

3. Measure latency added by BM25 retrieval for the dev queries (p50, p95).

### Output
`hybrid_run`, `hybrid_eval_report`.

### Quality Gate
- `hybrid.json` contains all metrics, p-values, latency and the decision row.

---

## Worked Example

Illustrative.

```
bm25s method=lucene k1=1.5 b=0.75 (library defaults logged) docs=9207
system       hit_rate@9  mrr@9
dense        0.874       0.655
bm25         0.721       0.540
hybrid d=30  0.904       0.674   vs dense p=0.01
decision: hybrid depth 30; added latency p95 2.1 ms
```

---

## Exit Criteria

DONE when BM25 is indexed in the same id space as FAISS, fusion is unit-tested, and the hybrid-or-dense decision is taken from the harness.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Ids misaligned between BM25 and FAISS | **Stop**: rebuild BM25 from texts in `ids.jsonl` order; fusion on misaligned ids is silent garbage. |
| Phase 2 | Many queries return empty lexical lists | **Adjust**: check the stopword list and language; try without stemming. |
| Phase 3 | Hybrid gain only on test, not dev | **Return**: decisions are made on dev; report test as is. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

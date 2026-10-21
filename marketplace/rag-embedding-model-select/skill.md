# RAG Embedding Model Selection by Evaluation

**One-line description:** Picks the embedding model by measured retrieval on your own labeled questions using exact (brute-force) search, with each model's required query and passage prefixes, normalization and length limit applied correctly, and ties broken by a paired significance test and cost.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `chunk_sets` (string, required): Path to `chunks/index.json` from `rag-chunk-candidates-build`.
- `eval_harness` (string, required): Path to `eval_retrieval.py` from `rag-retrieval-eval-harness`.
- `candidate_models` (list, required): Model ids to compare, for example `["BAAI/bge-small-en-v1.5", "intfloat/e5-base-v2", "nomic-ai/nomic-embed-text-v1.5"]`, and any API model with its provider name.
- `work_dir` (string, required): Build folder; writes `work_dir/embeddings/` and `work_dir/runs/emb-<model>.run`.

---

## Outputs

- `embedding_choice` (object): `model_id`, `revision` (Hub commit hash), `dimension`, `query_prefix`, `passage_prefix`, `normalize` (bool), `similarity` (`cosine`), `max_seq_length`, and the baseline `config_id` used.
- `embedding_eval_report` (string): Path to `work_dir/embeddings/report.json` with metrics per model, the comparison table, encode throughput, and the decision rule applied.

---

## Phase 1: Shortlist and Read Each Model Card

### Entry Criteria
- `chunk_sets` exists; harness sanity passed.

### Actions
1. Public leaderboards such as MTEB are for shortlisting only; their tasks are not your corpus. The decision comes from Phase 2.
2. For each candidate, read its model card and fill this table. Do not guess a prefix; wrong or missing prefixes measurably lower retrieval for models trained with them.

| Model family | Query text | Passage text | Notes |
|---|---|---|---|
| `intfloat/e5-*-v2` | `"query: " + q` | `"passage: " + p` | Prefix both sides |
| `BAAI/bge-*-en-v1.5` | `"Represent this sentence for searching relevant passages: " + q` | `p` | Instruction on queries only |
| `nomic-ai/nomic-embed-text-v1.5` | `"search_query: " + q` | `"search_document: " + p` | Needs `trust_remote_code=True` |
| Other | As the model card states | As the model card states | If the card is silent, use no prefix and log it |

3. Pin the revision: `huggingface_hub.HfApi().model_info(model_id).sha`, and load with `SentenceTransformer(model_id, revision=sha)`. An unpinned model can change under you.
4. Choose the baseline chunk config for this comparison: the `recursive` config whose size is closest to the middle of the user's `chunk_sizes` list (rule, not a judgment). Chunk size is tuned after the model is fixed.

### Output
Filled prefix table and pinned revisions.

### Quality Gate
- Every candidate row cites its model card for the prefix.
- Every candidate has a 40-character revision hash.

---

## Phase 2: Encode and Run Exact Search

### Entry Criteria
- Table filled.

### Actions
1. Encode passages with `model.encode(passages, batch_size=<fits memory>, normalize_embeddings=True, convert_to_numpy=True, show_progress_bar=True)`, after adding the passage prefix. Save as `float32` `.npy` with the matching `chunk_id` list.
2. Encode dev questions with the query prefix and `normalize_embeddings=True`.
3. Exact search: `scores = Q @ P.T` (cosine, because both are normalized), take the top max(`k_values`) per query with `numpy.argpartition` then sort. Use exact search here so ANN index settings cannot affect the comparison.
4. Write `work_dir/runs/emb-<model_short>.run` in TREC format, one line per (question, chunk).
5. Measure throughput: passages per second for encoding on the target hardware, and the embedding dimension (`model.get_sentence_embedding_dimension()`). Storage per chunk is dimension x 4 bytes for float32.
6. For API models, call the provider's embeddings endpoint in batches, with the provider's documented input type or task parameter for queries versus documents when it has one, and record the cost per million tokens from the provider's price page with the date read.

### Output
One run file and throughput row per model.

### Quality Gate
- Every run file has exactly max(`k_values`) lines per dev question (`awk '{print $1}' run | sort | uniq -c` shows one count).
- A sanity print of `np.linalg.norm(P[:5], axis=1)` shows values equal to 1 within float error.

---

## Phase 3: Compare and Decide

### Entry Criteria
- All runs written.

### Actions
1. `python eval_retrieval.py --chunks <baseline chunks.jsonl> --runs work/runs/emb-*.run --k <k_values> --alpha <alpha> --out work/embeddings/report.json`.
2. The primary metric is `hit_rate@k` at the k the prompt will use (the user's prompt context size decides k; if unknown, use the largest of `k_values` and log it).
3. Decide with this rule, in order:
   - Take the model with the highest primary metric.
   - If the paired test does not show it significantly better (at `significance_alpha`) than a cheaper candidate (smaller dimension, faster encode, or no API cost), choose the cheaper one.
   - If still tied, choose the one with the higher MRR@k.
4. Write `embedding_choice` with every field and the rule outcome.
5. Do NOT pick by leaderboard rank, by model size, or by the most recent release.

### Output
`embedding_choice`, `embedding_eval_report`.

### Quality Gate
- `report.json` contains every candidate's metrics and the pairwise p-values.
- `embedding_choice` names the rule branch that decided it.

---

## Worked Example

Illustrative. 136 dev questions, baseline `recursive-512-64`, k=10, alpha=0.05.

```
model                       dim  hit_rate@10  mrr@10  enc/s (GPU)
BAAI/bge-small-en-v1.5      384  0.846        0.611   2,310
intfloat/e5-base-v2         768  0.868        0.634   1,020
nomic-embed-text-v1.5       768  0.860        0.640     980
paired t-test e5 vs bge-small hit_rate@10: p=0.31 (not significant)
decision: cheaper model within significance -> BAAI/bge-small-en-v1.5
```

---

## Exit Criteria

DONE when every candidate has been scored with exact search on the dev set with correct prefixes, and `embedding_choice` is written with the decision rule that selected it.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Model card gives no prefix guidance | **Adjust**: run it with no prefix and log it; do not copy another model's prefix. |
| Phase 2 | CUDA out of memory | **Retry**: halve `batch_size`; results do not depend on batch size. |
| Phase 2 | Norms not 1 | **Adjust**: pass `normalize_embeddings=True` or normalize manually; cosine on unnormalized vectors with `@` is wrong. |
| Phase 3 | All models score near the random baseline | **Stop**: the query prefix or chunk ids are wrong; check one question by hand. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

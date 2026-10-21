# RAG Chunk Size Selection by Measured Retrieval

**One-line description:** Selects the chunking strategy, size and overlap by running every candidate chunk set through the chosen embedding model with exact search and comparing hit rate, recall and MRR at a fixed context token budget, so larger chunks do not win only by showing the generator more text.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `chunk_sets` (string, required): Path to `chunks/index.json` from `rag-chunk-candidates-build`.
- `embedding_choice` (object, required): From `rag-embedding-model-select`.
- `eval_harness` (string, required): Path to `eval_retrieval.py`; its README holds `k_values` and `significance_alpha`.
- `context_token_budget` (integer, required): Tokens of retrieved context the generator prompt will hold. A user decision driven by the generator's context window and cost.
- `work_dir` (string, required): Build folder; writes `work_dir/runs/chunk-<config_id>.run` and `work_dir/chunks/selection.json`.

---

## Outputs

- `chunk_config` (object): `config_id`, `strategy`, `size`, `overlap`, `k` (chunks per prompt), `chunks_path`.
- `chunk_eval_report` (string): Path to `work_dir/chunks/selection.json` with per-config metrics at equal k and at equal token budget, p-values, and the rule branch applied.

---

## Phase 1: Encode Every Candidate

### Entry Criteria
- `embedding_choice` has a pinned revision and prefixes.

### Actions
1. For every config in `chunk_sets`, encode its chunks with the chosen model, the passage prefix, `normalize_embeddings=True`, the pinned revision. If `rag-embedding-cache-content-hash` is in place, read and write through it; chunks shared between configs are then encoded once.
2. Encode dev questions once with the query prefix.
3. Exact search per config (`Q @ P.T`, top max k). Write `work_dir/runs/chunk-<config_id>.run`.

### Output
One run per config.

### Quality Gate
- One run file per config, each with max k lines per dev question.

---

## Phase 2: Compare at Equal k and Equal Token Budget

### Entry Criteria
- Runs written.

### Actions
1. Score each run with the harness, passing that config's `chunks.jsonl` (qrels are mapped per chunking from the gold spans, so configs are comparable).
2. Equal-k comparison: metrics at each k in `k_values`.
3. Equal-budget comparison: for each config, k_budget = floor(`context_token_budget` / p50 chunk tokens). Score each config at its own k_budget using the harness with `--k <k_budget>`. This removes the bias where 1024-token chunks look better at k=10 only because they carry four times the text of 256-token chunks.
4. Pairwise compare the top configs with the harness compare mode at `significance_alpha`.

### Output
Two tables: equal k and equal budget.

### Quality Gate
- `selection.json` has both tables.
- Each equal-budget row states its k_budget and the budget used.

---

## Phase 3: Decide

### Entry Criteria
- Both tables exist.

### Actions
1. Primary metric: `hit_rate` at the config's k_budget.
2. Rule, in order:
   - Take the config with the highest primary metric at equal budget.
   - If not significantly better than a config with smaller chunks, choose the smaller chunks (more, finer citations; less irrelevant text in the prompt).
   - If still tied, choose higher MRR at k_budget.
3. Set `k` in `chunk_config` to that config's k_budget.
4. Check failure cases: list dev questions that the chosen config misses but another config finds. If most of them have gold spans longer than the chosen size, note it in the report as an argument for `section` or larger chunks on those document types.

### Output
`chunk_config`, `chunk_eval_report`.

### Quality Gate
- `chunk_config` has all six fields.
- The report names the rule branch and lists the questions only other configs found.

---

## Worked Example

Illustrative. Model `BAAI/bge-small-en-v1.5`, budget 3,000 tokens.

```
config            p50  k_budget  hit_rate@k_budget  mrr
fixed-256-32      256  11        0.831              0.590
recursive-256-32  231  12        0.853              0.602
recursive-512-64  466   6        0.846              0.611
section-512-64    301   9        0.874              0.655
section vs recursive-256: p=0.04 (alpha 0.05) significant
decision: section-512-64, k=9
```

---

## Exit Criteria

DONE when every candidate is scored at equal k and equal token budget, and `chunk_config` records the chosen config, its k and the rule branch.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Encoding all configs is too slow | **Adjust**: use the content-hash embedding cache; do not shrink the question set. |
| Phase 2 | `context_token_budget` missing | **Stop**: ask for it; equal-k results alone favor large chunks. |
| Phase 3 | Large differences between dev and a later test run | **Return**: report it; never re-tune on the test split. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

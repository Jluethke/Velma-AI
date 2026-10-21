# RAG Embedding Cache Keyed by Content Hash

**One-line description:** Adds a SQLite embedding cache keyed by SHA-256 of model id, pinned revision, prefix and exact chunk text, so re-chunking and re-indexing only encode new or changed text, and proves the cache returns byte-identical vectors and never mixes models.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `embedding_choice` (object, required): From `rag-embedding-model-select` (`model_id`, `revision`, `passage_prefix`, `normalize`, `dimension`).
- `chunk_config` (object, required): From `rag-chunk-size-select`; its `chunks_path` is the first workload.
- `work_dir` (string, required): Build folder; the cache lives at `work_dir/cache/embeddings.sqlite`.

---

## Outputs

- `embedding_cache` (object): `path` to the SQLite file, `key_recipe` (exact string concatenation hashed), the `encode_cached(texts)` module path, and measured hit rate and time on a rerun.

---

## Phase 1: Define the Key and the Table

### Entry Criteria
- `embedding_choice` has a 40-character `revision`.

### Actions
1. Key recipe: `sha256((model_id + "\x1f" + revision + "\x1f" + passage_prefix + "\x1f" + str(normalize) + "\x1f" + text).encode("utf-8")).hexdigest()`. The unit separator `\x1f` prevents two different field splits from producing the same string.
2. Every field that changes the vector must be in the key. If a field is missing, a model or prefix change silently reuses stale vectors. Do not key on `chunk_id`; ids change with chunking while the text may not.
3. Create the table with the Python `sqlite3` module:
   `CREATE TABLE IF NOT EXISTS emb (key TEXT PRIMARY KEY, dim INTEGER NOT NULL, vec BLOB NOT NULL, created_at TEXT NOT NULL)`.
4. Set `PRAGMA journal_mode=WAL;` so readers do not block the writer during a long build.
5. Store vectors as raw float32 bytes: `vec.astype(np.float32).tobytes()`; read with `np.frombuffer(blob, dtype=np.float32)`. Check `len(v) == dim` on read. Do not pickle vectors; pickle loading runs code from the file.

### Output
Empty cache with schema.

### Quality Gate
- `sqlite3 embeddings.sqlite ".schema emb"` prints the table with the four columns.
- `sqlite3 embeddings.sqlite "PRAGMA journal_mode;"` prints `wal`.

---

## Phase 2: Wrap the Encoder

### Entry Criteria
- Table exists.

### Actions
1. Write `encode_cached(texts)` in one module file:
   1. compute keys for all texts;
   2. `SELECT key, vec FROM emb WHERE key IN (...)` in batches (SQLite's maximum number of host parameters has a compile-time limit; keep each `IN` list well under it, and check `sqlite3.connect(...).getlimit(sqlite3.SQLITE_LIMIT_VARIABLE_NUMBER)` on Python 3.11 or newer);
   3. encode only the misses with the exact settings in `embedding_choice`;
   4. `INSERT OR IGNORE` the new vectors in one transaction;
   5. return vectors in the input order.
2. Deduplicate identical texts inside one call before encoding.
3. Edit one file only. Do not change callers in the same step; switch callers one at a time after Phase 3 passes.

### Output
`encode_cached` module.

### Quality Gate
- `pytest` test: encoding the same 100 texts twice returns `np.array_equal` results and the second call encodes zero texts (count the calls with a mock on `model.encode`).
- `pytest` test: changing `passage_prefix` produces 100 misses.

---

## Phase 3: Measure on the Real Workload

### Entry Criteria
- Tests pass.

### Actions
1. Run the chunk file at `chunk_config.chunks_path` through `encode_cached` with an empty cache; record wall time and misses.
2. Run it again; record wall time and hits. Expected: 100% hits on the second run (derived: same texts, same key).
3. Compare 50 random cached vectors with fresh encodings: cosine similarity should be 1 within float error on the same hardware and library versions. GPU kernels can differ slightly across hardware; if they do, record the max absolute difference.
4. Record in `embedding_cache` the hit rate, both wall times, and the file size.

### Output
`embedding_cache`.

### Quality Gate
- Second-run hit rate is 100%.
- The 50-vector comparison result is logged with its max absolute difference.

---

## Worked Example

Illustrative.

```
run 1: 9,207 texts, 9,207 misses, 6m 41s, cache 14.2 MB
run 2: 9,207 texts, 9,207 hits, 0m 03s
fresh vs cached (50 vectors): max abs diff 0.0
switching to section-512-64 + new docs: 9,512 texts, 9,204 hits, 308 misses, 0m 16s
```

---

## Exit Criteria

DONE when the cache key covers every vector-changing setting, tests prove identical returns and correct invalidation, and a rerun on the real chunk file hits 100%.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `revision` missing | **Stop**: pin it in `rag-embedding-model-select`; an unpinned key is unsafe. |
| Phase 2 | `sqlite3.OperationalError: too many SQL variables` | **Adjust**: lower the `IN` batch size. |
| Phase 2 | `database is locked` | **Adjust**: confirm WAL mode and use one writer process. |
| Phase 3 | Hit rate below 100% on rerun | **Stop**: the key includes something unstable (for example whitespace stripping done in one path only); fix before use. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

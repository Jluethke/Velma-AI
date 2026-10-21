# RAG Chunk Candidates Build

**One-line description:** Produces several candidate chunkings of the clean corpus (fixed token windows with overlap, recursive separator splitting, and heading-section splitting) measured in the embedding model's own tokenizer, each chunk carrying exact character offsets so the evaluation harness can score it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `clean_records` (string, required): Path to `clean/records.jsonl` from `rag-corpus-normalize-dedupe`.
- `chunk_sizes` (list, required): Candidate chunk sizes in tokens with overlap, for example `[[256, 32], [512, 64], [1024, 128]]`. User inputs; this flow measures, it does not choose.
- `tokenizer_name` (string, required): Hugging Face tokenizer id of the embedding model being tested (for example `BAAI/bge-small-en-v1.5`), or `tiktoken:<encoding>` for an API model whose provider documents a tiktoken encoding.
- `work_dir` (string, required): Build folder; writes `work_dir/chunks/<config_id>/chunks.jsonl`.

---

## Outputs

- `chunk_sets` (string): Path to `work_dir/chunks/index.json` listing every candidate `config_id` with strategy, size, overlap, chunk count, token length percentiles, and the chunk file path. Each `chunks.jsonl` line: `chunk_id`, `doc_id`, `char_start`, `char_end`, `section_path`, `text`, `n_tokens`.

---

## Phase 1: Load the Tokenizer and Measure the Limit

### Entry Criteria
- `clean_records` exists; `chunk_sizes` has at least two entries.

### Actions
1. For a Hugging Face id: `from transformers import AutoTokenizer; tok = AutoTokenizer.from_pretrained(tokenizer_name)`. Count tokens with `len(tok(text, add_special_tokens=False)["input_ids"])`.
2. For `tiktoken:<encoding>`: `import tiktoken; enc = tiktoken.get_encoding("<encoding>")`; count with `len(enc.encode(text))`.
3. Read the embedding model's maximum input length: for sentence-transformers models, `SentenceTransformer(name).max_seq_length`; for API models, the provider's documented limit. Text beyond the limit is truncated without an error, so a chunk larger than the limit is silently embedded from its beginning only.
4. Remove any `chunk_sizes` entry larger than the limit minus the special tokens and any query/passage prefix the model needs (count the prefix tokens with the same tokenizer). Log each removal.
5. Never count chunk size in characters or words when the limit is in tokens; the ratio differs by language and by content (code and tables use more tokens per word).

### Output
Tokenizer loaded, valid size list.

### Quality Gate
- The log shows the model limit and the prefix token count.
- No remaining `chunk_sizes` entry exceeds the limit minus prefix and special tokens.

---

## Phase 2: Build Candidates

### Entry Criteria
- Valid size list.

### Actions
1. Work on each document's full text (records joined with `"\n\n"`), so chunk offsets are document offsets.
2. Strategy `fixed`: tokenize with offsets (`tok(text, return_offsets_mapping=True, add_special_tokens=False)`), step through tokens in windows of `size` with stride `size - overlap`, and take `char_start`, `char_end` from the first and last token offsets.
3. Strategy `recursive`: `pip install langchain-text-splitters`; use `RecursiveCharacterTextSplitter.from_huggingface_tokenizer(tok, chunk_size=size, chunk_overlap=overlap, separators=["\n\n", "\n", ". ", " ", ""], add_start_index=True)` and call `create_documents([text])`; read `metadata["start_index"]` for `char_start` and add `len(page_content)` for `char_end`. For tiktoken use `from_tiktoken_encoder(encoding_name=..., ...)`.
4. Strategy `section`: one chunk per record `section_path` group; split sections longer than `size` with the recursive splitter inside the section. Prepend nothing to `text`; store `section_path` separately (adding headings to the embedded text is a separate experiment and must be its own `config_id`, for example `section+heading`).
5. Name each config `"<strategy>-<size>-<overlap>"`. Assign `chunk_id = "<doc_id>:<config_id>:<ordinal>"`.
6. Do not drop short trailing chunks silently; keep them and report their count.

### Output
One `chunks.jsonl` per config.

### Quality Gate
- For every chunk, `full_text[char_start:char_end].strip() == text.strip()` (the splitter may trim whitespace).
- Every character of every document is covered by at least one chunk in every config (compute the union of ranges per document; non-whitespace gaps must be zero).

---

## Phase 3: Report Shape Statistics

### Entry Criteria
- All configs built.

### Actions
1. Compute per config: chunk count, `n_tokens` p50, p95 and max, count over the model limit (must be 0), count of chunks shorter than their config's `overlap` in tokens (reported, not removed; they are usually document tails).
2. Write `chunks/index.json`.
3. Do NOT pick a winner here; `rag-chunk-size-select` picks by measured retrieval with the chosen embedding model.

### Output
`chunk_sets`.

### Quality Gate
- `index.json` lists every config with all statistics.
- Every config shows 0 chunks over the model limit.

---

## Worked Example

Illustrative. `tokenizer_name=BAAI/bge-small-en-v1.5`, `chunk_sizes=[[256,32],[512,64],[1024,128]]`.

```
model max_seq_length=512, prefix tokens=9 (query instruction applies to queries only), special=2
removed size 1024 (over 512 - 2)
config            chunks   p50  p95  max  short
fixed-256-32       21,604  256  256  256    1,199
fixed-512-64       10,903  512  512  510    1,199
recursive-256-32   23,118  231  256  256    2,870
recursive-512-64   11,840  466  512  512    1,544
section-512-64      9,207  301  512  512    3,102
coverage check: 0 uncovered non-whitespace characters in all configs
```

---

## Exit Criteria

DONE when every valid candidate config has a chunk file with verified offsets, full coverage, zero chunks over the model limit, and statistics in `index.json`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Tokenizer id not found | **Stop**: confirm the exact model id on the Hugging Face Hub; do not substitute a different tokenizer. |
| Phase 1 | All sizes exceed the limit | **Return**: ask the user for smaller sizes. |
| Phase 2 | `start_index` is -1 or wrong for repeated text | **Adjust**: compute offsets yourself by searching from the previous chunk's start, and verify with the Phase 2 gate. |
| Phase 2 | Coverage gap found | **Stop**: fix the splitter loop; chunks that skip text make answers unfindable. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

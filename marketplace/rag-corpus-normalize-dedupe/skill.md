# RAG Corpus Normalize and Dedupe

**One-line description:** Merges every extractor's records into one document text per `doc_id`, applies Unicode NFKC normalization and invisible-character removal with an offset remap, then removes exact and near-duplicate documents with MinHash LSH at a user-given Jaccard threshold.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `corpus_manifest` (string, required): Path to `corpus_manifest.jsonl`.
- `record_schema` (string, required): Path to `record_schema.json`.
- `work_dir` (string, required): Build folder; reads `work_dir/extracted/{pdf,ocr,html}/`, writes `work_dir/clean/`.
- `near_dup_threshold` (number, required): Estimated Jaccard similarity of word 5-gram shingle sets at or above which two documents count as near duplicates. A user decision; there is no universal value.

---

## Outputs

- `clean_records` (string): Path to `work_dir/clean/records.jsonl`, all records of kept documents after normalization, with offsets recomputed against the normalized text.
- `dedupe_report` (string): Path to `work_dir/clean/dedupe_report.json` listing exact duplicates, near-duplicate clusters with the kept `doc_id`, and characters removed by normalization.

---

## Phase 1: Merge Extractor Outputs

### Entry Criteria
- At least one of `work_dir/extracted/pdf`, `ocr`, `html` contains JSONL files.

### Actions
1. For every manifest line not `unsupported`, load its records from all extractor folders.
2. For `pdf_mixed` documents, merge text records and OCR records into one list ordered by `page`. If two records claim the same page, keep the text-layer record and log the conflict.
3. Check coverage: every manifest `doc_id` with a supported `kind` must have at least one record. List missing ones.
4. Recompute offsets for the merged order with the `"\n\n"` join rule.

### Output
Merged record lists per document.

### Quality Gate
- The missing-document list is empty, or each entry has a logged extractor error.
- For each `pdf_mixed` document, the merged page numbers are strictly increasing with no gaps other than blank pages.

---

## Phase 2: Normalize Text with an Offset Remap

### Entry Criteria
- Merged records exist.

### Actions
1. Apply `unicodedata.normalize("NFKC", text)` to each record. NFKC folds ligatures (the single character "fi" ligature becomes "f" + "i"), full-width forms and compatibility characters, which otherwise break BM25 term matching.
2. Remove invisible characters that hide text from readers but not from models: U+200B, U+200C, U+200D, U+2060, U+FEFF, U+00AD (soft hyphen), and the Unicode tag block U+E0000 to U+E007F. Log counts per document; a high tag-block count is a sign of hidden-instruction smuggling and is passed to `rag-retrieved-injection-defense` through the report.
3. Collapse runs of spaces and tabs to one space; collapse three or more newlines to two. Do not collapse single newlines; list and table structure needs them.
4. Because normalization changes lengths, recompute every record's `char_start` and `char_end` from the normalized texts. Gold labels must be created on normalized text only, which is why this runs before `rag-gold-question-set-label`.

### Output
Normalized records with recomputed offsets.

### Quality Gate
- `python -c` check: for every record, `full_text[char_start:char_end] == text` on the normalized join.
- A grep for `​` in the normalized output finds zero matches.

---

## Phase 3: Exact and Near-Duplicate Removal

### Entry Criteria
- Normalized records exist.

### Actions
1. Exact duplicates: hash each document's full normalized text with SHA-256. Keep the first `doc_id` per hash (manifest order), drop the rest, record the mapping.
2. Near duplicates: `pip install datasketch`. For each remaining document, build word 5-gram shingles from the lowercased text and a `MinHash(num_perm=128)` (128 is the datasketch default) with `m.update(shingle.encode("utf-8"))` per shingle.
3. Build `MinHashLSH(threshold=near_dup_threshold, num_perm=128)`, insert every MinHash with `lsh.insert(doc_id, m)`, and query each with `lsh.query(m)` to get candidate clusters.
4. LSH returns candidates, not verdicts. For each candidate pair compute the exact Jaccard of the shingle sets and keep the pair only if it is at or above `near_dup_threshold`.
5. Keep one document per cluster with this rule, in order: the newest `metadata` date; then the longest text; then the first in manifest order. Never merge texts of two versions; versions differ in the facts that matter.
6. Write kept documents' records to `clean/records.jsonl` and the report.

### Output
`clean_records`, `dedupe_report`.

### Quality Gate
- `dedupe_report.json` lists every dropped `doc_id` with the kept `doc_id` and the exact Jaccard value.
- `jq -s 'map(.doc_id) | unique | length' clean/records.jsonl` equals manifest supported documents minus dropped documents.

---

## Worked Example

Illustrative. 1,240 supported documents, `near_dup_threshold=0.9` chosen by the user.

```
$ python normalize_dedupe.py --work work --threshold 0.9
merged: 1240 docs, 0 missing, 3 page conflicts (text layer kept)
normalize: ligatures folded 4120, zero-width removed 312, tag-block chars 0
exact dupes: 18 dropped
lsh candidates: 61 pairs; exact jaccard >= 0.9: 44 pairs in 21 clusters; 23 dropped
kept: 1199 docs  ->  work/clean/records.jsonl
```

---

## Exit Criteria

DONE when `clean/records.jsonl` holds normalized records with verified offsets for every kept document and `dedupe_report.json` explains every drop.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A supported document has no records | **Return**: send it back to its extractor flow with the logged error. |
| Phase 2 | Offset check fails after normalization | **Stop**: offsets were not recomputed; fix before any labeling. |
| Phase 3 | `near_dup_threshold` not provided | **Stop**: ask the user; do not pick a value. Offer to print the distribution of exact Jaccard over LSH candidates at a low threshold to help them choose. |
| Phase 3 | A cluster joins different policy versions the user needs both of | **Adjust**: add an allowlist of `doc_id`s that are never dropped and rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

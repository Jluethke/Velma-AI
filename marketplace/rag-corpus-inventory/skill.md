# RAG Corpus Inventory

**One-line description:** Walks the raw source folder, classifies every file by real content type (text-layer PDF, scanned PDF, HTML, unsupported) with `file`, `pdffonts` and `pdftotext`, and fixes one record schema with character offsets that every extractor downstream must write.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_dir` (string, required): Folder holding the raw documents (PDF, HTML, HTM). Read only; this flow never writes inside it.
- `work_dir` (string, required): Folder where all RAG build artifacts are written. Created if missing. Must not be inside `source_dir`.

---

## Outputs

- `corpus_manifest` (string): Path to `work_dir/manifest/corpus_manifest.jsonl`, one line per source file: `doc_id`, `path`, `sha256`, `bytes`, `kind` (`pdf_text` | `pdf_scanned` | `pdf_mixed` | `html` | `unsupported`), `pages` (PDF only), `reason` (for `unsupported`).
- `record_schema` (string): Path to `work_dir/manifest/record_schema.json`, the JSON Schema every extractor record must satisfy.

---

## Phase 1: Enumerate and Hash

### Entry Criteria
- `source_dir` exists and is readable.
- `work_dir` is not inside `source_dir` (check: the absolute path of `work_dir` does not start with the absolute path of `source_dir`).

### Actions
1. Create the folders: `mkdir -p "$WORK_DIR/manifest" "$WORK_DIR/extracted" "$WORK_DIR/logs"`.
2. List every regular file recursively. On Linux or macOS: `find "$SOURCE_DIR" -type f | sort > "$WORK_DIR/manifest/files.txt"`. In PowerShell: `Get-ChildItem -Recurse -File $SOURCE_DIR | Sort-Object FullName | ForEach-Object FullName`.
3. Compute SHA-256 for every file: `sha256sum` (Linux), `shasum -a 256` (macOS), `Get-FileHash -Algorithm SHA256` (PowerShell).
4. Set `doc_id` to the first 16 hex characters of the SHA-256. Two files with the same hash get the same `doc_id`; keep the first path and record the others under `duplicate_paths` on that line. Do not ingest byte-identical files twice.
5. Detect the real type with `file --mime-type -b <path>`. Trust this over the extension: a `.pdf` that reports `text/html` is an HTML error page saved with the wrong name.

### Output
A list of unique files with `doc_id`, `path`, `sha256`, `bytes` and MIME type.

### Quality Gate
- `wc -l files.txt` equals the number of unique hashes plus the number of duplicate paths recorded.
- Every line has a 16 character hex `doc_id` and a MIME type from `file`.

---

## Phase 2: Classify PDFs and HTML

### Entry Criteria
- Phase 1 list exists.

### Actions
1. For each `application/pdf` file run `pdfinfo <path>` (poppler-utils) and read `Pages:` and `Encrypted:`.
2. If `Encrypted:` is `yes` and text extraction is blocked, set `kind` to `unsupported` with `reason` `encrypted`. Do not try to crack or strip the encryption.
3. Run `pdffonts <path>`. A PDF whose font table is empty has no text layer on any page.
4. Count text per page: `pdftotext -layout -f N -l N <path> - | wc -c` for each page N (or one call with `-` output and split on the form feed character `\f`, which pdftotext writes between pages).
5. Classify with this table:

| pdffonts lists fonts | Pages with zero non-whitespace characters | `kind` |
|---|---|---|
| no | all | `pdf_scanned` |
| yes | none | `pdf_text` |
| yes | some | `pdf_mixed` (record the empty page numbers in `ocr_pages`) |
| yes | all | `pdf_scanned` (fonts present but no extractable text, often an invisible OCR layer that is broken) |

6. For `text/html` and `application/xhtml+xml` set `kind` to `html`. Read the `<meta charset>` or `Content-Type` meta and store it as `charset`; if missing, store `null` (the extractor will detect it).
7. Every other MIME type gets `kind` `unsupported` with `reason` set to the MIME type. Do not invent a parser for it in this flow.

### Output
`corpus_manifest.jsonl` with every line classified.

### Quality Gate
- `jq -r .kind corpus_manifest.jsonl | sort | uniq -c` prints counts that sum to the unique file count.
- Every `pdf_mixed` line has a non-empty `ocr_pages` list.

---

## Phase 3: Fix the Record Schema

### Entry Criteria
- Manifest written.

### Actions
1. Write `record_schema.json` (JSON Schema draft 2020-12) with these required fields for every extracted record (one record per PDF page or per HTML document section):
   - `doc_id` (string), `source_path` (string), `kind` (string), `page` (integer or null for HTML), `section_path` (array of heading strings, empty if none), `text` (string), `char_start` and `char_end` (integers: offsets of this record inside the document's full concatenated text), `extractor` (string: tool name and version, for example `pymupdf 1.24.10`), `metadata` (object: title, author, url, published date when present).
2. State the concatenation rule inside the schema `description`: the full document text is the records in order joined with `"\n\n"`, so `char_start` of record i+1 equals `char_end` of record i plus 2. Gold labels and chunk offsets downstream depend on this rule; it must never change after labeling starts.
3. Validate the schema file itself: `python -m json.tool record_schema.json > /dev/null`.

### Output
`record_schema`.

### Quality Gate
- `python -m json.tool` exits 0 on the schema.
- The schema lists all ten required fields.

---

## Worked Example

Illustrative. `source_dir=./docs` with 3 files.

Phase 1 and 2:
```
$ file --mime-type -b docs/handbook.pdf
application/pdf
$ pdffonts docs/scan_2019.pdf
name                                 type              encoding         emb sub uni object ID
------------------------------------ ----------------- ---------------- --- --- --- ---------
$ jq -c '{doc_id,kind,pages}' work/manifest/corpus_manifest.jsonl
{"doc_id":"9f2c41d07ab3e815","kind":"pdf_text","pages":42}
{"doc_id":"03be77a1c9d24f60","kind":"pdf_scanned","pages":7}
{"doc_id":"c81d0e5f3a6b2297","kind":"html","pages":null}
```
Phase 3 writes `work/manifest/record_schema.json` with the ten required fields and the `"\n\n"` join rule.

---

## Exit Criteria

DONE when every file in `source_dir` has exactly one manifest line (or is listed as a duplicate path), every line has a `kind`, and `record_schema.json` validates.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `work_dir` is inside `source_dir` | **Stop**: ask for a different `work_dir`; extracted files would be re-ingested as sources. |
| Phase 2 | `pdffonts` or `pdfinfo` not installed | **Adjust**: install poppler-utils (`apt-get install poppler-utils`, `brew install poppler`, or the conda-forge `poppler` package), then rerun. |
| Phase 2 | `pdfinfo` reports a syntax error | **Adjust**: try `qpdf --check <path>`; if qpdf cannot repair it, mark `unsupported` with `reason` `corrupt`. |
| Phase 3 | Schema needs a field a later extractor wants | **Return**: add it as an optional field only; never rename or remove a required field once records exist. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

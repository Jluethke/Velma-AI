# RAG Python PDF Extraction with PyMuPDF

**One-line description:** Extracts page-tagged text from text-layer PDFs with PyMuPDF in reading order, strips repeated running headers and footers by cross-page frequency, keeps tables as Markdown, and writes schema-valid records with exact character offsets.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `corpus_manifest` (string, required): Path to `corpus_manifest.jsonl` from `rag-corpus-inventory`.
- `record_schema` (string, required): Path to `record_schema.json` from `rag-corpus-inventory`.
- `work_dir` (string, required): Build folder. Records go to `work_dir/extracted/pdf/<doc_id>.jsonl`.

---

## Outputs

- `pdf_records` (string): Folder `work_dir/extracted/pdf/` with one JSONL file per PDF of `kind` `pdf_text` or `pdf_mixed`, one record per page.
- `pdf_extract_log` (string): Path to `work_dir/logs/pdf_extract.jsonl` with per-document page count, characters extracted, header/footer lines removed, tables found, and errors.

---

## Phase 1: Install and Probe

### Entry Criteria
- `corpus_manifest` has at least one line with `kind` `pdf_text` or `pdf_mixed`.

### Actions
1. Create a virtual environment and install: `python -m venv .venv && . .venv/bin/activate && pip install pymupdf jsonschema`.
2. Record the version: `python -c "import pymupdf; print(pymupdf.__version__)"`. Older code imports `fitz`; current releases import `pymupdf`. Use `import pymupdf`. If the import fails, use `import fitz` and note the version; do not mix both.
3. Pick the first `pdf_text` file and print page 1 three ways to see which reading order is correct for this corpus:
   - `page.get_text("text")` (content stream order),
   - `page.get_text("text", sort=True)` (top-left to bottom-right sort),
   - `page.get_text("blocks", sort=True)` (list of tuples `(x0, y0, x1, y1, text, block_no, block_type)`).
4. Decide with this table, by reading the printed output against the PDF opened in a viewer:

| What you see | Use |
|---|---|
| Single column, order already correct with plain `"text"` | `get_text("text")` |
| Lines from two columns interleaved | `get_text("blocks", sort=True)` and order blocks column by column (split at the page midpoint `page.rect.width / 2` when every block lies on one side of it) |
| Order correct only with `sort=True` | `get_text("text", sort=True)` |

### Output
Chosen extraction mode written to the log header.

### Quality Gate
- The version line is in `pdf_extract.jsonl`.
- The chosen mode reproduces page 1 of the probe PDF in the same order as the viewer (check the first and last sentence).

---

## Phase 2: Extract Pages and Tables

### Entry Criteria
- Extraction mode chosen.

### Actions
1. For each manifest line with `kind` in (`pdf_text`, `pdf_mixed`), open with `doc = pymupdf.open(path)`. Skip pages listed in `ocr_pages`; `rag-ocr-scanned-pdf-ocrmypdf` handles those.
2. For each page, call `tabs = page.find_tables()`. For each table in `tabs.tables`, call `table.to_markdown()` and record `table.bbox`.
3. Extract text with the chosen mode, excluding words inside table bounding boxes so table text is not duplicated: use `page.get_text("words")` (tuples `(x0, y0, x1, y1, word, block_no, line_no, word_no)`), drop words whose rectangle intersects a table bbox (`pymupdf.Rect(w[:4]).intersects(table.bbox)`), then rebuild lines by `(block_no, line_no)`.
4. Append each table's Markdown after the page text, separated by a blank line.
5. Repair hyphenation at line ends only when the next line starts with a lowercase letter: `re.sub(r"(\w)-\n([a-z])", r"\1\2", text)`. Do not join hyphens followed by uppercase or digits (they are real hyphens in names and codes).
6. Read document metadata once: `doc.metadata` returns a dict with keys such as `title`, `author`, `creationDate`. Store non-empty values in each record's `metadata`.

### Output
Raw page texts per document in memory, with tables appended.

### Quality Gate
- For each document, the number of page texts equals `doc.page_count` minus the `ocr_pages` count.
- A table page from the probe document shows a Markdown table (`|---|` row present) and its cell text appears once, not twice.

---

## Phase 3: Remove Running Headers and Footers

### Entry Criteria
- Raw page texts exist.

### Actions
1. For each document with 3 or more pages, take the first 2 and last 2 non-empty lines of every page.
2. Normalize each candidate line: lowercase, replace every digit run with `#` (so "Page 3 of 40" and "Page 4 of 40" match).
3. Count in how many pages each normalized line appears. A line is a running header or footer when it appears on more than half the pages. This is a majority rule, not a tuned constant; if the user supplies a different fraction, use theirs and log it.
4. Remove those lines from every page and log each removed pattern with its page count.
5. Do NOT remove lines by a fixed top or bottom pixel band; page layouts differ and body text gets cut.

### Output
Cleaned page texts.

### Quality Gate
- `pdf_extract.jsonl` lists the removed patterns per document, and none of them is longer than one line.
- A spot check of 3 random pages shows no "Page N of M" lines remaining.

---

## Phase 4: Write Records and Validate

### Entry Criteria
- Cleaned page texts exist.

### Actions
1. Build records in page order. Set `char_start` of the first record to 0 and `char_end = char_start + len(text)`; the next record starts at the previous `char_end + 2` (the `"\n\n"` join rule in `record_schema`).
2. Set `extractor` to `"pymupdf " + pymupdf.__version__`, `page` to the 1-based page number, `section_path` to `[]` (PDF outlines can fill it: `doc.get_toc()` returns `[level, title, page]` rows; use the deepest entry whose page is at or before this page).
3. Write one JSON object per line to `work_dir/extracted/pdf/<doc_id>.jsonl` with `ensure_ascii=False`.
4. Validate every record: `python -c "import json,jsonschema,sys; s=json.load(open(sys.argv[1])); [jsonschema.validate(json.loads(l), s) for l in open(sys.argv[2], encoding='utf-8')]" record_schema.json <file>`.
5. Rebuild the full text by joining records with `"\n\n"` and assert `full[r["char_start"]:r["char_end"]] == r["text"]` for every record.

### Output
`pdf_records`, `pdf_extract_log`.

### Quality Gate
- Validation in step 4 exits 0 for every file.
- The offset assertion in step 5 passes for every record.
- No `pdf_text` document has a page with zero characters unless the PDF page is blank in the viewer (log it as `blank_page`).

---

## Worked Example

Illustrative. A 42-page two-column handbook, `doc_id 9f2c41d07ab3e815`.

```
$ python probe.py docs/handbook.pdf
mode=text           first line: "Leave Policy  Holidays are"   (columns interleaved)
mode=blocks sorted  first line: "Leave Policy"                  (correct)
$ python extract_pdf.py --manifest work/manifest/corpus_manifest.jsonl --out work/extracted/pdf
9f2c41d07ab3e815 pages=42 chars=118204 tables=6 removed=["acme handbook #", "page # of #"]
$ python validate_records.py work/manifest/record_schema.json work/extracted/pdf/*.jsonl
42 records valid, offsets verified
```

---

## Exit Criteria

DONE when every `pdf_text` and `pdf_mixed` document has a validated JSONL file whose offsets reproduce each record exactly, and the log lists the mode, removed headers and table counts.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `import pymupdf` fails after install | **Adjust**: check `pip show pymupdf`; on old versions use `import fitz`. Do not install the unrelated PyPI package named `fitz`. |
| Phase 2 | `find_tables` not present | **Adjust**: the installed version predates table support; upgrade with `pip install -U pymupdf` and rerun. |
| Phase 2 | Text comes out as mojibake or private-use characters | **Return**: mark the pages for OCR by adding them to `ocr_pages` and hand them to `rag-ocr-scanned-pdf-ocrmypdf`. |
| Phase 3 | A real section heading repeats on most pages and gets removed | **Adjust**: keep lines that also appear in `doc.get_toc()` titles. |
| Phase 4 | Offset assertion fails | **Stop**: the join rule was violated; fix the offset code before any labeling uses these records. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

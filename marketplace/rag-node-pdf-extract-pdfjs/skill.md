# RAG Node PDF Extraction with pdf.js

**One-line description:** Extracts page-tagged text from text-layer PDFs in Node.js with the `pdfjs-dist` legacy build, rebuilds lines from text item positions and `hasEOL`, strips repeated headers and footers, and writes schema-valid records with exact character offsets.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `corpus_manifest` (string, required): Path to `corpus_manifest.jsonl` from `rag-corpus-inventory`.
- `record_schema` (string, required): Path to `record_schema.json` from `rag-corpus-inventory`.
- `work_dir` (string, required): Build folder. Records go to `work_dir/extracted/pdf/<doc_id>.jsonl`.

---

## Outputs

- `pdf_records` (string): Folder `work_dir/extracted/pdf/` with one JSONL file per PDF of `kind` `pdf_text` or `pdf_mixed`, one record per page.
- `pdf_extract_log` (string): Path to `work_dir/logs/pdf_extract.jsonl` with per-document page count, characters, removed header/footer patterns, and errors.

---

## Phase 1: Install and Load

### Entry Criteria
- Node.js LTS installed (`node --version` prints a version).
- `corpus_manifest` has at least one `pdf_text` or `pdf_mixed` line.

### Actions
1. `npm init -y && npm install pdfjs-dist ajv`. Record `npm ls pdfjs-dist`.
2. In Node, import the legacy build, which is the build intended for Node environments: `import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";`. The exact path changed across major versions (older ones used `pdfjs-dist/legacy/build/pdf.js`); run `ls node_modules/pdfjs-dist/legacy/build/` and use the file that exists. Do not guess a path.
3. Load a document from bytes: `const data = new Uint8Array(await fs.promises.readFile(path)); const doc = await pdfjs.getDocument({ data }).promise;`. Passing a Node `Buffer` directly triggers an error in recent versions; convert to `Uint8Array`.
4. Print `doc.numPages` for the probe document and compare with `pages` in the manifest.

### Output
A working loader script `extract_pdf.mjs`.

### Quality Gate
- `node extract_pdf.mjs --probe <file>` prints the same page count as the manifest.

---

## Phase 2: Rebuild Lines from Text Items

### Entry Criteria
- Loader works.

### Actions
1. For each page: `const page = await doc.getPage(n); const tc = await page.getTextContent();`. Each entry of `tc.items` has `str`, `transform` (6 numbers; `transform[4]` is x, `transform[5]` is y in PDF units, origin bottom-left), `width`, `height`, and `hasEOL`.
2. Skip entries without `str` (marked content items have a `type` field instead).
3. Group items into lines: sort by y descending, then x ascending. Start a new line when `hasEOL` is true on the previous item or when the y difference to the previous item exceeds half of that item's `height`. Half the glyph height is a geometric rule of thumb; log it as such.
4. Insert a space between consecutive items on one line when the gap `next.x - (prev.x + prev.width)` is greater than zero and neither side already has whitespace.
5. Two-column detection: if the page has items with x on both sides of `viewport.width / 2` (from `page.getViewport({ scale: 1 })`) and no line crosses the midpoint, emit the left column lines first, then the right.
6. Repair end-of-line hyphenation only when the next line starts with a lowercase letter.
7. Call `page.cleanup()` after each page and `await doc.destroy()` after each document to release memory on large corpora.

### Output
Page texts per document.

### Quality Gate
- The probe document's page 1 text matches the viewer's reading order for the first and last sentence.
- Memory stays flat across documents (watch `process.memoryUsage().heapUsed` in the log every 50 documents).

---

## Phase 3: Remove Repeated Headers and Footers, Write Records

### Entry Criteria
- Page texts exist.

### Actions
1. For documents with 3 or more pages, collect the first 2 and last 2 non-empty lines per page, lowercase them and replace digit runs with `#`.
2. Remove lines that appear on more than half the pages (majority rule; log the patterns).
3. Build records in page order with `char_start` 0 for the first record, `char_end = char_start + text.length`, next `char_start = char_end + 2`. JavaScript `length` counts UTF-16 code units, while Python slicing counts code points. Store offsets in code points so Python tools downstream agree: compute with `[...text].length`.
4. Read metadata once with `const { info } = await doc.getMetadata();` (`info.Title`, `info.Author`, `info.CreationDate`) into `metadata`.
5. Set `extractor` to `"pdfjs-dist " + pdfjs.version`.
6. Validate every record with Ajv: `const ajv = new Ajv2020(); const validate = ajv.compile(schema);` using `import Ajv2020 from "ajv/dist/2020.js";` because the schema is draft 2020-12.
7. Rebuild the full text by joining records with `"\n\n"` and check, in code points, that each record's slice equals its `text`.

### Output
`pdf_records`, `pdf_extract_log`.

### Quality Gate
- Ajv reports zero errors for every record.
- The code-point offset check passes for every record, including a document containing an emoji or non-BMP character if the corpus has one.

---

## Worked Example

Illustrative.

```
$ node extract_pdf.mjs --probe docs/handbook.pdf
pdfjs-dist 4.x  numPages=42 (manifest 42)
$ node extract_pdf.mjs --manifest work/manifest/corpus_manifest.jsonl --out work/extracted/pdf
9f2c41d07ab3e815 pages=42 chars=117960 removed=["acme handbook #","page # of #"] heap=88MB
$ node validate_records.mjs work/extracted/pdf
42 records valid; offsets verified in code points
```

---

## Exit Criteria

DONE when every `pdf_text` and `pdf_mixed` document has an Ajv-valid JSONL file with code-point offsets that reproduce each record.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ERR_MODULE_NOT_FOUND` for the pdf.js path | **Adjust**: list `node_modules/pdfjs-dist/legacy/build/` and import the file that exists. |
| Phase 1 | Warning about a missing worker or `DOMMatrix` | **Adjust**: confirm the legacy build is imported; read the pdfjs-dist release notes for the installed major version. |
| Phase 2 | Text items contain no spaces between words | **Adjust**: apply the gap rule in Action 4; verify on the probe page. |
| Phase 2 | Out of memory on large PDFs | **Retry**: process one document per child process, and call `page.cleanup()` and `doc.destroy()`. |
| Phase 3 | Offsets differ from a Python check | **Stop**: offsets were counted in UTF-16 units; switch to code points before labeling. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

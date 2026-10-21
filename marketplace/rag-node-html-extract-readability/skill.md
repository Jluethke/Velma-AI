# RAG Node HTML Extraction with Readability

**One-line description:** Extracts the main article content of HTML pages in Node.js with Mozilla Readability on jsdom, strips hidden and injected elements first, splits the result into heading sections, and writes schema-valid records with code-point offsets.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `corpus_manifest` (string, required): Path to `corpus_manifest.jsonl`; this flow processes lines with `kind` `html`.
- `record_schema` (string, required): Path to `record_schema.json`.
- `work_dir` (string, required): Build folder. Records go to `work_dir/extracted/html/<doc_id>.jsonl`.

---

## Outputs

- `html_records` (string): Folder `work_dir/extracted/html/` with one JSONL per HTML document, one record per heading section.
- `html_extract_log` (string): Path to `work_dir/logs/html_extract.jsonl` with characters in and out, sections, hidden elements removed, and `isProbablyReaderable` result.

---

## Phase 1: Install and Build the DOM

### Entry Criteria
- `corpus_manifest` has at least one `html` line.

### Actions
1. `npm install @mozilla/readability jsdom ajv`. Record `npm ls @mozilla/readability jsdom`.
2. Read the file as a Buffer and let jsdom detect the encoding from the bytes and meta tags: `const dom = new JSDOM(buffer, { url: sourceUrl });`. Passing a Buffer (not a string) is what lets jsdom honor `<meta charset>`. Do not pass `runScripts`; scripts must never execute during ingestion.
3. Remove hidden elements before Readability runs: `document.querySelectorAll('[hidden], [aria-hidden="true"], template, noscript, script, style')` and every element whose `style` attribute, with spaces removed and lowercased, contains `display:none`, `visibility:hidden` or `font-size:0`. Call `el.remove()` on each and count them.
4. Clone the document before parsing, because Readability modifies the DOM it receives: `const clone = document.cloneNode(true);`.

### Output
A cleaned, cloned DOM per document.

### Quality Gate
- The log shows an element removal count for every document (zero is allowed).
- No `<script>` executed: the jsdom constructor call contains no `runScripts` option.

---

## Phase 2: Run Readability

### Entry Criteria
- Cleaned DOM exists.

### Actions
1. `import { Readability, isProbablyReaderable } from "@mozilla/readability";`
2. Log `isProbablyReaderable(document)`. A `false` result means the page may be a listing or app shell.
3. `const article = new Readability(clone).parse();` The result has `title`, `content` (HTML string), `textContent`, `length`, `excerpt`, `byline`, `siteName`, `lang`, `publishedTime` (field set depends on version; check the README for the installed version).
4. Decide with this table:

| Result | Action |
|---|---|
| `article` is `null` | Use `document.body.textContent` as one record, log `fallback=body` |
| `isProbablyReaderable` false and `article.length` far smaller than body text length | Check the page by hand; if body content was dropped, use the body fallback for this document |
| Otherwise | Use `article.content` |

5. Store `title`, `byline`, `siteName`, `publishedTime` in `metadata` when present.

### Output
Article HTML per document.

### Quality Gate
- Every document has either Readability output or a logged fallback.
- On 5 hand-checked documents, the first and last body paragraph in the browser appear in the output.

---

## Phase 3: Section Split and Write Records

### Entry Criteria
- Article HTML exists.

### Actions
1. Parse `article.content` with a new `JSDOM`. Walk the elements in document order; on `h1` to `h6` update a heading stack for `section_path`; collect text of `p`, `li`, `pre`, `blockquote` and tables (as Markdown rows) into the current section.
2. Collapse whitespace runs inside paragraphs to one space; separate paragraphs with `"\n"`.
3. Compute `char_start` and `char_end` in code points (`[...text].length`) with the `"\n\n"` join rule so Python tools agree on offsets.
4. Set `page` to `null`, `extractor` to `"readability <version> jsdom <version>"`.
5. Validate with Ajv 2020 (`import Ajv2020 from "ajv/dist/2020.js"`), then rebuild the full text and check each slice in code points.

### Output
`html_records`, `html_extract_log`.

### Quality Gate
- Ajv reports zero errors.
- The code-point offset check passes for every record.

---

## Worked Example

Illustrative.

```
$ node extract_html.mjs --probe docs/policy.html
encoding=utf-8  hidden_removed=3  isProbablyReaderable=true  article.length=9180
$ node extract_html.mjs --manifest work/manifest/corpus_manifest.jsonl
c81d0e5f3a6b2297 sections=7 fallback=none
  section_path=["Expense Policy","Travel","International"]
$ node validate_records.mjs work/extracted/html
7 records valid; offsets verified in code points
```

---

## Exit Criteria

DONE when every `html` document has Ajv-valid section records with code-point offsets, and hidden-element removal counts are logged.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Garbled characters | **Adjust**: confirm a Buffer, not a decoded string, is passed to `JSDOM`; set `contentType` with the right charset in the options if the file has no meta tag. |
| Phase 2 | `article` null for most documents | **Return**: the corpus is likely app shells or listings; ask for rendered snapshots or switch to `rag-py-html-extract-trafilatura`. |
| Phase 3 | Offsets disagree with Python | **Stop**: offsets were counted in UTF-16 units; fix before labeling. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

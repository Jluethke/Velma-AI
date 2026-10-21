# RAG Python HTML Extraction with Trafilatura

**One-line description:** Extracts the main content of HTML pages with Trafilatura, removing navigation, footers and hidden elements, keeps the heading path for every section, and writes schema-valid records per section with exact character offsets.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `corpus_manifest` (string, required): Path to `corpus_manifest.jsonl`; this flow processes lines with `kind` `html`.
- `record_schema` (string, required): Path to `record_schema.json`.
- `work_dir` (string, required): Build folder. Records go to `work_dir/extracted/html/<doc_id>.jsonl`.

---

## Outputs

- `html_records` (string): Folder `work_dir/extracted/html/` with one JSONL per HTML document, one record per heading section.
- `html_extract_log` (string): Path to `work_dir/logs/html_extract.jsonl` with per-document characters in, characters out, sections, hidden elements removed, and empty extractions.

---

## Phase 1: Install and Decode

### Entry Criteria
- `corpus_manifest` has at least one `html` line.

### Actions
1. `pip install trafilatura lxml jsonschema charset-normalizer`. Record `python -c "import trafilatura; print(trafilatura.__version__)"`.
2. Read each file as bytes. Decode with the manifest `charset` when present; otherwise use `charset_normalizer.from_bytes(raw).best()` and log the detected encoding. Never decode with a hard-coded `utf-8` and `errors="ignore"`; that deletes characters silently.
3. Remove hidden content before extraction, because hidden text is a common carrier for prompt injection against RAG systems. Parse with `lxml.html.fromstring` and drop elements that match any of:
   - attribute `hidden`, `aria-hidden="true"`;
   - inline `style` containing `display:none`, `visibility:hidden`, or `font-size:0` (normalize by removing spaces and lowercasing before matching);
   - `<template>`, `<noscript>`, `<script>`, `<style>`.
   Log the count of removed elements per document. CSS in external stylesheets cannot be evaluated here; note that limit in the log.
4. Serialize the cleaned tree back with `lxml.html.tostring(tree, encoding="unicode")`.

### Output
Decoded, hidden-content-free HTML strings.

### Quality Gate
- Every document has a logged encoding.
- Running a search for `display:none` on the cleaned HTML of the probe document returns no matches.

---

## Phase 2: Extract Main Content with Structure

### Entry Criteria
- Cleaned HTML strings exist.

### Actions
1. Call `trafilatura.extract(html, output_format="xml", include_tables=True, include_comments=False, include_links=False, with_metadata=True, url=<source url if known>)`. XML output keeps `<head>` elements for headings, which you need for `section_path`.
2. Choose precision versus recall per corpus by checking 5 documents by hand against the browser view:

| Observation on the 5 documents | Setting |
|---|---|
| Boilerplate (menus, cookie banners, related links) remains | add `favor_precision=True` |
| Real body paragraphs are missing | add `favor_recall=True` |
| Both fine | defaults |

   Never set both flags.
3. If `extract` returns `None`, retry once with `favor_recall=True`. If still `None`, fall back to `trafilatura.html2txt(html)` and log `fallback=html2txt`; that output has no structure, so it becomes a single record.
4. Read metadata with `trafilatura.extract_metadata(html)` (fields such as `title`, `author`, `date`, `url`, `sitename`) and store the non-empty ones in `metadata`.

### Output
Extracted XML per document.

### Quality Gate
- `html_extract.jsonl` shows zero documents where `extract` returned `None` without a logged fallback.
- On the 5 hand-checked documents, the first and last body paragraph in the browser appear in the extracted text.

---

## Phase 3: Split into Sections and Write Records

### Entry Criteria
- Extracted XML exists.

### Actions
1. Parse the XML. Walk the children of `<main>` in order; on each `<head>` element, read its `rend` attribute (`h1` to `h6`) to set the heading level, and update a heading stack so `section_path` holds the titles from the top level down to the current heading.
2. Emit one record per section with the text of its paragraphs, lists and tables. Render tables as Markdown rows `| a | b |`.
3. Compute offsets with the `"\n\n"` join rule in Python code points. Set `page` to `null`, `extractor` to `"trafilatura " + version`.
4. Validate every record against `record_schema` with `jsonschema.validate`.
5. Rebuild the full text and assert each record's slice equals its `text`.

### Output
`html_records`, `html_extract_log`.

### Quality Gate
- Every record validates and every offset assertion passes.
- At least one document with nested headings shows a `section_path` with two or more entries (if the corpus has nested headings).

---

## Worked Example

Illustrative. `doc_id c81d0e5f3a6b2297`, a policy page with a large site menu.

```
$ python extract_html.py --probe docs/policy.html
encoding=utf-8 (meta)  hidden_removed=3  default: menu text present in output
favor_precision=True: menu gone, body intact
$ python extract_html.py --manifest work/manifest/corpus_manifest.jsonl --favor precision
c81d0e5f3a6b2297 chars_in=184211 chars_out=9312 sections=7
  section_path=["Expense Policy","Travel","International"]
$ python validate_records.py work/manifest/record_schema.json work/extracted/html/*.jsonl
7 records valid, offsets verified
```

---

## Exit Criteria

DONE when every `html` document has validated section records, hidden elements were removed and counted, and no extraction returned empty without a logged fallback.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Detected encoding is wrong (garbled accents) | **Adjust**: set the encoding explicitly in the manifest for that file and rerun. |
| Phase 2 | Page content is rendered by JavaScript (body nearly empty) | **Return**: the saved HTML is a shell; ask for a rendered snapshot (for example saved from a headless browser) instead of extracting the shell. |
| Phase 2 | `favor_precision` drops real content on some pages | **Adjust**: run those pages with defaults and log the per-document setting. |
| Phase 3 | No `<head>` elements at all | **Adjust**: emit one record per document with `section_path` `[title]`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

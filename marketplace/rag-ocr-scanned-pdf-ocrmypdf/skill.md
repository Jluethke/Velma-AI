# RAG OCR for Scanned PDFs with OCRmyPDF

**One-line description:** Adds a text layer to scanned and mixed PDFs with OCRmyPDF and Tesseract using the correct language pack, extracts the OCR text per page with a sidecar file, measures OCR quality on a hand-typed sample, and writes schema-valid records.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `corpus_manifest` (string, required): Path to `corpus_manifest.jsonl`; this flow processes lines with `kind` `pdf_scanned` and the `ocr_pages` of `pdf_mixed` lines.
- `record_schema` (string, required): Path to `record_schema.json`.
- `work_dir` (string, required): Build folder. OCR'd PDFs go to `work_dir/ocr/`, records to `work_dir/extracted/ocr/<doc_id>.jsonl`.
- `ocr_language` (string, required): Tesseract language code or codes joined with `+`, for example `eng` or `eng+deu`.

---

## Outputs

- `ocr_records` (string): Folder `work_dir/extracted/ocr/` with one JSONL per processed document, one record per page.
- `ocr_log` (string): Path to `work_dir/logs/ocr.jsonl` with per-document OCRmyPDF exit code, pages processed, and the measured character error rate of the sample.

---

## Phase 1: Install and Check Languages

### Entry Criteria
- At least one manifest line needs OCR.

### Actions
1. Install: Debian/Ubuntu `sudo apt-get install ocrmypdf tesseract-ocr`; macOS `brew install ocrmypdf`; or `pip install ocrmypdf` plus Tesseract and Ghostscript from the OS package manager. OCRmyPDF needs both on PATH.
2. Check versions: `ocrmypdf --version`, `tesseract --version`, `gs --version`.
3. List installed languages: `tesseract --list-langs`. Every code in `ocr_language` must be listed. If one is missing, install it (Debian: `sudo apt-get install tesseract-ocr-deu` for `deu`).
4. Never OCR with the wrong language. Using `eng` on German text drops umlauts and hurts retrieval silently.

### Output
Working OCR toolchain.

### Quality Gate
- `tesseract --list-langs` output contains every code from `ocr_language`.

---

## Phase 2: Run OCR

### Entry Criteria
- Toolchain ready.

### Actions
1. Choose the mode per file with this table:

| Manifest `kind` | Command flag | Why |
|---|---|---|
| `pdf_scanned` with no text at all | `--skip-text` | OCRs pages without text, leaves others |
| `pdf_mixed` | `--skip-text` | Only the empty pages get OCR |
| `pdf_scanned` with a broken invisible text layer | `--force-ocr` | Rasterizes and replaces the bad layer |

2. Run per file:
   `ocrmypdf -l "$OCR_LANGUAGE" --skip-text --rotate-pages --deskew --sidecar "$WORK_DIR/ocr/$DOC_ID.txt" "$IN" "$WORK_DIR/ocr/$DOC_ID.pdf"`
   `--rotate-pages` fixes pages scanned sideways; `--deskew` straightens tilted scans. `--deskew` cannot be combined with `--redo-ocr`; if OCRmyPDF reports an incompatible option, remove `--deskew`.
3. Read the exit code. OCRmyPDF documents its exit codes (0 success, 6 means the file already has text and was skipped under default settings, others are errors); read `ocrmypdf --help` or the docs for the full list for your version rather than guessing.
4. Leave `-j` (parallel jobs within one file) at its default, which uses the available CPUs, and process files one after another. Do not also launch many ocrmypdf processes at once; that oversubscribes the CPUs.
5. The sidecar text file separates pages with a form feed character `\f`. Pages that were skipped because they already had text appear in the sidecar as a placeholder note; read the sidecar and treat those as "no OCR text" for this flow.

### Output
OCR'd PDFs and sidecar texts in `work_dir/ocr/`.

### Quality Gate
- Every processed file has exit code 0 in `ocr.jsonl`, or a logged reason.
- Sidecar page count (number of `\f` separators plus one) equals the manifest `pages`.

---

## Phase 3: Measure OCR Quality and Write Records

### Entry Criteria
- Sidecars exist.

### Actions
1. Sample pages for a quality check: pick pages at random (fixed seed, logged) across documents, and have a person type the true text of each sampled page into `work_dir/ocr/truth/<doc_id>_p<N>.txt`. The number of pages to sample is a user decision; record it.
2. Compute character error rate with `pip install jiwer` and `jiwer.cer(truth, hypothesis)` per page; log the mean and the worst page.
3. Report the CER; this flow does not decide if it is acceptable. If the user has no acceptance level, report it as an open question and keep going.
4. Build one record per OCR'd page: `text` from the sidecar page, `extractor` `"ocrmypdf <version> tesseract <version> lang=<codes>"`, `page` number, offsets with the `"\n\n"` join rule. For `pdf_mixed`, write only the `ocr_pages`; the text extractor wrote the others, and `rag-corpus-normalize-dedupe` merges both by page order.
5. Validate every record against `record_schema` with `jsonschema`.

### Output
`ocr_records`, `ocr_log`.

### Quality Gate
- Every record validates.
- `ocr.jsonl` contains the CER sample size, seed, mean CER and worst page.

---

## Worked Example

Illustrative. `doc_id 03be77a1c9d24f60`, 7 scanned pages, `ocr_language=eng`.

```
$ tesseract --list-langs
List of available languages in "/usr/share/tesseract-ocr/5/tessdata/" (2):
eng
osd
$ ocrmypdf -l eng --skip-text --rotate-pages --deskew --sidecar work/ocr/03be77a1c9d24f60.txt docs/scan_2019.pdf work/ocr/03be77a1c9d24f60.pdf
$ echo $?
0
$ python cer_sample.py --seed 7 --pages 3
p2 cer=0.021  p5 cer=0.034  p7 cer=0.118 (table with small print)  mean=0.058
```
Seven records written; the log flags page 7 as the worst page for review.

---

## Exit Criteria

DONE when every scanned page in the manifest has a validated OCR record and the log reports a measured CER on a typed sample.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Language code missing from `--list-langs` | **Stop**: install the traineddata package; do not fall back to `eng`. |
| Phase 2 | "page already has text" error | **Adjust**: add `--skip-text`, or `--force-ocr` if the existing layer is garbage. |
| Phase 2 | Ghostscript error on a damaged PDF | **Retry**: once after `qpdf in.pdf repaired.pdf`; if it fails again, log and skip the file. |
| Phase 3 | CER is high on small print or tables | **Adjust**: rerun that document with `--oversample` set to a higher DPI (see `ocrmypdf --help`) and remeasure. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

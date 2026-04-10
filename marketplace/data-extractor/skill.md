# Data Extractor

> **Starter Skill** — Free to use. Royalties to original creator on derivatives. Build on this.

Foundation pattern for pulling structured data out of unstructured text. Takes raw text (emails, documents, web pages, PDFs, chat logs) and extracts specified fields into clean JSON. Handles messy formatting, inconsistent labels, and missing fields. Fork this to create domain-specific extractors (invoice parser, resume parser, medical record extractor, etc.).

## Execution Pattern: ORPA Loop

```
OBSERVE --> Identify source format, scan for field patterns, detect structure cues
REASON  --> Map discovered patterns to target schema, resolve ambiguities
PLAN    --> Build extraction rules, define fallbacks for missing fields
ACT     --> Extract fields into clean JSON, flag low-confidence values
     \                                                              /
      +--- New source format or missing fields --- loop OBSERVE ---+
```

## Inputs

- `raw_text`: string -- The unstructured text to extract from (email body, document content, scraped page, etc.)
- `target_fields`: list[object] -- Fields to extract. Each: `{name, type ("string"|"number"|"date"|"boolean"|"list"), required (bool), description}`
- `source_hint`: string -- Optional hint about source type ("invoice", "resume", "support ticket", etc.)
- `examples`: list[object] -- Optional few-shot examples of input/output pairs for calibration

## Outputs

- `extracted_data`: object -- JSON object with target fields populated
- `confidence_scores`: object -- Per-field confidence (0.0-1.0) based on extraction clarity
- `extraction_notes`: list[string] -- Warnings about ambiguous, missing, or inferred values
- `raw_matches`: object -- The exact text spans each field was extracted from (for audit/debugging)

---

## Execution

### OBSERVE: Analyze Source Text

**Entry criteria:** Raw text and at least one target field are provided.

**Actions:**
1. Detect the source format. Look for structural cues: key-value pairs ("Name: John"), tabular data, headers/sections, free-form prose, or mixed formats. Note the dominant pattern.
2. Scan for each target field. Look for: explicit labels matching the field name, semantic equivalents (e.g., "Tel" for phone, "DOB" for date_of_birth), positional patterns (first line = title, last line = signature), and contextual clues.
3. Identify delimiters and separators. Common patterns: colon-separated ("Field: Value"), tab-separated, line-separated, comma-separated lists, or paragraph boundaries.
4. Flag structural ambiguities. Multiple possible values for one field, unlabeled values that could match several fields, or fields that appear in unexpected formats.

**Output:** Source format assessment, field location map, ambiguity flags.

**Quality gate:** Every target field has at least one candidate location or is flagged as not found.

---

### REASON: Resolve and Map

**Entry criteria:** Source analysis is complete with candidate field locations.

**Actions:**
1. For each target field, select the best candidate value. Prefer: explicitly labeled > semantically matched > positionally inferred > contextually guessed. Assign confidence accordingly: explicit = 0.9+, semantic = 0.7-0.9, positional = 0.5-0.7, contextual = 0.3-0.5.
2. Apply type coercion. Convert raw text to target type: parse dates into ISO format, strip currency symbols from numbers, normalize boolean expressions ("yes/true/1" to true), split comma-separated strings into lists.
3. Handle missing required fields. If a required field cannot be found: check if it can be inferred from other extracted fields (e.g., full_name from first_name + last_name), check if a default value is reasonable, or flag it as missing with extraction_notes.
4. Resolve conflicts. If multiple candidates exist for one field, prefer the one closest to a matching label, the one with the most specific match, or the most recently occurring instance.

**Output:** Field-to-value mapping with confidence scores and type-coerced values.

**Quality gate:** All required fields have a value or are explicitly flagged as missing. No field has confidence below 0.3 without an extraction note.

---

### PLAN: Build Extraction Output

**Entry criteria:** All fields are mapped with confidence scores.

**Actions:**
1. Assemble the extracted_data object with all target fields. Use null for fields that could not be extracted.
2. Compile confidence_scores. One entry per field reflecting extraction certainty.
3. Generate extraction_notes for any: missing required fields, low-confidence extractions (below 0.7), type coercion assumptions, ambiguous values where alternatives existed.
4. Record raw_matches showing the exact source text span for each extracted value.

**Output:** Complete extraction package ready for delivery.

**Quality gate:** extracted_data contains every target field (value or null). Every non-null value has a confidence score. Every confidence below 0.7 has an extraction note.

---

### ACT: Deliver and Validate

**Entry criteria:** Extraction package is assembled.

**Actions:**
1. Output the extracted_data as clean JSON.
2. Highlight any fields needing human review (confidence below 0.7 or missing required fields).
3. If examples were provided, compare output format against examples for consistency.
4. Check for loop trigger: did extraction reveal fields not in the target schema that seem important? If so, note them as suggested additions but do not loop automatically.

**Output:** Final extracted_data, confidence_scores, extraction_notes, raw_matches.

**Quality gate:** JSON is valid. All required fields are either populated or flagged. Confidence scores are present for all non-null values.

## Exit Criteria

The skill is DONE when:
1. All target fields are extracted or explicitly flagged as not found
2. Every extracted value has a confidence score
3. Low-confidence and missing fields are documented in extraction_notes
4. Output JSON is valid and matches target field types

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Raw text is empty or unreadable | **Escalate** -- ask for clearer input or different format |
| OBSERVE | No structural patterns detected | **Adjust** -- treat as free-form prose, rely on semantic matching |
| REASON | Required field not found anywhere | **Flag** -- set to null, add extraction note, continue with other fields |
| REASON | Type coercion fails (e.g., "TBD" for a date field) | **Adjust** -- keep as string, note type mismatch |
| ACT | Output JSON exceeds reasonable size | **Adjust** -- truncate list fields, note truncation |
| ACT | User rejects final output | **Targeted revision** -- ask which field extraction, confidence score, or type coercion fell short and rerun only that field. Do not re-extract the full document. |

## State Persistence

Between runs, this skill accumulates:
- **Field pattern library**: successful extraction patterns per source type (label variants, positions, delimiters)
- **Confidence calibration**: historical accuracy of confidence scores vs. human corrections
- **Source type signatures**: structural fingerprints that identify source formats automatically

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

# Trademark USPTO Search

**One-line description:** Searches the USPTO TESS database for exact, phonetic, and visually-similar marks in specified international trademark classes. Produces a structured conflict list pre-filtered to coordinated goods/services.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** No  --  single-party research.

**Disclaimer:** This flow produces a *preliminary screening report* intended to accelerate attorney review. It does NOT substitute for a formal trademark clearance opinion by a licensed trademark attorney.

---

## Inputs

- `proposed_mark` (string, required): The proposed mark in its primary form (e.g., "the governance provider Group").
- `mark_variants` (array, optional): Known variants and component forms to also search (e.g., ["the governance provider", "Wayfinder", "Wayfinder Group"]).
- `trademark_classes` (array, required): International trademark classes to search (integers 1-45). Typical software/SaaS/insurance platform: [9, 36, 42].
- `include_dead_marks` (boolean, optional, default false): Whether to include abandoned/cancelled marks (useful for prior-art context).

## Outputs

- `exact_matches` (array of objects): Live or pending marks where the literal string matches. Each row: serial_number, mark_text, owner, filing_date, registration_date, status, classes, goods_services_description.
- `phonetic_neighbors` (array of objects): Marks that sound similar (Metaphone/Soundex distance ≤ 2) even if spelled differently.
- `visual_similarities` (array of objects): Marks with common substitutions (0/O, 1/l/I, hyphens, plurals, trailing "s"/"group"/"systems").
- `class_filtered_conflicts` (array of objects): The subset of the above that falls within `trademark_classes` OR in USPTO-recognized "coordinated classes" (e.g., class 9 software coordinates with class 42 SaaS).
- `search_metadata` (object): Query strings executed, timestamp, TESS database version reference, and a confidence note ("attorney review required for final determination").

---

## Execution Phases

### Phase 0: Input Validation
### Entry Criteria
`proposed_mark` and `trademark_classes` present.
### Actions
Verify each class is a valid integer 1-45. Normalize mark to uppercase + strip punctuation for consistent search. Expand `mark_variants` to include plurals, hyphenated forms, and common abbreviations.
### Output
Validated search spec.
### Quality Gate
At least one class specified; mark is 1-80 characters.

### Phase 1: Exact-Match Search
### Entry Criteria
Search spec validated.
### Actions
Query TESS with exact-string quoted search for the proposed mark and each variant. Capture all LIVE and PENDING results; also capture DEAD if `include_dead_marks == true`.
### Output
Raw exact-match hit list.
### Quality Gate
Every LIVE/PENDING hit has `serial_number`, `mark_text`, `owner`, `classes`, and `goods_services_description` populated.

### Phase 2: Phonetic Neighbor Search
### Entry Criteria
Exact search complete.
### Actions
Apply Metaphone and Soundex to the proposed mark. Search TESS for marks whose phonetic encoding is within edit-distance 2. Filter to same broad phonetic neighborhood.
### Output
Phonetic neighbor hit list with similarity scores.
### Quality Gate
Each hit tagged with phonetic algorithm (Metaphone / Soundex) and distance score.

### Phase 3: Visual / Typographical Similarity Search
### Entry Criteria
Phonetic search complete.
### Actions
Generate visual variants of the proposed mark: common char substitutions (0/O, 1/l/I, rn/m), hyphen insertion/removal, plural forms, leading/trailing "The"/"Inc"/"Group"/"Systems". Search TESS for each variant.
### Output
Visual similarity hit list.
### Quality Gate
Variant list covers the top 20 most common confusable substitutions per USPTO TMEP guidance.

### Phase 4: Classification Filtering
### Entry Criteria
All similarity searches complete.
### Actions
Filter all hits to those registered in `trademark_classes` OR in USPTO-recognized coordinated classes. The coordinated-class map (e.g., 9↔42, 36↔42 for fintech) is applied so e.g. a mark registered only in class 42 SaaS still surfaces when searching for class 9 software.
### Output
`class_filtered_conflicts` list.
### Quality Gate
Every conflict has an explicit class-overlap rationale ("direct class match" / "coordinated class per TMEP 1207.01").

### Phase 5: Emit
### Entry Criteria
Classification filtering complete.
### Actions
Structure output into the five named fields. Add `search_metadata` with query log and attorney-review flag.
### Output
Final flow outputs per schema.
### Quality Gate
Zero unlabeled hits; every entry is LIVE / PENDING / DEAD; search metadata includes timestamp and coverage note.


---

## Worked Example

Illustrative only.

Given typical inputs for Searches the USPTO TESS database for exact, phonetic, and visually-similar marks, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.


---

## Exit Criteria

DONE when all phase quality gates pass and all outputs are populated.


---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Any | Missing required input | **Stop**: report which input is missing and what it should contain. |
| Any | Upstream phase output incomplete | **Return**: re-run the upstream phase with the gap identified. |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.

# WCAG 2.2 AA Conformance Report

**One-line description:** Writes a WCAG-EM style evaluation report and a per-criterion conformance table for all WCAG 2.2 level A and AA success criteria, using the ITI VPAT 2.5 conformance terms (Supports, Partially Supports, Does Not Support, Not Applicable), deriving each verdict only from re-test evidence and listing every open issue and every test not run.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_inventory` (object[], required): Output of `a11y-scope-inventory`; defines the evaluation scope and sample.
- `ranked_issues` (object[], required): Output of `a11y-impact-ranking`; includes the `not_run` note.
- `retest_results` (object[], required): Output of `a11y-retest-verify`.
- `product_name` (string, required): Name and version of the product evaluated, as the owner wants it in the report.

---

## Outputs

- `conformance_report` (string): Path to the report file (Markdown or HTML in the project, for example `<repo>/a11y/report/conformance-2026.md`), with scope, sample, tools and versions, per-criterion table, and conformance statement.
- `open_issues` (object[]): Every issue not fixed (partial, still-failing, regressed, not-retested), with `sc`, `impact`, `page_ids`, and ticket ids, plus best-practice and AAA items in a separate list.

---

## Phase 1: Scope, Sample and Method Sections

### Entry Criteria
- `retest_results` exists with a summary row.

### Actions
1. Write the scope: `product_name`, the base URL the `page_inventory` URLs belong to, the date range of testing, the conformance target "WCAG 2.2 Level AA", and exclusions from the inventory's `scope_notes`.
2. List the sample from `page_inventory`: structured, random and process rows with URL and state. State the random sample size and who set it, or "no random sample (open question)".
3. List every tool and assistive technology with versions, taken from the findings: axe-core version, Lighthouse version, Pa11y and pa11y-ci versions, Playwright version, browsers and versions, NVDA version, macOS and Safari versions, iOS version and device. If a pass was not run (from the `not_run` note or `not-retested` rows), list it under "Not tested".
4. Add the WCAG 2.2 note that SC 4.1.1 Parsing is obsolete and removed in WCAG 2.2; mark it "Not Applicable (removed in WCAG 2.2)" if a reader expects it.

### Output
Report sections 1 to 3.

### Quality Gate
- Every tool named in any finding appears with a version in the tools list.
- Every inventory row appears in the sample list.

---

## Phase 2: Per-Criterion Table

### Entry Criteria
- Phase 1 done.

### Actions
1. Build a table with one row for every WCAG 2.2 success criterion at levels A and AA (take the list from `https://www.w3.org/TR/WCAG22/`; with 4.1.1 removed there are 31 at level A and 24 at level AA). Count the rows to check: 55.
2. Set each row's verdict with these rules, in order:

   | Verdict | Rule |
   |---|---|
   | Not Applicable | no content in the sample is of the kind the SC covers (for example 1.2.x when there is no audio or video); state what was looked for |
   | Does Not Support | an open issue with this SC has `blocks_task` true (impact critical): some users cannot complete a task |
   | Partially Supports | one or more open issues exist for this SC, and none blocks a task |
   | Supports | no open issues for this SC, and the SC was actually tested (by the flow that covers it); cite the flow and evidence |
   | Not Evaluated | the SC was not tested. ITI allows "Not Evaluated" only for AAA criteria, so for A and AA it means the report cannot claim conformance; list it under "Not tested" and do not convert it to Supports |

   Write the verdict rule table itself into the report, so readers can check every verdict. If the owner prefers a different rule for choosing between Partially Supports and Does Not Support, they state it and the report quotes it.
3. In each row's remarks, list open issue ids and a one-line description; for Supports, name the test method (for example "axe-core rules plus NVDA and VoiceOver passes on all sample pages").
4. Map each SC to the flow that tests it so no row is marked Supports without a test: 1.1.1 and 1.4.5 images; 1.3.1 structure, forms, screen reader passes; 1.3.2 screen reader passes; 1.3.4, 1.4.4, 1.4.10, 1.4.12, 1.4.13 reflow check; 1.3.5 forms; 1.4.1, 1.4.3, 1.4.11 contrast; 1.4.2, 2.2.2, 2.3.1 motion; 2.1.1, 2.1.2, 2.1.4, 3.2.1, 3.2.2 keyboard; 2.4.1, 2.4.2, 2.4.6, 3.1.1, 3.1.2 structure; 2.4.3, 2.4.7, 2.4.11 focus; 2.4.4 screen reader passes; 2.5.1 to 2.5.4, 2.5.7, 3.2.6 pointer and help check; 2.5.8 target size; 3.3.1 to 3.3.4, 3.3.7, 3.3.8 forms; 4.1.2, 4.1.3 screen reader passes and forms. SCs with no flow here (1.2.1 to 1.2.5 media alternatives and captions, 1.3.3 Sensory Characteristics, 2.2.1 Timing Adjustable, 2.4.5 Multiple Ways, 3.2.3 Consistent Navigation, 3.2.4 Consistent Identification) must be tested manually against their Understanding document, or marked Not Applicable with the reason, before the report can claim them; otherwise they are Not Evaluated.

### Output
The per-criterion table.

### Quality Gate
- The table has exactly 55 rows (A plus AA in WCAG 2.2), each with one verdict from the five terms.
- Every Supports row cites a test method; every Partially Supports or Does Not Support row cites at least one open issue id.

---

## Phase 3: Conformance Statement and Open Issue List

### Entry Criteria
- Table complete.

### Actions
1. Write the statement with this rule: the product conforms to WCAG 2.2 Level AA only if every A and AA row is Supports or Not Applicable, for full pages and complete processes (WCAG conformance requirements 2 and 3). Otherwise write "does not yet conform" and give counts per verdict.
2. Never write "fully compliant", "100% accessible", or a Lighthouse score as evidence of conformance.
3. Produce `open_issues`: every register entry with status partial, still-failing, regressed or not-retested, with `sc`, `impact`, `page_ids`, ticket id, and target date if the owner gives one. Put best-practice and AAA items in a second list labeled as outside the AA target.
4. If the owner needs an Accessibility Conformance Report in VPAT form, copy the per-criterion table into the ITI VPAT 2.5 WCAG edition template (download from the ITI website) without changing verdicts.
5. Save the report file and record its path in `conformance_report`.

### Output
`conformance_report`, `open_issues`.

### Quality Gate
- The statement's conformance claim matches the table (a claim of conformance with any Partially Supports, Does Not Support or Not Evaluated A or AA row is an error).
- `open_issues` count equals the number of non-fixed entries in `retest_results`.

---

## Worked Example

Illustrative only. `product_name` = "Example Shop web storefront, release 2026.10".

Phase 1: sample of 14 rows (6 structured, 6 process, 2 random as set by the owner); tools: axe-core 4.x, Lighthouse 12.x, pa11y-ci 3.x, NVDA 2025.x with Firefox and Chrome, VoiceOver on macOS Safari. iOS pass listed under "Not tested" (no device).
Phase 2 rows:
```
| 1.4.3 Contrast (Minimum) | AA | Partially Supports | C006 hover state of Continue on P06 (serious, does not block the task) |
| 2.1.1 Keyboard           | A  | Supports           | Keyboard pass on all 14 rows; K004 fixed and re-tested |
| 1.2.2 Captions           | A  | Not Applicable     | No prerecorded video or audio in sample |
| 2.5.8 Target Size (Min)  | AA | Partially Supports | T004 promo close button on P06 |
```
Phase 3: two Partially Supports rows exist, so the statement reads "Example Shop web storefront, release 2026.10, does not yet conform to WCAG 2.2 Level AA: 49 Supports, 4 Not Applicable, 2 Partially Supports." `open_issues` lists C006 and T004 with tickets.

---

## Exit Criteria

DONE when the report has scope, sample, tools with versions, a 55-row per-criterion table with evidence-backed verdicts, a conformance statement consistent with the table, and an `open_issues` list matching the re-test results.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Tool versions missing from findings | **Return**: ask the flow that produced them to add versions; do not guess versions. |
| Phase 2 | An SC has no test evidence | **Adjust**: mark Not Evaluated and list it under "Not tested"; never default it to Supports. |
| Phase 3 | Owner asks to claim conformance with open issues | **Stop**: explain conformance requirements 2 and 3; offer the accurate statement and the open issue list with dates. |

**Do not:** mark an SC Supports because no automated rule fired; omit tests that were not run; use the words "compliant" or "certified" without a third-party certification.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

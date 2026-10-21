# Merge and Deduplicate Automated Scan Results

**One-line description:** Merges axe-core, Lighthouse and Pa11y findings into one issue list keyed by WCAG success criterion, page, and element, removes duplicates reported by more than one engine, and splits out every "incomplete" or "warning" item into a needs-review list for manual flows.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `axe_findings` (object[], required): Output of `a11y-axe-playwright-scan`.
- `lighthouse_findings` (object[], optional): Output of `a11y-lighthouse-audit`.
- `pa11y_findings` (object[], optional): Output of `a11y-pa11y-ci-scan`.

---

## Outputs

- `automated_issues` (object[]): Deduplicated confirmed failures: `issue_id` (A001, ...), `sc` (for example "1.4.3"), `page_id`, `selector`, `rule_ids` (every engine rule that reported it), `engines` (list), `impact`, `description`, `source` = "automated".
- `needs_review_items` (object[]): Every axe `incomplete`, Pa11y `warning`, and Lighthouse manual audit, with `page_id`, `selector`, `sc` where known, and the flow that must check it.

---

## Phase 1: Normalize Each Engine's Rows

### Entry Criteria
- `axe_findings` exists. The other two inputs may be empty.

### Actions
1. Convert every row into the common shape `{sc, page_id, selector, rule_id, engine, impact, result_type, message}`.
2. Derive `sc` per engine:

   | Engine | Where the SC is | Example |
   |---|---|---|
   | axe | tags matching `wcag\d{3,4}`: digits become dotted | `wcag143` to 1.4.3, `wcag1410` to 1.4.10, `wcag258` to 2.5.8 |
   | Pa11y htmlcs | fourth segment of `code`, underscores to dots | `...Guideline1_3.1_3_1.H44` to 1.3.1 |
   | Pa11y axe | same as axe, look up the rule id's tags in an axe result file | `label` to the SCs in its tags |
   | Lighthouse | audit id equals the axe rule id it wraps; take the SC from the axe tags of the same rule | `button-name` to 4.1.2 |

   A rule with two SC tags yields one row per SC. Read the tags from the actual result file; do not assume a rule's tags from memory, because they change between axe-core versions.
3. Derive `selector`: axe `nodes[].target` joined with a space (iframes and shadow DOM give arrays of arrays; join levels with " >> "), Pa11y `selector`, Lighthouse `selectors[]`.
4. Set `impact`: take axe `impact` where the engine is axe or Lighthouse; for htmlcs rows, copy the impact of an axe row on the same SC and selector if one exists, otherwise leave `null` for `a11y-impact-ranking` to assign.
5. Set `result_type`: axe `violation` and Pa11y `error` and Lighthouse score 0 become `fail`; axe `incomplete`, Pa11y `warning`, and Lighthouse manual audits become `review`.

### Output
One normalized table.

### Quality Gate
- Row count equals the sum of input rows plus extra rows from multi-SC splits; count both and compare.
- No `fail` row has a null `sc`.

---

## Phase 2: Deduplicate

### Entry Criteria
- Normalized table exists.

### Actions
1. Normalize selectors before comparing: trim whitespace, drop `:nth-child(1)` when it is the only child selector, lower-case tag names. Do not rewrite ids or classes.
2. Two `fail` rows are the same issue when `sc`, `page_id` and normalized `selector` are equal. Merge them: union of `rule_ids` and `engines`, keep the highest `impact` in the order critical, serious, moderate, minor.
3. Two `fail` rows on different pages with the same `sc` and the same selector inside a shared component (from the component inventory `used_on`) stay separate rows here, because conformance is per page, but give them the same `group_key` = `sc + selector` so the fix flow fixes the component once.
4. Assign `issue_id` values A001, A002, ... in order of `sc`, then `page_id`.

### Output
`automated_issues`.

### Quality Gate
- `jq 'group_by([.sc,.page_id,.selector]) | map(length) | max' automated_issues.json` prints 1.
- Every `issue_id` is unique.

---

## Phase 3: Route Needs-Review Items

### Entry Criteria
- `review` rows exist or the list is confirmed empty.

### Actions
1. Route each `review` row to the flow that can decide it:

   | Rule or audit | Route to |
   |---|---|
   | `color-contrast`, `color-contrast-enhanced`, `link-in-text-block` | `a11y-color-contrast-measure` |
   | `target-size` | `a11y-target-size-measure` |
   | `focus-traps`, `logical-tab-order`, `focusable-controls`, `managed-focus` | `a11y-keyboard-operability-pass` |
   | `visual-order-follows-dom`, `offscreen-content-hidden` | `a11y-focus-order-visibility-check` |
   | `custom-controls-labels`, `custom-controls-roles`, `aria-*` incomplete | `a11y-nvda-screen-reader-pass` |
   | `image-alt`, `svg-img-alt`, `role-img-alt`, htmlcs H37 or G94 warnings | `a11y-images-alt-text-audit` |
   | `use-landmarks`, `heading-order`, `region`, htmlcs H42 warnings | `a11y-headings-landmarks-audit` |
   | htmlcs `3_3_*` warnings, `autocomplete-valid` | `a11y-forms-error-messaging-audit` |
   | anything else | `a11y-nvda-screen-reader-pass` |

2. Write `needs_review_items` with a `route_to` field.

### Output
`needs_review_items`.

### Quality Gate
- Every `review` row from Phase 1 appears exactly once in `needs_review_items`.
- Every item has a non-empty `route_to` naming an existing flow.

---

## Worked Example

Illustrative only. Input: axe reports `color-contrast` on P05 `#continue`; Pa11y htmlcs reports `...1_4_3.G18.Fail` on P05 `#continue`; Lighthouse reports `color-contrast` on P05 with selector `#continue`.

Phase 1: three normalized rows, all `sc` = 1.4.3, `result_type` = fail.
Phase 2: one merged issue:
```json
{"issue_id":"A014","sc":"1.4.3","page_id":"P05","selector":"#continue",
 "rule_ids":["color-contrast","WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Fail"],
 "engines":["axe","htmlcs","lighthouse"],"impact":"serious","source":"automated"}
```
Phase 3: an axe `incomplete` contrast row for `.hero h1` (text on a photo) goes to `needs_review_items` with `route_to` = `a11y-color-contrast-measure`.

---

## Exit Criteria

DONE when every input row is either merged into exactly one `automated_issues` row or routed into exactly one `needs_review_items` row.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A Pa11y code has no SC segment (for example a runner error) | **Adjust**: put it in `needs_review_items` with `route_to` = `a11y-nvda-screen-reader-pass` and the raw message. |
| Phase 2 | Selectors differ only by generated class hashes (CSS modules, styled-components) | **Adjust**: compare by the stable part (id, `data-testid`, role and name) and record the rule used. |
| Phase 3 | An item fits two routes | **Adjust**: route to the first matching row in the table, top to bottom. |

**Do not:** drop an issue because only one engine reported it; merge rows across different SCs; mark `review` items as passes.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

# Rank Accessibility Issues by User Impact

**One-line description:** Merges every automated and manual issue list into one register, assigns each issue an impact level and a "blocks task" flag with a fixed decision table, and orders the register lexicographically by task blocking, journey priority, impact, and number of pages affected, with no invented weights or scores.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `critical_journeys` (string[], required): Owner's priority-ordered user tasks; position 1 is the most important.
- `automated_issues` (object[], optional): From `a11y-scan-merge-dedupe`.
- `keyboard_issues` (object[], optional): From `a11y-keyboard-operability-pass`.
- `focus_issues` (object[], optional): From `a11y-focus-order-visibility-check`.
- `nvda_issues` (object[], optional): From `a11y-nvda-screen-reader-pass`.
- `voiceover_macos_issues` (object[], optional): From `a11y-voiceover-macos-pass`.
- `voiceover_ios_issues` (object[], optional): From `a11y-voiceover-ios-pass`.
- `contrast_issues` (object[], optional): From `a11y-color-contrast-measure`.
- `form_issues` (object[], optional): From `a11y-forms-error-messaging-audit`.
- `image_issues` (object[], optional): From `a11y-images-alt-text-audit`.
- `structure_issues` (object[], optional): From `a11y-headings-landmarks-audit`.
- `motion_issues` (object[], optional): From `a11y-motion-reduced-motion-check`.
- `target_size_issues` (object[], optional): From `a11y-target-size-measure`.
- `reflow_issues` (object[], optional): From `a11y-reflow-zoom-spacing-check`.
- `pointer_help_issues` (object[], optional): From `a11y-pointer-help-wcag22-check`.

---

## Outputs

- `ranked_issues` (object[]): The single issue register in fix order: `rank`, `issue_id`, `root_cause_key`, `sc`, `level` (A, AA, or AAA), `page_ids` (all pages affected), `selector`, `source` (list of flows that found it), `impact` (critical, serious, moderate, minor), `blocks_task`, `journey` (the critical journey affected, or null), `journey_position`, `user_groups` (who is affected), `best_practice_only`, `evidence` (links to the original rows).

---

## Phase 1: Merge into One Register

### Entry Criteria
- At least one issue list is non-empty.

### Actions
1. Load every input list that is present. Missing optional lists mean that test was not run; record which in a `not_run` note that `a11y-conformance-report` will use. A missing list is not "zero issues".
2. Build `root_cause_key` = `sc` + normalized selector (or component id when present). Merge rows across flows with the same key and the same page into one issue: keep all `issue_id` values in `evidence`, union `source`.
3. Merge rows with the same key across pages into one register entry with all `page_ids`, because one component fix repairs them all.
4. Set `level` from the SC: use the WCAG 2.2 list of success criteria and levels at `https://www.w3.org/TR/WCAG22/`. Rows from `motion_issues` with `level` AAA and rows with `best_practice_only` = true stay in the register but are sorted after all A and AA issues.

### Output
A merged register.

### Quality Gate
- Every input row appears in exactly one register entry's `evidence` list (count input rows and evidence entries).
- Every entry has `level` set.

---

## Phase 2: Assign Impact and Task Blocking

### Entry Criteria
- Merged register exists.

### Actions
1. Set `blocks_task` = true when any source row has `blocks_task` true, or when the issue matches one of these, on a page that belongs to a critical journey:
   - keyboard trap (2.1.2), or a control not reachable or operable by keyboard (2.1.1)
   - a control with no accessible name, or a wrong role, that must be used to finish the task (4.1.2)
   - a form field with no label where the purpose cannot be inferred (1.3.1, 3.3.2)
   - errors not identified in text (3.3.1)
   - focus lost or not moved into an opened dialog (2.4.3)
   - authentication with no alternative to a cognitive function test, or paste blocked (3.3.8)
   - dragging as the only way to complete a step (2.5.7)
2. Set `impact` with this table, using the first row that matches:

   | Impact | Rule |
   |---|---|
   | critical | `blocks_task` is true |
   | serious | the task can be completed only with significant extra effort or a workaround the user must discover (for example contrast below the requirement on body text, missing status announcement for a cart update, target size failure on a frequent control, reflow forcing horizontal scroll on every line) |
   | moderate | users can complete the task but lose information or are confused (a visual section heading not marked up as a heading, unclear link text with context available, non-essential image missing alt) |
   | minor | annoyance with no information loss (redundant alt text, best-practice-only items) |

   If an axe `impact` exists and is higher than the table result, keep the higher level and note it. Never lower an impact because the fix looks hard.
3. Set `user_groups` from the SC's principle: 1.1.1, 1.3.x, 4.1.x screen reader users; 1.4.3, 1.4.11 low vision and color vision deficiency; 1.4.10, 1.4.4, 1.4.12 low vision with zoom; 2.1.x keyboard and switch users; 2.4.7, 2.4.11 keyboard users; 2.5.x motor impairments and touch users; 2.2.2, 2.3.x vestibular and photosensitive users; 3.3.x cognitive disabilities and everyone.
4. Set `journey` and `journey_position` from `critical_journeys`: an issue on any page of a journey takes that journey's position; if on several, take the lowest position number. Issues on no journey get position = length of `critical_journeys` + 1.

### Output
A register with impact, task blocking and journey fields.

### Quality Gate
- Every entry has `impact`, `blocks_task`, `journey_position`, and `user_groups`.
- No entry with `blocks_task` true has an impact other than critical.

---

## Phase 3: Order the Register

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Sort lexicographically by these keys, in this order:
   1. A and AA issues before AAA and best-practice-only issues.
   2. `blocks_task` true before false.
   3. `journey_position` ascending.
   4. `impact`: critical, serious, moderate, minor.
   5. number of `page_ids` descending (a shared component fix helps more pages).
   6. `sc` ascending as a tie breaker, then `issue_id`.
2. Assign `rank` 1, 2, 3, ... in that order.
3. Do not convert impact into numbers and add them. Lexicographic order keeps every rule explainable from the table.

### Output
`ranked_issues`.

### Quality Gate
- `jq 'map(.rank) == ([range(1; length+1)])' ranked_issues.json` prints `true`.
- Spot check: the first entry with `blocks_task` false has a rank greater than every entry with `blocks_task` true among A and AA issues.

---

## Worked Example

Illustrative only. `critical_journeys` = ["buy a product as a guest", "reset password"].

Inputs include K004 (size picker not keyboard operable, P02, journey 1), N004 (cart toast not announced, P02), C006 (button contrast 2.81:1 on P05, journey 1), S003 (skipped heading level, best practice), MO002 (reduced motion, AAA).

Phase 2: K004 critical, `blocks_task` true; C006 serious; N004 serious; S003 minor; MO002 minor.
Phase 3 order:
```
rank 1  K004  2.1.1  critical  blocks  journey 1  pages 1
rank 2  C006  1.4.3  serious           journey 1  pages 4
rank 3  N004  4.1.3  serious           journey 1  pages 1
rank 4  S003  best practice
rank 5  MO002 2.3.3  AAA
```
C006 outranks N004 because it affects four pages (key 5).

---

## Exit Criteria

DONE when every issue from every input list is in exactly one register entry, each entry has impact, task blocking and journey position from the decision tables, and the register is in lexicographic order with consecutive ranks.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `critical_journeys` is empty | **Stop**: ask the owner for the priority-ordered list; ranking without it hides which failures stop real tasks. |
| Phase 1 | Two flows describe the same failure with different selectors | **Adjust**: merge by component id when both map to the same component; otherwise keep separate. |
| Phase 2 | Owner disputes a critical rating | **Return**: show the decision table row that set it; change it only if the facts (task blocked or not) are shown to be wrong. |

**Do not:** invent numeric weights or a score formula; drop best-practice items (sort them last); treat a test that was not run as zero issues.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

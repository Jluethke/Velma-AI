# Decompose the Change into Single-Hunk Edits

**One-line description:** Splits the change into an ordered list of edits where each one touches one file in one contiguous hunk, has one purpose, and produces a predictable signal on the verify card, using test-first ordering and the expand-then-contract pattern for changes that cross files.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `goal_check` (object, required): From `stp-goal-to-runnable-check`.
- `context_notes` (object[], required): From `stp-context-read-budget`.
- `target_files` (string[], required): From `stp-context-read-budget`.
- `scope_limits` (object, required): From `stp-goal-to-runnable-check`.

---

## Outputs

- `edit_list` (object[]): `[{ "id": "E1", "file": str, "purpose": str, "kind": str, "expected_signal": str }]`, in execution order.

---

## Phase 1: Choose the Ordering Pattern

### Entry Criteria
- `target_files` is non-empty.

### Actions
1. Pick the pattern with this table (first match wins):

| Situation | Pattern | Order |
|---|---|---|
| `goal_check.check_exists` is false | test first | E1 adds the test; E2+ change the code |
| Change is inside one function body | single site | one edit per contiguous region |
| Change alters a signature, name or type used in other files | expand then contract | add the new form next to the old one; switch each caller, one file per edit; remove the old form last |
| Change needs a new helper | helper first | E1 adds the helper (unused); E2 calls it |
| Change needs a new import | import with use | the import and the line that uses it go in the same file; if far apart, the import is its own edit placed just before the use edit |

2. Never order an edit so that the code fails to compile between edits when a compile-safe order exists. Expand then contract exists to keep every intermediate state compiling.

### Output
Chosen pattern.

### Quality Gate
- The pattern is one row of the table, and the row's condition is true from `context_notes`.

---

## Phase 2: Cut the Edits

### Entry Criteria
- Pattern chosen.

### Actions
1. Write one edit per contiguous hunk. Rules:
   - One file per edit. Never two files in one edit.
   - One contiguous block of lines per edit. If two changes in the same file are separated by unchanged lines, they are two edits.
   - One purpose per edit, stated in one sentence that starts with a verb ("Add test for accented input", "Fold accents before the regex").
   - Formatting-only changes are not edits unless `check_touched` fails on lines you changed; never reformat lines you did not change.
2. Set `kind`: `add_test`, `add_code`, `change_code`, `add_import`, `remove_code`, `switch_caller`.
3. Set `expected_signal`: the verify card result you predict after this edit. Use these forms:
   - `add_test` before the fix: "L1 fails with an assertion error comparing `<actual>` to `<expected>`" (not an import or collection error).
   - Fix edit: "L1 passes: exit 0 and `<must_contain>`".
   - Compile-safe intermediate edit: "L0 passes, L1 unchanged from previous edit".
4. Check every file against `scope_limits.in_scope`. An edit in a file outside it is allowed only if the file is a direct caller or callee of the target, and you mark it `"out_of_scope_reason"`. Otherwise drop it and record it for the stop flow.

### Output
Draft `edit_list`.

### Quality Gate
- No two edits share a purpose sentence.
- Every edit has exactly one `file`.
- Every `expected_signal` names a card level (L0, L1, L2) and a concrete result.

---

## Phase 3: Check the List

### Entry Criteria
- Draft list exists.

### Actions
1. Walk the list from E1 to the end and, for each edit, answer from `context_notes`: "After this edit and all before it, does the code compile?" If no and the pattern allows a compile-safe order, reorder.
2. Confirm the last edit's `expected_signal` is "L1 passes".
3. Confirm no edit's purpose deletes, skips or loosens an existing test (words to check: delete test, skip, xfail, `.only`, `#[ignore]`, `@Disabled`, change expected value). If one does, remove it; that is out of scope.
4. Append the list to `scratch_log` under `EDIT LIST`.

### Output
`edit_list`.

### Quality Gate
- The final edit's `expected_signal` is "L1 passes".
- `rg -n -i "skip|xfail|ignore|disabled|\.only|delete test" <<< "<purposes>"` finds nothing (in PowerShell, test the purposes string with `-match`).

---

## Worked Example

Illustrative only.

Goal: slugify folds accents. `check_exists` false. `context_notes` shows the regex on `slugkit/core.py:16` and `import re` on line 1.

- Phase 1: test first; the fix needs `unicodedata`, an import far from the use, so "import with use" applies too.
- Phase 2:
  - E1 `tests/test_slugify.py`, add_test, "Add test for accented input"; expected: "L1 fails with AssertionError comparing 'crme-brle' to 'creme-brulee'".
  - E2 `slugkit/core.py`, add_import, "Import unicodedata"; expected: "L0 passes, L1 unchanged".
  - E3 `slugkit/core.py`, change_code, "Fold accents before the regex"; expected: "L1 passes: exit 0 and `1 passed`".
- Phase 3: compile check passes at every step (an unused import compiles in Python; ruff may flag F401 after E2, which is expected until E3 and is recorded as such).

---

## Exit Criteria

DONE when `edit_list` is ordered, each edit is one hunk in one file with one purpose, and the last edit is predicted to make L1 pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Signature change used in many files | **Adjust**: expand then contract; one `switch_caller` edit per file. |
| Phase 2 | An edit cannot be stated in one sentence | **Adjust**: split it until each part can. |
| Phase 2 | Needed file is out of scope and not a direct caller or callee | **Return**: record it for `stp-stop-or-continue`. |
| Phase 3 | Intermediate state cannot compile in any order (for example Go "imported and not used") | **Adjust**: merge the import into the edit that uses it; state the merge in the purpose. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

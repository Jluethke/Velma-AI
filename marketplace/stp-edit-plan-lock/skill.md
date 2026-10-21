# Lock the Edit Plan Against the API and Flag Evidence

**One-line description:** Merges the stack's API evidence and the flag evidence into the draft plan, keeps only edits whose every external name and flag has a FOUND row, rewrites or drops the rest with a written reason, and freezes the result as the locked plan that the apply step is allowed to execute.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `edit_plan` (object[], required): From `stp-edit-plan-write`.
- `py_api_evidence` (object[], optional): From `stp-py-api-exists-check`.
- `node_api_evidence` (object[], optional): From `stp-node-api-exists-check`.
- `go_api_evidence` (object[], optional): From `stp-go-api-exists-check`.
- `rust_api_evidence` (object[], optional): From `stp-rust-api-exists-check`.
- `java_api_evidence` (object[], optional): From `stp-java-api-exists-check`.
- `flag_evidence` (object[], required): From `stp-cli-flag-exists-check` (may be empty).
- `scratch_log` (string, required): Path from `stp-scratch-log-start`.

---

## Outputs

- `locked_plan` (object[]): The plan entries cleared to apply, each with `"locked": true` and an `evidence_refs` list.
- `unverified_items` (object[]): `[{ "edit_id": str, "item": str, "status": str, "reason": str }]` for every symbol or flag that is not FOUND, and every edit removed from the plan.

---

## Phase 1: Join Evidence to Edits

### Entry Criteria
- `edit_plan` exists and at least one API evidence input is present or no edit has `external_symbols`.

### Actions
1. Concatenate whichever API evidence inputs are present into one list. Index it by `symbol`.
2. For each edit, for each name in `external_symbols`, look up its row. Missing row: treat as status `UNCHECKED`.
3. For each flag in `cli_flags`, look up its row in `flag_evidence`. Missing row: `UNCHECKED`.
4. Build a table: `edit_id | item | status | evidence (quoted)`.

### Output
Joined table.

### Quality Gate
- Every external symbol and flag in the plan appears in the table exactly once per edit that uses it.

---

## Phase 2: Decide Per Edit

### Entry Criteria
- Joined table exists.

### Actions
1. Apply this table to each edit:

| Item statuses in the edit | Action |
|---|---|
| all FOUND | keep the edit unchanged; set `locked: true` |
| any `WRONG_SIGNATURE` or `NEEDS_VALUE_FORMAT`, and the evidence quotes the real signature or format | rewrite `new_text` to the quoted signature; the rewritten names must all be FOUND; record the rewrite in `unverified_items` with status `REWRITTEN` |
| any `NOT_FOUND`, `NOT_IN_GRAPH`, `NOT_ON_CLASSPATH`, and the evidence names an alternative that is itself FOUND | replace with the alternative; record `REPLACED` |
| any `VERSION_GATED` or `FEATURE_GATED` with a FOUND alternative | replace with the alternative; record `REPLACED` |
| any non-FOUND item with no FOUND alternative | remove the edit; record `REMOVED` with the reason |
| any `UNCHECKED` | do not lock; send the item back to the matching check flow, then rerun this flow |

2. A rewrite or replacement changes `new_text`, so re-check the identifier rule from `stp-edit-plan-write` Phase 2: every identifier in the new `new_text` is defined in it, quoted in context, or FOUND in evidence.
3. If an edit is removed, check every later edit: if a later edit depends on it (uses a name it added), remove that edit too and record `REMOVED (depends on <id>)`.

### Output
Decision per edit.

### Quality Gate
- No locked edit contains an item whose status is anything other than FOUND (after rewrite or replacement).
- Every removed edit has a reason in `unverified_items`.

---

## Phase 3: Freeze the Plan

### Entry Criteria
- Every edit decided.

### Actions
1. Write `locked_plan` with the kept and rewritten edits in original order, each with `evidence_refs` (the `command` fields of its evidence rows).
2. Confirm the last edit in `locked_plan` still has `expected_signal` "L1 passes". If the edit that was going to make L1 pass was removed, the goal cannot be reached with verified APIs: write that in `unverified_items` and set `locked_plan` to the edits before it only if they are useful alone (for example the new failing test); otherwise set it empty.
3. Append to `scratch_log`: `PLAN LOCKED: <ids>` and `UNVERIFIED: <items>`. From now on, any change to `locked_plan` requires running this flow again.

### Output
`locked_plan`, `unverified_items`.

### Quality Gate
- `scratch_log` contains a `PLAN LOCKED:` line listing exactly the ids in `locked_plan`.
- Either the last locked edit expects "L1 passes", or `unverified_items` contains a row saying the goal edit was removed.

---

## Worked Example

Illustrative only.

Draft plan E1 to E3 for slugkit; `py_api_evidence` all FOUND; `flag_evidence` empty. A second run on a Java repo had `StringUtils.stripAccents` NOT_ON_CLASSPATH with alternative `java.text.Normalizer.normalize` FOUND.

- Phase 1 (Python): table has `E3 | unicodedata.normalize | FOUND | (form, unistr, /)`, `E3 | str.encode | FOUND`, `E3 | bytes.decode | FOUND`.
- Phase 2: all FOUND, so E1, E2, E3 locked.
- Phase 3: log line `PLAN LOCKED: E1,E2,E3`, `UNVERIFIED: none`.
- Java case Phase 2: E3 `new_text` rewritten from `StringUtils.stripAccents(s)` to `Normalizer.normalize(s, Normalizer.Form.NFKD).replaceAll("\\p{M}", "")`; `String.replaceAll` checked with `javap -public java.lang.String` and FOUND; `unverified_items` gets `E3 | StringUtils.stripAccents | REPLACED | not on classpath`.

---

## Exit Criteria

DONE when `locked_plan` contains only edits whose every external name and flag is FOUND, `unverified_items` explains every change and removal, and the lock is recorded in the scratch log.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No API evidence input present but edits list external symbols | **Stop**: the stack's API check did not run; return to it. |
| Phase 2 | Item `UNCHECKED` | **Retry**: run the matching check flow for that item, then this flow again. |
| Phase 2 | Rewrite introduces a new unchecked name | **Retry**: check the new name before locking. |
| Phase 3 | Goal edit removed and nothing useful remains | **Return**: empty `locked_plan`; the stop flow reports the blocked API as the reason. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

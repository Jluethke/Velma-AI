# Catch Site Triage

**One-line description:** Assigns every swallowed, broad or lossy catch site exactly one fix action from a fixed decision table (propagate, narrow, wrap with cause, convert to a typed domain error, keep at boundary, or keep with a documented reason), ordered so that one file is changed at a time.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `catch_inventory` (object[], required): From `errh-rg-swallowed-catch-inventory`.
- `semgrep_findings` (object[], required): From `errh-semgrep-swallowed-catch-scan`.
- `error_taxonomy` (object, required): From `errh-error-taxonomy`.
- `retry_policy_table` (object[], required): From `errh-retryability-table`.

---

## Outputs

- `triage_table` (object[]): `{ site_id, file, line, observed, error_class, action, target_type, reason, order }` per site, sorted by `order`.

---

## Phase 1: Merge Sites

### Entry Criteria
- All four inputs exist.

### Actions
1. Merge `catch_inventory` and `semgrep_findings` into one list keyed by `file` and `line`; a Semgrep finding spanning lines covers inventory rows in that span.
2. For each site, open the file and read 15 lines around it. Record `observed` as one of: `empty`, `default_value`, `broad_type`, `log_and_rethrow`, `cause_dropped`, `string_match`, `panic`, `discarded_result`, `inline_retry`, `cancellation_caught`.
3. Look up `error_class` for the caught type in `error_taxonomy.type_map`. If the catch is broad, list the concrete types the `try` body can raise (read the called functions, do not guess) and record each.

### Output
Merged site list with `observed` and `error_class`.

### Quality Gate
- Every inventory row and every Semgrep finding maps to exactly one site.
- Every site has an `observed` value from the fixed list.

---

## Phase 2: Choose the Action

### Entry Criteria
- Merged list exists.

### Actions
1. Apply the first matching row, top to bottom. Do not combine actions.

| # | Condition | action |
|---|---|---|
| 1 | Inventory row has `at_boundary: true` and the catch is broad | `keep_boundary` |
| 2 | `observed` is `cancellation_caught` and the handler does not re-raise | `reraise_cancellation` |
| 3 | `observed` is `inline_retry` | `move_to_retry_policy` (use the row in `retry_policy_table`) |
| 4 | `error_class` is `bug` | `propagate` (remove the catch) |
| 5 | `observed` is `log_and_rethrow` | `wrap_no_log` (remove the log call, add context, keep the cause) |
| 6 | `observed` is `cause_dropped` or `string_match` | `wrap_with_cause` (or match by type: `errors.Is`, `isinstance`, `matches!`, `instanceof`) |
| 7 | `observed` is `empty` or `default_value` and the class is expected and the default is part of the function's documented contract | `keep_documented` (narrow the type, add a comment naming the class) |
| 8 | `observed` is `empty` or `default_value` otherwise | `propagate` |
| 9 | `observed` is `broad_type` at a non-boundary | `narrow` to the concrete types listed in Phase 1 |
| 10 | `observed` is `panic` or `discarded_result` outside tests and `main` | `return_error` |
| 11 | caller needs a stable domain meaning (for example storage `not found` crossing a service layer) | `convert_domain` with `target_type` |

2. Set `target_type` for `wrap_with_cause` and `convert_domain` to a type name from the stack idiom flow's naming rule (Python `XxxError`, Go `ErrXxx` sentinel or `XxxError` type, Rust enum variant, TypeScript `XxxError` class).
3. Set `order`: group by file; within a file, deepest call first (callee before caller), so each change compiles alone.

### Output
`triage_table` draft.

### Quality Gate
- Every site has one `action` from the table and the rule number in `reason`.
- No `keep_documented` site lacks a quoted docstring or comment showing the contract.

---

## Phase 3: Emit

### Entry Criteria
- Draft complete.

### Actions
1. Emit `triage_table` sorted by `order`.
2. Count actions per type and record the counts.
3. Do NOT edit code here. The per-stack idiom flow applies the actions one file at a time.

### Output
`triage_table`.

### Quality Gate
- Action counts sum to the number of sites.
- `git status --porcelain` shows no source changes.

---

## Worked Example

Illustrative. Three Go sites.

| site | observed | class | rule | action |
|---|---|---|---|---|
| internal/invoice/store.go:88 `fmt.Errorf("load invoice %d: %v", id, err)` | cause_dropped | dependency_transient | 6 | wrap_with_cause (`%w`) |
| internal/sync/pull.go:41 `if err != nil { return nil }` | default_value | dependency_transient | 8 | propagate |
| cmd/api/main.go:57 recover middleware | broad_type | bug | 1 | keep_boundary |

Order: store.go, pull.go, main.go untouched.

---

## Exit Criteria

DONE when every site has exactly one action with a rule number, and the order lets each file be changed and tested alone.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Cannot determine what a broad `try` can raise | **Adjust**: choose `propagate` and let the failure-path tests reveal the types. |
| Phase 2 | Two rules seem to match | **Adjust**: take the lower rule number; the table is ordered on purpose. |
| Phase 2 | Owner insists a swallowed error is fine but no contract says so | **Return**: write the contract in a comment as part of the fix, then `keep_documented`. |
| Phase 3 | More than 200 sites | **Adjust**: split `triage_table` into batches by package; the idiom flow runs per batch. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

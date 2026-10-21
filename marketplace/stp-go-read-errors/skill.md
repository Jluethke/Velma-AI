# Read Go Compiler, go vet, go test and Panic Output Correctly

**One-line description:** Reads a failing Go run by its format (`./file.go:L:C: message` compiler lines, `--- FAIL:` blocks with `file_test.go:L:` messages, `panic:` with goroutine stack traces), finds the first frame in the module's own code, maps the message to a cause class with a fixed table, and names the single next action.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `verify_result` (object, required): From `stp-run-verify-capture`, with `all_passed` false.
- `applied_edit` (object, required): From `stp-apply-one-edit`.

---

## Outputs

- `go_error_diagnosis` (object): `{ "kind": "compile"|"vet"|"test_fail"|"panic"|"lint", "message": str, "location": "file:line", "in_edited_hunk": bool, "cause_class": "EDIT_TEXT_WRONG"|"API_WRONG"|"PLAN_WRONG"|"TEST_SELECTOR_WRONG"|"ENVIRONMENT"|"EXPECTED_INTERMEDIATE", "evidence_lines": [str], "next_action": str }`.

---

## Phase 1: Parse by Output Kind

### Entry Criteria
- At least one run in `verify_result.runs` has a non-zero exit code, or L1 printed `[no tests to run]`.

### Actions
1. Open the log of the first failing run.
2. Identify the kind:

| Kind | What it looks like | Read |
|---|---|---|
| compile | `# github.com/acme/cfgload/internal/dur` then `internal/dur/parse.go:14:9: undefined: strconv.ParseHours` | first `file:line:col: message` line after the `#` package line |
| vet | `internal/dur/parse.go:20:2: fmt.Sprintf format %d has arg s of wrong type string` | the line |
| test_fail | `--- FAIL: TestParseHours (0.00s)` then indented `parse_test.go:18: got 0s, want 1h30m0s` | test name and every indented `file:line:` message under it |
| panic | `panic: runtime error: index out of range [3] with length 3` then `goroutine 7 [running]:` then pairs of lines: function name, then `\t/path/file.go:42 +0x1d` | panic message and the first frame whose path is inside the module (not `GOROOT/src/runtime`, not `testing/`) |
| build-failed test | `FAIL github.com/acme/cfgload/internal/dur [build failed]` | the compile lines above it |
| selector miss | `ok ... [no tests to run]` or `testing: warning: no tests to run` | the `-run` pattern |

3. The compiler stops after a limited number of errors per package and prints `too many errors`; read the first error only.
4. Test failure lines come from `t.Errorf`/`t.Fatalf` and use the format the test author wrote. Common conventions are `got X, want Y` (the Go Code Review Comments style) and testify's `Error: Not equal: expected: X actual: Y`. Read which side is which from the test source line, not from habit.
5. Set `location` and `in_edited_hunk` (file is `applied_edit.file` and line inside the new-line range of the `@@` header).

### Output
`kind`, `message`, `location`, `in_edited_hunk`.

### Quality Gate
- `message` is a line found by `rg -n -F` in the log.
- For `panic`, `location` is a frame inside the module path, not the runtime or testing package.

---

## Phase 2: Classify the Cause

### Entry Criteria
- Phase 1 done.

### Actions
1. Apply the first matching row:

| Signal | `cause_class` | `next_action` |
|---|---|---|
| `syntax error: unexpected ...`, `expected ';'`, `missing ','` | EDIT_TEXT_WRONG | revert; fix syntax at the column |
| `undefined: x` (local name) | EDIT_TEXT_WRONG or PLAN_WRONG | revert; add the declaration or import edit |
| `undefined: pkg.X` / `X not declared by package pkg` / `t.X undefined (type T has no field or method X)` | API_WRONG | revert; send to `stp-go-api-exists-check` |
| `declared and not used: x` / `"pkg" imported and not used` | EDIT_TEXT_WRONG | revert; Go rejects unused locals and imports; merge the import with its use |
| `cannot use x (variable of type A) as B value in argument to f` | API_WRONG if `f` is external, else PLAN_WRONG | revert; re-read the declaration |
| `assignment mismatch: 1 variable but f returns 2 values` | API_WRONG | revert; handle the second return (usually `error`) |
| `too many arguments in call` / `not enough arguments in call` (shows `have (...)` and `want (...)`) | API_WRONG | revert; use the `want` list |
| `missing return` | EDIT_TEXT_WRONG | revert; add the return on every path |
| vet finding on a line you added | EDIT_TEXT_WRONG | revert; fix the finding |
| `[no tests to run]` / `no test files` | TEST_SELECTOR_WRONG | fix `-run` anchor or package path on the card |
| `--- FAIL` with got/want predicted by `expected_signal` | EXPECTED_INTERMEDIATE | keep |
| `--- FAIL` not predicted, or `panic` in the edited hunk | PLAN_WRONG | revert; re-read the code at `location` |
| `panic: ... nil pointer dereference` at a frame you added | PLAN_WRONG | revert; a value the plan assumed non-nil can be nil |
| `WARNING: DATA RACE` (with `-race`) | PLAN_WRONG | revert; the edit introduced shared access without synchronization |
| `go: updates to go.mod needed` / `missing go.sum entry` | ENVIRONMENT | revert; a new dependency is out of scope |

2. Copy two to five proving lines into `evidence_lines`.
3. Do not silence errors: no `_ = x` just to quiet "declared and not used" for a value that should be used, no `//nolint`, no `t.Skip`.

### Output
`go_error_diagnosis`.

### Quality Gate
- `cause_class` is one table value and the row's signal text is in `evidence_lines`.
- `next_action` contains none of `nolint`, `t.Skip`, `-run` widening to `.`.

---

## Worked Example

Illustrative only.

E2 on `internal/dur/parse.go` added `h, err := strconv.Atoi(parts[0])` but never used `h`. L0 log:

```
# github.com/acme/cfgload/internal/dur
internal/dur/parse.go:14:2: declared and not used: h
exit=1
```

- Phase 1: `kind` compile, `location` `internal/dur/parse.go:14`, inside the hunk.
- Phase 2: EDIT_TEXT_WRONG; `next_action` "revert E2; merge the use of `h` (E3) into the same edit so the package compiles after one edit".

---

## Exit Criteria

DONE when the diagnosis names the output kind, the first message, a module-internal location, whether it is in the edited hunk, one table cause class with evidence, and one next action.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Panic trace shows only runtime frames | **Adjust**: re-run L1 once with `GOTRACEBACK=all` and read the user goroutines. |
| Phase 1 | Output is `(cached)` | **Retry**: the card lost `-count=1`; fix the card and re-run. |
| Phase 2 | No row matches | **Return**: `PLAN_WRONG` with the first message. |
| Phase 2 | Error in an untouched package | **Return**: `in_edited_hunk` false; baseline comparison happens next. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

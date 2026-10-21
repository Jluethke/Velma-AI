# Go golangci-lint Error Linters Gate

**One-line description:** Enables `errcheck` (with blank-assignment checking), `errorlint`, `wrapcheck`, `nilerr` and `errname` in golangci-lint, reads their findings, fixes or annotates each with a reason, and makes CI fail on unchecked, unwrapped or string-matched errors.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Module root.
- `go_failure_tests` (object, required): From `errh-go-failure-path-tests`.
- `triage_table` (object[], required): From `errh-catch-site-triage`.

---

## Outputs

- `go_lint_gate` (object): `{ golangci_version, config_file, linters, nolint_directives: [ { file, line, linter, reason } ], ci_step }`.

---

## Phase 1: Check Version and Linters

### Entry Criteria
- `golangci-lint version` prints a version.

### Actions
1. Record the major version. v2 configs start with `version: "2"`; v1 configs have no `version` key and use `linters-settings`. Run `golangci-lint migrate` only if the team agrees to move to v2 (check `golangci-lint help` for the command).
2. Confirm each linter exists in this build: `golangci-lint linters | rg "errcheck|errorlint|wrapcheck|nilerr|errname|err113"`.
3. What each finds:

| Linter | Finds |
|---|---|
| errcheck | unchecked error returns; with `check-blank: true` also `_ = f()` |
| errorlint | `==` comparison and type assertion/switch on errors; `%v` wrapping of errors in `fmt.Errorf` |
| wrapcheck | errors from external packages returned without wrapping |
| nilerr | returning `nil` after checking `err != nil`, and returning an error when `err == nil` |
| errname | sentinel not named `ErrXxx`, type not named `XxxError` |
| err113 | dynamic `errors.New` at return sites instead of sentinels (opinionated; optional) |

### Output
Version and linter availability recorded.

### Quality Gate
- Every linter in the table is listed by `golangci-lint linters` or recorded as unavailable.

---

## Phase 2: Configure and Run

### Entry Criteria
- Linters available.

### Actions
1. v2 `.golangci.yml`:
```yaml
version: "2"
linters:
  enable:
    - errcheck
    - errorlint
    - wrapcheck
    - nilerr
    - errname
  settings:
    errcheck:
      check-type-assertions: true
      check-blank: true
    errorlint:
      errorf: true
      asserts: true
      comparison: true
  exclusions:
    rules:
      - path: _test\.go
        linters: [wrapcheck]
```
   For v1, the same keys go under `linters-settings:` and `issues.exclude-rules`. Confirm key names in the golangci-lint docs for your version.
2. Run `golangci-lint run ./...`. Output lines read `file:line:col: message (linter)`.
3. Save the output and count per linter: `golangci-lint run ./... | rg -o "\((\w+)\)$" | sort | uniq -c`.

### Output
Findings per linter.

### Quality Gate
- Run output saved with per-linter counts.

---

## Phase 3: Fix, Annotate, Enforce

### Entry Criteria
- Findings saved.

### Actions
1. Fix with the Go idiom table from `errh-go-wrap-errors-is-as`, one package at a time, running `go test ./<pkg>/...` after each.
2. For `keep_boundary` and `keep_documented` triage rows only, annotate: `//nolint:wrapcheck // boundary: error returned to net/http adapter unchanged`. golangci-lint's `nolintlint` linter can require the reason; enable it with `require-explanation: true` and `require-specific: true`.
3. Do NOT add `//nolint` without a linter name and reason. Do NOT add broad path exclusions for production code.
4. CI step: `golangci-lint run ./...` (or the official GitHub Action `golangci/golangci-lint-action`, pinned to a version).
5. Prove it is live: add `_ = os.Remove("x")` in a non-test file, run, confirm an `errcheck` finding and non-zero exit, then `git checkout -- <file>`.

### Output
`go_lint_gate`.

### Quality Gate
- `golangci-lint run ./...` exits 0 on the clean tree and non-zero with the planted line.
- `rg -n "//nolint" --type go` count equals the recorded directives, each with a linter name and reason.
- The test command recorded by `errh-boundary-map` (usually `go test ./...`) passes.

---

## Worked Example

Illustrative.
```
$ golangci-lint run ./...
internal/sync/pull.go:42:3: error is not nil (line 40) but it returns nil (nilerr)
internal/invoice/store.go:88:44: non-wrapping format verb for fmt.Errorf. Use `%w` to format errors (errorlint)
cmd/api/main.go:31:12: Error return value of `srv.Shutdown` is not checked (errcheck)
```
Fixes: propagate in `pull.go`, `%w` in `store.go`, `if err := srv.Shutdown(ctx); err != nil { logger.Error(...) }` in `main.go`.

---

## Exit Criteria

DONE when the five linters pass, each `//nolint` names a linter and a reason tied to a triage row, CI runs the check, and a planted unchecked error fails it.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Config version mismatch error on run | **Adjust**: match the config format to the installed major version. |
| Phase 2 | wrapcheck floods on generated code | **Adjust**: exclude the generated path by pattern (golangci-lint skips files with the standard `// Code generated ... DO NOT EDIT.` header by default; check the docs). |
| Phase 3 | Hundreds of errcheck hits on `defer x.Close()` | **Adjust**: fix writers (close errors lose data) first; for read-only closes, record a reasoned exclusion for that function in `errcheck` settings. |
| Phase 3 | Fix breaks a test | **Retry**: revert and redo that package; never delete the test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

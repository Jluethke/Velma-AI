# Go Error Wrapping with %w and errors.Is/As

**One-line description:** Applies the triage actions to Go code one package at a time: sentinel errors and typed errors per taxonomy class, wrapping with `fmt.Errorf("...: %w", err)`, matching only with `errors.Is` and `errors.As`, `errors.Join` for multiple failures, and correct treatment of `context.Canceled` and `context.DeadlineExceeded`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Module root containing `go.mod`.
- `triage_table` (object[], required): From `errh-catch-site-triage`.
- `error_taxonomy` (object, required): From `errh-error-taxonomy`.
- `logging_policy` (object, required): From `errh-log-once-at-boundary`.
- `test_command` (string, required): Usually `go test ./...`.

---

## Outputs

- `go_error_changes` (object): `{ go_version, sentinels: [name], types: [name], sites_fixed: [site_id], test_runs: [ { package, summary_line } ] }`.

---

## Phase 1: Define Sentinels and Types

### Entry Criteria
- `go version` and the `go` directive in `go.mod` recorded. Multiple `%w` verbs in one `fmt.Errorf` and `errors.Join` need Go 1.20+.

### Actions
1. In the package that owns the domain (not a shared `errors` grab bag), declare sentinels for classes callers branch on:
```go
var (
    ErrNotFound = errors.New("not found")
    ErrConflict = errors.New("conflict")
)
```
2. Declare a struct type when callers need fields:
```go
type ValidationError struct {
    Field  string
    Reason string
}
func (e *ValidationError) Error() string { return e.Field + ": " + e.Reason }
```
3. Naming (Go Code Review Comments; `errname` linter): sentinels `ErrXxx`, types `XxxError`. Error strings are lowercase with no trailing punctuation (staticcheck ST1005).
4. A type that wraps another error implements `Unwrap() error` (or `Unwrap() []error` for several).
5. Run `go build ./... && go vet ./...`.

### Output
Sentinels and types.

### Quality Gate
- `go vet ./...` exits 0 (the `errorsas` analyzer checks `errors.As` targets are pointers).

---

## Phase 2: Apply Triage Actions per Package

### Entry Criteria
- Phase 1 builds.

### Actions
1. Take the rows for ONE package. Apply:

| action | Go idiom |
|---|---|
| `propagate` | `if err != nil { return err }` or wrap (next row); never `return nil` |
| `wrap_with_cause` | `return fmt.Errorf("load invoice %d: %w", id, err)` |
| `wrap_no_log` | delete the log call, keep the wrap |
| `convert_domain` | `if errors.Is(err, sql.ErrNoRows) { return fmt.Errorf("invoice %d: %w", id, ErrNotFound) }` |
| `narrow` / string match | replace `err == ErrX` with `errors.Is(err, ErrX)`; replace `strings.Contains(err.Error(), ...)` with `errors.Is` or `errors.As` |
| `return_error` | replace `panic`/`log.Fatal` outside `main` with a returned error |
| `keep_documented` | `if errors.Is(err, fs.ErrNotExist) { return defaults, nil } // contract: missing config file means defaults` |
| `move_to_retry_policy` | remove the loop; call through the backoff helper from `retry_policy_table` |

2. Matching rules:
   - `errors.Is(err, target)` walks the `Unwrap` chain comparing with `==` (or a custom `Is` method).
   - `errors.As(err, &target)` needs a pointer to a variable of the error type: `var ve *ValidationError; if errors.As(err, &ve) { ... }`.
   - `%v` or `%s` in `fmt.Errorf` produces text only; `errors.Is` cannot see through it. Use `%v` on purpose only at an API boundary where callers must not depend on the inner error, and record that.
   - Context: on a request path, check `errors.Is(err, context.Canceled)` (client went away, class `cancelled`) and `errors.Is(err, context.DeadlineExceeded)` (class `dependency_transient`). Use `context.Cause(ctx)` (Go 1.20+) when the code cancels with `context.WithCancelCause`.
   - Multiple failures (cleanup plus primary, parallel calls): `errors.Join(errA, errB)`; `errors.Is` matches any member.
   - Deferred close on a writer: capture its error with a named result, `defer func() { err = errors.Join(err, f.Close()) }()`.
3. Wrap message format: lowercase operation, no "failed to" prefix, no trailing colon; the chain reads `get invoice 9: load invoice 9: sql: no rows in result set`.
4. Run `go test ./<package>/...`. Next package only on pass.

### Output
Fixed packages.

### Quality Gate
- `git diff --stat` per step shows one package directory.
- `go test ./<package>/...` prints `ok`; record the line.
- `rg -n --type go "fmt\.Errorf\([^)]*%v[^)]*\berr\b" <package>` returns nothing unless recorded as an intentional opaque boundary.

---

## Phase 3: Verify the Chain

### Entry Criteria
- All packages done.

### Actions
1. Run `go vet ./...` and `test_command`.
2. Write a scratch test (deleted afterwards or kept in the failure-path flow) that wraps three times and checks `errors.Is(err, ErrNotFound)` is true and `err.Error()` contains each operation phrase.
3. Fill `go_error_changes`.

### Output
`go_error_changes`.

### Quality Gate
- `go vet ./...` and `test_command` pass; summary recorded.
- `rg -n --type go "err\.Error\(\)\s*==|strings\.Contains\(err\.Error\(\)"` returns nothing in non-test code.

---

## Worked Example

Illustrative. Row: `internal/invoice/store.go:88 cause_dropped`.

Before: `return fmt.Errorf("load invoice %d: %v", id, err)` and the handler checked `strings.Contains(err.Error(), "no rows")`.

After:
```go
if errors.Is(err, sql.ErrNoRows) {
    return Invoice{}, fmt.Errorf("load invoice %d: %w", id, ErrNotFound)
}
return Invoice{}, fmt.Errorf("load invoice %d: %w", id, err)
```
Handler: `if errors.Is(err, invoice.ErrNotFound) { ... 404 ... }`.
```
$ go test ./internal/invoice/...
ok  	example.com/billing/internal/invoice	0.214s
```

---

## Exit Criteria

DONE when every Go row is applied, no error is matched by text or `==`, every wrap uses `%w` unless recorded as opaque, and tests pass per package.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `go.mod` directive below 1.20 | **Adjust**: use one `%w` per `fmt.Errorf` and no `errors.Join`; record that upgrading is an owner decision. |
| Phase 2 | Import cycle from referencing a sentinel | **Adjust**: move the sentinel to the lower package that produces the error. |
| Phase 2 | Tests compared error strings | **Adjust**: change the assertion to `errors.Is`/`errors.As`; never delete the test. |
| Phase 2 | Third-party error type unknown | **Adjust**: read the library source for exported types and sentinels; do not invent names. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

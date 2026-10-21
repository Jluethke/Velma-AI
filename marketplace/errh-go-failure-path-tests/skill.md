# Go Failure-Path Tests

**One-line description:** Writes table-driven Go tests that inject each error class through interface fakes, assert with `errors.Is` and `errors.As` (never string comparison), check HTTP problem responses with `httptest`, count retry attempts and boundary log records with a buffer-backed `slog` handler, and proves each test live by breaking the code under test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Module root.
- `go_error_changes` (object, required): From `errh-go-wrap-errors-is-as`.
- `go_http_error_mapping` (object, required): From `errh-go-http-problem-details`.
- `retry_policy_table` (object[], required): From `errh-retryability-table`.
- `test_command` (string, required): Usually `go test ./...`.

---

## Outputs

- `go_failure_tests` (object): `{ test_files, cases, mutation_checks, race_run_summary }`.

---

## Phase 1: Create Seams

### Entry Criteria
- Code under test receives dependencies through interfaces or function fields. If it calls a concrete client directly, add a small interface in the consumer package first (one file, tests green).

### Actions
1. Write a fake per dependency that returns a configured error sequence:
```go
type fakeStore struct {
    errs  []error
    calls int
}
func (f *fakeStore) Load(ctx context.Context, id int) (Invoice, error) {
    i := f.calls
    f.calls++
    if i < len(f.errs) && f.errs[i] != nil {
        return Invoice{}, f.errs[i]
    }
    return Invoice{ID: id}, nil
}
```
2. Do not use a mocking framework the repo does not already use. Do not invent `gomock` or `testify` APIs; if the repo uses them, read their versions in `go.mod`.

### Output
Fakes.

### Quality Gate
- `go vet ./...` passes with the fakes added.

---

## Phase 2: Write Table Tests

### Entry Criteria
- Fakes compile.

### Actions
1. One table per layer:
```go
func TestGetInvoiceErrors(t *testing.T) {
    tests := []struct {
        name   string
        inject error
        wantIs error
    }{
        {"no rows maps to not found", sql.ErrNoRows, ErrNotFound},
        {"deadline stays deadline", context.DeadlineExceeded, context.DeadlineExceeded},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            svc := NewService(&fakeStore{errs: []error{tt.inject}})
            _, err := svc.Get(context.Background(), 9)
            if !errors.Is(err, tt.wantIs) {
                t.Fatalf("got %v, want errors.Is %v", err, tt.wantIs)
            }
        })
    }
}
```
2. Typed errors: `var ve *ValidationError; if !errors.As(err, &ve) || ve.Field != "qty" { t.Fatalf(...) }`.
3. Retry: inject `[]error{transient, transient, nil}` and assert `fake.calls == 3` and success; inject a permanent error and assert `fake.calls == 1`. Use the `max_attempts` value from `retry_policy_table`; if it is `OPEN`, use `t.Skip("max_attempts OPEN")` and list it, do not invent a number. Inject the backoff so the test uses zero delay.
4. Log once: build the logger under test with `slog.New(slog.NewJSONHandler(&buf, nil))`, trigger a 500 through `httptest`, then count lines with `"level":"ERROR"`: `strings.Count(buf.String(), "\"level\":\"ERROR\"") == 1`.
5. HTTP: reuse the `httptest` pattern from `errh-go-http-problem-details`, one case per problem type.
6. Run `go test -race ./...` once: error paths often run cleanup goroutines.

### Output
Test files.

### Quality Gate
- `go test ./... -run 'Errors|Problem|Retry' -v` shows only `--- PASS` lines for the new cases.
- `go test -race ./...` prints no `WARNING: DATA RACE`.

---

## Phase 3: Prove Tests Are Live

### Entry Criteria
- New tests pass.

### Actions
1. For each case, apply the smallest break, run `go test ./<pkg> -run '<TestName>/<case>'`, confirm `FAIL`, then `git checkout -- <file>`:
   - wrap case: change `%w` to `%v`.
   - mapping case: delete one `errors.Is` branch in `toProblem`.
   - retry case: set attempts to 1.
   - log case: add a second `logger.Error` call.
2. `git status --porcelain` afterwards shows only intended files.

### Output
`go_failure_tests`.

### Quality Gate
- Every case recorded with `failed_as_expected: true`.
- Final `test_command` passes; summary recorded.

---

## Worked Example

Illustrative.
```
$ go test ./internal/invoice -run 'TestGetInvoiceErrors' -v
--- PASS: TestGetInvoiceErrors/no_rows_maps_to_not_found (0.00s)
--- PASS: TestGetInvoiceErrors/deadline_stays_deadline (0.00s)
# break: store.go "%w" -> "%v"
$ go test ./internal/invoice -run 'TestGetInvoiceErrors/no_rows'
--- FAIL: TestGetInvoiceErrors/no_rows_maps_to_not_found
    service_test.go:31: got load invoice 9: not found, want errors.Is not found
FAIL
$ git checkout -- internal/invoice/store.go
```
The message text still says "not found" but `errors.Is` fails: this is why tests never compare strings.

---

## Exit Criteria

DONE when every error class has a table case asserted with `errors.Is`/`errors.As`, retries and log counts are tested, the race run is clean, and each case failed under its break.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No seam without a large refactor | **Adjust**: add a function-typed field with the real implementation as default; one file. |
| Phase 2 | Retry test sleeps for real | **Adjust**: inject the backoff or clock; never shorten production delays for tests. |
| Phase 2 | Race detector reports a race in error cleanup | **Return**: hand to a race-fix flow with the report; do not mark the run green. |
| Phase 3 | Test passes after the break | **Stop**: fix the assertion before continuing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

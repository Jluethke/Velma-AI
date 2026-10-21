# Go net/http Problem Details Mapping

**One-line description:** Replaces scattered `http.Error` calls with one error-returning handler adapter that maps Go errors to RFC 9457 `application/problem+json` responses through `errors.Is` and `errors.As`, plus a recover middleware for panics, in stdlib `net/http` (and chi, which uses the same handler type).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Module root.
- `go_error_changes` (object, required): From `errh-go-wrap-errors-is-as`, or a list of sentinels and types if run standalone.
- `problem_type_registry` (object[], required): From `errh-rfc9457-problem-type-registry`.
- `message_catalog` (object, required): From `errh-user-message-catalog`.
- `test_command` (string, required): Usually `go test ./...`.

---

## Outputs

- `go_http_error_mapping` (object): `{ adapter_file, mapping: [ { match, type, status } ], recover_middleware, http_error_calls_remaining }`.

---

## Phase 1: Inventory Current Error Writes

### Entry Criteria
- HTTP routes exist (`rg -n "HandleFunc|http\.Handler" --type go` has hits).

### Actions
1. Count direct writes: `rg -n --type go "http\.Error\(|WriteHeader\(http\.Status(BadRequest|NotFound|InternalServerError|Conflict)"`. Record the count.
2. Build the mapping in priority order (first match wins):

| Order | Match | Problem |
|---|---|---|
| 1 | `errors.Is(err, context.Canceled)` | no body; return (client is gone); log at debug |
| 2 | `errors.As(err, &ve)` with `*ValidationError` | validation, 422, `errors[]` |
| 3 | `errors.As(err, &mbe)` with `*http.MaxBytesError` (Go 1.19+) | 413 `about:blank` |
| 4 | `errors.Is(err, ErrNotFound)` | 404 `about:blank` |
| 5 | `errors.Is(err, ErrConflict)` | 409 conflict |
| 6 | `errors.Is(err, context.DeadlineExceeded)` | 504 temporarily-unavailable |
| 7 | dependency transient sentinel | 503 temporarily-unavailable plus `Retry-After` when known |
| 8 | anything else | 500 `about:blank`, generic detail |

### Output
Ordered mapping.

### Quality Gate
- Every sentinel and type in `go_error_changes` appears in the mapping or is recorded as never reaching HTTP.

---

## Phase 2: Implement Adapter and Recover

### Entry Criteria
- Mapping fixed.

### Actions
1. Create `internal/httpx/problem.go`:
```go
type Problem struct {
    Type     string        `json:"type"`
    Title    string        `json:"title"`
    Status   int           `json:"status"`
    Detail   string        `json:"detail,omitempty"`
    Instance string        `json:"instance,omitempty"`
    TraceID  string        `json:"trace_id,omitempty"`
    Errors   []FieldError  `json:"errors,omitempty"`
}

type HandlerFunc func(w http.ResponseWriter, r *http.Request) error

func (h HandlerFunc) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    err := h(w, r)
    if err == nil {
        return
    }
    p, ok := toProblem(r, err) // implements the Phase 1 table with errors.Is / errors.As
    if !ok {                    // context.Canceled: write nothing
        return
    }
    if p.Status >= 500 {
        logger.ErrorContext(r.Context(), "request failed", "err", err, "status", p.Status)
    }
    w.Header().Set("Content-Type", "application/problem+json")
    w.WriteHeader(p.Status)
    _ = json.NewEncoder(w).Encode(p) // client write failure: nothing left to report
}
```
2. Register with Go 1.22+ patterns: `mux.Handle("GET /invoices/{id}", httpx.HandlerFunc(getInvoice))`; chi accepts the same `http.Handler`.
3. Handlers return errors instead of writing them: replace `http.Error(w, ..., 404); return` with `return fmt.Errorf("get invoice %s: %w", id, invoice.ErrNotFound)`.
4. Recover middleware: `defer func() { if v := recover(); v != nil { if v == http.ErrAbortHandler { panic(v) }; log once with debug.Stack(); write the 500 problem } }()`. `net/http` already recovers panics per connection and logs them, but it writes no response body; the middleware gives clients a problem body. Re-panic `http.ErrAbortHandler` because it is the documented way to abort a response.
5. If a handler already wrote headers before returning an error, the adapter cannot change the status. Make handlers write success bodies only on the success path.
6. Run `test_command`.

### Output
Adapter, middleware, converted handlers.

### Quality Gate
- `rg -n --type go "http\.Error\(" ` count is 0 in handler packages, or each remaining call is recorded with a reason.
- `go vet ./...` and `test_command` pass.

---

## Phase 3: Probe with httptest

### Entry Criteria
- Adapter wired.

### Actions
1. Write one table test per mapping row with `httptest.NewRecorder()` and `httptest.NewRequest`:
```go
rec := httptest.NewRecorder()
srv.ServeHTTP(rec, httptest.NewRequest("GET", "/invoices/9999", nil))
if rec.Code != 404 { t.Fatalf("status %d", rec.Code) }
if ct := rec.Header().Get("Content-Type"); ct != "application/problem+json" { t.Fatalf("ct %q", ct) }
```
2. Decode the body and compare with the registry fixture after removing `trace_id` and `instance`.
3. Canceled case: wrap a stub `httpx.HandlerFunc` that returns `fmt.Errorf("stub: %w", r.Context().Err())`, send it a request built with `req.WithContext(ctx)` where `ctx, cancel := context.WithCancel(context.Background()); cancel()`, and assert no body was written (`rec.Body.Len() == 0`).

### Output
`go_http_error_mapping`.

### Quality Gate
- `go test ./internal/httpx/... -run Problem -v` shows one `--- PASS` per mapping row.
- No response body contains `goroutine ` or `.go:` (no stack leak): checked in the 500 test.

---

## Worked Example

Illustrative.
```
$ rg -c --type go "http\.Error\(" internal/api
internal/api/invoices.go:7
$ go test ./internal/httpx/... -run Problem -v
=== RUN   TestProblem/not_found
--- PASS: TestProblem/not_found (0.00s)
=== RUN   TestProblem/canceled_writes_nothing
--- PASS: TestProblem/canceled_writes_nothing (0.00s)
ok  	example.com/billing/internal/httpx	0.019s
```
After: `rg -c "http\.Error\(" internal/api` prints nothing.

---

## Exit Criteria

DONE when every handler returns errors through the adapter, every mapping row has a passing httptest case, and panics produce a 500 problem body.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Framework is gin or echo | **Adjust**: gin uses `c.Error(err)` plus a middleware reading `c.Errors`; echo uses `e.HTTPErrorHandler`. Keep the same mapping table; check the framework docs for the hook. |
| Phase 2 | `superfluous response.WriteHeader call` in logs | **Adjust**: a handler wrote before returning an error; move the write to the success path. |
| Phase 2 | Converting many handlers at once | **Stop**: convert one file, run tests, then the next. |
| Phase 3 | Canceled test writes a body | **Retry**: put the `context.Canceled` check first in `toProblem`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

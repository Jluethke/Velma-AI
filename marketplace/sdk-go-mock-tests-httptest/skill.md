# SDK Go Mock Tests With httptest

**One-line description:** Writes the Go SDK's HTTP-level test suite with `net/http/httptest` servers, table-driven cases, atomic call counters and recorded requests, run under the race detector, covering auth, the error tree, retries, idempotency and pagination.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Go module root.
- `api_inventory` (object, required): Output of `sdk-spec-inventory`.
- `error_hierarchy` (object, required): Output of `sdk-error-hierarchy`.
- `retry_policy` (object, required): Output of `sdk-retry-backoff`.

---

## Outputs

- `go_mock_tests` (object): Helper file, test files, scenario coverage table, and the `go test` result.

---

## Phase 1: Test Helpers

### Entry Criteria
- The SDK constructor accepts a base URL and an `*http.Client` or options.

### Actions
1. Create `acme/helpers_test.go`:
   ```go
   type recorded struct { Method, Path, Query string; Header http.Header; Body []byte }

   func newTestServer(t *testing.T, steps ...http.HandlerFunc) (*httptest.Server, *[]recorded, *atomic.Int32) {
       t.Helper()
       var mu sync.Mutex
       var reqs []recorded
       var n atomic.Int32
       srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
           b, _ := io.ReadAll(r.Body)
           mu.Lock(); reqs = append(reqs, recorded{r.Method, r.URL.Path, r.URL.RawQuery, r.Header.Clone(), b}); mu.Unlock()
           i := int(n.Add(1)) - 1
           if i >= len(steps) { t.Errorf("unexpected request %d: %s %s", i+1, r.Method, r.URL); w.WriteHeader(599); return }
           steps[i](w, r)
       }))
       t.Cleanup(srv.Close)
       return srv, &reqs, &n
   }
   ```
   Each step handles one request in order; an extra request fails the test. `atomic.Int32` needs Go 1.19 or later.
2. Build the SDK client in each test with `srv.URL` and a no-op backoff (retry flow's injected wait) so tests are instant.
3. Use `t.Errorf` inside handlers, never `t.Fatal`: `Fatal` must run on the test goroutine.

### Output
Helper file.

### Quality Gate
- `go vet ./acme` exits 0.

---

## Phase 2: Table-Driven Error Tests

### Entry Criteria
- Helpers exist.

### Actions
1. Write one table test over statuses:
   ```go
   cases := []struct{ status int; target error }{
       {400, ErrBadRequest}, {401, ErrAuthentication}, {403, ErrPermissionDenied},
       {404, ErrNotFound}, {409, ErrConflict}, {422, ErrUnprocessable},
       {429, ErrRateLimit}, {500, ErrInternalServer}, {418, nil},
   }
   for _, tc := range cases {
       t.Run(strconv.Itoa(tc.status), func(t *testing.T) { ... })
   }
   ```
   Assert `errors.As(err, &apiErr)` with `apiErr.StatusCode == tc.status` and, when `target != nil`, `errors.Is(err, tc.target)`. Use the sentinel names from `error_hierarchy`.
2. For 5xx statuses, configure `max_retries = 0` in this test so retries do not consume extra steps.
3. Assert `apiErr.RequestID` from an `X-Request-Id` (or the recorded header name) response header in one case.

### Output
Error tests.

### Quality Gate
- `go test ./acme -run TestErrors -count=1` prints `ok`.

---

## Phase 3: Scenario Coverage and Race Run

### Entry Criteria
- Error tests pass.

### Actions
1. One test per row:

| Scenario | Assertion |
|---|---|
| Happy path per resource | Typed struct; recorded method, path, query, body |
| Auth header | `reqs[0].Header.Get("X-API-Key")` or `Authorization` value |
| 503 then 200 | `n.Load() == 2`; success |
| 400 not retried | `n.Load() == 1` |
| POST without key not retried | `n.Load() == 1` |
| Idempotency key reused | Same `Idempotency-Key` on every recorded request |
| `Retry-After` honored | Recorded wait equals the header value |
| Pagination | Items collected via `range` and request count |
| Context cancel | Cancelled `ctx` returns `context.Canceled` and makes no further requests |
| Connection error | Close the server before the call; error unwraps to a `*url.Error` and maps to the connection error |

2. Run `go test ./... -race -count=1`. `-count=1` disables the test cache so the run is real.
3. Do NOT add `t.Skip` or loosen assertions to pass. Fix the SDK or the test step and record which.

### Output
`go_mock_tests`.

### Quality Gate
- Every row has a named test function.
- `go test ./... -race -count=1` prints `ok` for every package and no `DATA RACE` lines.

---

## Worked Example

Illustrative only.

```go
func TestRetry503Then200(t *testing.T) {
    srv, _, n := newTestServer(t,
        func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(503) },
        func(w http.ResponseWriter, r *http.Request) { w.Header().Set("Content-Type", "application/json"); io.WriteString(w, `{"id":"u_1"}`) },
    )
    c := newTestClient(t, srv.URL)
    u, err := c.Users.Get(context.Background(), "u_1")
    if err != nil || u.Id != "u_1" || n.Load() != 2 { t.Fatalf("got %v %v calls=%d", u, err, n.Load()) }
}
```
```
$ go test ./... -race -count=1
ok  	github.com/example/acme-go/acme	1.31s
```

---

## Exit Criteria

DONE when every scenario row has a test against an `httptest` server that fails on unexpected requests, and the full suite passes under `-race -count=1`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | SDK hardcodes the base URL | **Return**: add a base URL option to the constructor first. |
| Phase 3 | `DATA RACE` reported | **Stop**: fix the shared state (often the token cache or retry counters) before continuing. |
| Phase 3 | Test hangs | **Adjust**: run with `-timeout 60s -v` to find it; usually a handler blocking on `srv.Close()` or an unbounded client. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

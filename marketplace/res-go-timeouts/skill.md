# Go Client and Server Timeouts From the Timeout Plan

**One-line description:** Applies the planned timeouts in Go with context deadlines, http.Client and http.Transport fields, database/sql and pgx context calls, and gRPC deadlines, finds missing ones with golangci-lint noctx and gosec G112, and proves each fires with an httptest server that never answers.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Path to the Go module root (the directory with `go.mod`).
- `timeout_plan` (object[], required): Output of `res-timeout-budget`.

---

## Outputs

- `timeout_changes` (object[]): One row per client or server: dependency name, file:line, field or call changed with exact value, test name, and the `go test` output line.

---

## Phase 1: Find Calls Without a Deadline

### Entry Criteria
- `go test ./...` passes; save the final `ok` lines as the baseline.

### Actions
1. Run `golangci-lint run --enable noctx,bodyclose ./...`. `noctx` flags HTTP requests sent without a `context.Context`.
2. Run `gosec -include=G112 ./...`. G112 flags an `http.Server` without `ReadHeaderTimeout` (slowloris exposure).
3. Run `rg -n "http\.(Get|Post|Head|DefaultClient)|&http\.Client\{|http\.Client\{|grpc\.(Dial|DialContext|NewClient)\(|sql\.Open\(|pgxpool\.New|pgx\.Connect|redis\.NewClient\(" --type go` and open every hit.
4. Record the effective default (from the Go standard library docs for the version in `go.mod`):

| Item | Field | Default |
|---|---|---|
| `http.Client` | `Timeout` (whole exchange incl. body read) | 0 = no limit; `http.DefaultClient` and `http.Get` use it |
| `http.DefaultTransport` | `DialContext` `net.Dialer{Timeout: 30s}`, `TLSHandshakeTimeout` 10s, `IdleConnTimeout` 90s, `ExpectContinueTimeout` 1s, `ResponseHeaderTimeout` 0 | as listed |
| `http.Server` | `ReadHeaderTimeout`, `ReadTimeout`, `WriteTimeout`, `IdleTimeout` | 0 = none |
| `database/sql` | `QueryContext(ctx, ...)` | no deadline unless `ctx` has one |
| grpc-go | `ctx` deadline per call | none |
| go-redis v9 | `DialTimeout` 5s, `ReadTimeout` 3s, `WriteTimeout` = `ReadTimeout` | check the version's `Options` docs |

### Output
List of call sites and servers with effective timeouts.

### Quality Gate
- Saved `golangci-lint` and `gosec` outputs; every finding is in the list.
- Every client named in `timeout_plan` has a row.

---

## Phase 2: Apply Deadlines, One Dependency per Change

### Entry Criteria
- List exists.

### Actions
1. Change ONE dependency, run `go test ./...`, then continue.
2. Per call, derive from the inbound context so the remaining deadline propagates:
   ```go
   ctx, cancel := context.WithTimeout(r.Context(), perTry) // perTry is a time.Duration from config
   defer cancel()
   req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
   ```
   `context.WithTimeout` keeps the earlier of the parent deadline and `perTry`, which implements `min(per_try, remaining)` automatically.
3. Always `defer cancel()`. A missing cancel leaks a timer until it fires; `go vet` reports this as `lostcancel`.
4. Build one shared client per dependency, not one per request:
   ```go
   var paymentsClient = &http.Client{
       Timeout: perTry,
       Transport: &http.Transport{
           DialContext:           (&net.Dialer{Timeout: connect}).DialContext,
           TLSHandshakeTimeout:   connect,   // only if the plan gives a TLS value; else keep 10s default
           ResponseHeaderTimeout: perTry,
           MaxIdleConnsPerHost:   <from res-bulkhead-partition or leave default 2>,
       },
   }
   ```
   If the plan's connect timeout is an "open question", keep `net.Dialer{Timeout: 30 * time.Second}` (the DefaultTransport value) and record it.
5. Database: replace `db.Query(...)` with `db.QueryContext(ctx, ...)` and `Exec` with `ExecContext`. For pgx, set `connect_timeout` in the connection string (seconds) and pass `ctx` to every call. Optionally set server-side `statement_timeout` via `RuntimeParams` in `pgxpool.Config.ConnConfig`.
6. gRPC: pass the per-call `ctx`; grpc-go sends the deadline in the `grpc-timeout` header so the server sees it.
7. Server: set `ReadHeaderTimeout` on every `http.Server`. Set `WriteTimeout` no lower than `request_deadline_ms`, or handlers are cut mid-response.
8. Do NOT use `http.Get`, `http.Post` or `http.DefaultClient` for planned dependencies.

### Output
Edited code with contexts and client fields.

### Quality Gate
- `golangci-lint run --enable noctx ./...` and `gosec -include=G112 ./...` report zero findings for changed packages.
- `go vet ./...` reports no `lostcancel`.

---

## Phase 3: Prove the Deadlines Fire

### Entry Criteria
- Changes applied.

### Actions
1. Add a test per HTTP dependency using a handler that blocks:
   ```go
   func TestPaymentsTimeout(t *testing.T) {
       block := make(chan struct{})
       srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { <-block }))
       defer srv.Close()
       defer close(block)
       c := NewPaymentsClient(srv.URL) // the real constructor
       start := time.Now()
       _, err := c.Charge(context.Background(), req)
       if !errors.Is(err, context.DeadlineExceeded) && !os.IsTimeout(err) {
           t.Fatalf("want timeout, got %v", err)
       }
       if time.Since(start) > planPerTry+500*time.Millisecond { t.Fatalf("took %v", time.Since(start)) }
   }
   ```
   `close(block)` must run before `srv.Close()` (defers run in reverse order, so declare it after), otherwise `Close` waits on the blocked handler.
2. For `http.Client.Timeout` the error satisfies `os.IsTimeout(err)` (a `*url.Error` with `Timeout() == true`); for a context deadline `errors.Is(err, context.DeadlineExceeded)` is true.
3. For SQL, test against a real PostgreSQL (testcontainers-go or a CI service) with `SELECT pg_sleep(n)` and expect `context.DeadlineExceeded` or SQLSTATE `57014`.
4. Run `go test -run Timeout -race -v ./...` and save output.

### Output
`timeout_changes` with tests and output lines.

### Quality Gate
- `go test -run Timeout -race ./...` prints `ok` for every package with a new test.
- Test count did not drop: `go test -list . ./... | rg -c "^Test"` before and after.

---

## Worked Example

Illustrative. Plan: `payments` per try 750 ms, connect open question.

Phase 1: `golangci-lint run --enable noctx ./...` prints a finding like `internal/payments/client.go:31:14: net/http.Post must not be called (noctx)` for `http.Post(url, ...)` (exact wording varies by linter version). `gosec` prints `G112 (CWE-400): Potential Slowloris Attack because ReadHeaderTimeout is not configured in the http.Server` at `cmd/api/main.go:58`.

Phase 2: `client.go` now builds `&http.Client{Timeout: 750 * time.Millisecond, Transport: &http.Transport{DialContext: (&net.Dialer{Timeout: 30 * time.Second}).DialContext, ResponseHeaderTimeout: 750 * time.Millisecond}}` and calls `http.NewRequestWithContext(ctx, ...)`. `main.go` gets `ReadHeaderTimeout` from config (value from the user's server policy).

Phase 3: `go test -run Timeout -race -v ./internal/payments/` prints `--- PASS: TestPaymentsTimeout (0.75s)`.

---

## Exit Criteria

DONE when every planned Go client call carries a context deadline or client timeout from the plan, every server has `ReadHeaderTimeout`, lint gates are clean, and tests prove each deadline fires.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `golangci-lint` or `gosec` not installed | **Adjust**: install from the official release page; if not allowed, use the `rg` search alone and note reduced coverage. |
| Phase 2 | Function has no `ctx` parameter to derive from | **Adjust**: add `ctx context.Context` as the first parameter and thread it from the handler; do not use `context.Background()` inside request paths. |
| Phase 3 | Test hangs at `srv.Close()` | **Adjust**: unblock the handler first (`close(block)` deferred after `srv.Close`). |
| Phase 3 | Existing tests break | **Adjust**: check the plan; never raise a timeout to pass a test without updating the plan. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

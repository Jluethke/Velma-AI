# SDK Go Timeouts

**One-line description:** Replaces Go's timeout-free `http.DefaultClient` in an SDK with an `http.Client` whose `Timeout` and `Transport` fields (dial, TLS handshake, response header, idle) come from the user's budget, honors per-call `context` deadlines, maps timeout errors with `errors.Is` and `net.Error`, and proves them with `httptest`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Go module root.
- `timeout_budget` (object, required): User-supplied durations: overall per-request, dial, TLS handshake, response header, idle connection. This flow does not choose them.

---

## Outputs

- `go_timeout_config` (object): The constructed client and transport fields with values, how callers override them, the error classification helper, and test results.

---

## Phase 1: Find Unbounded Clients

### Entry Criteria
- `timeout_budget` has at least the overall per-request value.

### Actions
1. Find every client: `grep -rnE "http\.DefaultClient|&http\.Client\{\}|http\.Get\(|http\.Post\(" --include=*.go .`. Each hit uses a client with no `Timeout` (zero means no limit).
2. Record which hits are in generated code (oapi-codegen falls back to `&http.Client{}` when `WithHTTPClient` is not passed) and which are handwritten.
3. Know the layers:

| Setting | Covers | `http.DefaultTransport` value |
|---|---|---|
| `http.Client.Timeout` | Whole exchange: dial, redirects, headers, and reading the body | none (zero) |
| `net.Dialer.Timeout` via `Transport.DialContext` | TCP connect | 30 s |
| `Transport.TLSHandshakeTimeout` | TLS handshake | 10 s |
| `Transport.ResponseHeaderTimeout` | Wait for response headers after the request is written | none (zero) |
| `Transport.IdleConnTimeout` | Keep-alive idle connections | 90 s |
| `context.WithTimeout` per call | Everything for that call, including body read until the body is closed | caller decides |

   Confirm the DefaultTransport values in `go doc net/http.DefaultTransport` for your Go version.

### Output
List of unbounded clients.

### Quality Gate
- The grep was run and every hit is listed as generated or handwritten.

---

## Phase 2: Build the Default Client

### Entry Criteria
- Hits listed.

### Actions
1. Create `acme/httpclient.go`:
   ```go
   func newHTTPClient(b TimeoutBudget) *http.Client {
       t := http.DefaultTransport.(*http.Transport).Clone()
       t.DialContext = (&net.Dialer{Timeout: b.Dial, KeepAlive: 30 * time.Second}).DialContext
       t.TLSHandshakeTimeout = b.TLSHandshake
       t.ResponseHeaderTimeout = b.ResponseHeader
       t.IdleConnTimeout = b.IdleConn
       return &http.Client{Timeout: b.Overall, Transport: t}
   }
   ```
   `Clone()` keeps proxy-from-environment and HTTP/2 settings from `DefaultTransport`. The `KeepAlive: 30 * time.Second` value matches `DefaultTransport`'s dialer; keep it unless the budget says otherwise.
2. Pass this client to the generated code with `WithHTTPClient(newHTTPClient(budget))` in the SDK constructor. Let callers supply their own `*http.Client` through an option; if they do, use theirs unchanged.
3. Per-call deadline: every SDK method takes `ctx context.Context` and builds requests with `http.NewRequestWithContext`. Callers use `ctx, cancel := context.WithTimeout(ctx, d); defer cancel()`.
4. Classification helper:
   ```go
   func isTimeout(err error) bool {
       if errors.Is(err, context.DeadlineExceeded) { return true }
       var ne net.Error
       return errors.As(err, &ne) && ne.Timeout()
   }
   ```
   `Client.Timeout` errors satisfy `net.Error` with `Timeout() == true` and their message contains `Client.Timeout exceeded`. Do NOT match on the message string.
5. Always `defer resp.Body.Close()` and read the body fully or discard it (`io.Copy(io.Discard, resp.Body)`) so connections are reused.

### Output
Bounded default client.

### Quality Gate
- `go vet ./...` exits 0.
- Rerunning the Phase 1 grep on handwritten files prints nothing.

---

## Phase 3: Test

### Entry Criteria
- Client in place.

### Actions
1. Overall timeout test: `httptest.NewServer` handler sleeps 500 ms; client `Overall` 100 ms; assert `isTimeout(err)` and wrapped `APITimeoutError` via `errors.As`.
2. Header timeout test: handler sleeps before `WriteHeader`; `ResponseHeader` 100 ms with `Overall` large; assert timeout.
3. Context test: server fast-but-slower-than-deadline; call with `context.WithTimeout(ctx, 50*time.Millisecond)`; assert `errors.Is(err, context.DeadlineExceeded)`.
4. Close handlers that block: use `select { case <-r.Context().Done(): case <-time.After(d): }` in the handler so `srv.Close()` does not wait on sleeping handlers.
5. Run `go test ./acme -run Timeout -race -count=1`.

### Output
`go_timeout_config`.

### Quality Gate
- `go test ./acme -run Timeout -race -count=1` prints `ok`.
- Mutation check: set `Overall` to 0 in the test client; Test 1 must fail; restore.

---

## Worked Example

Illustrative only. `timeout_budget = { overall: 60s, dial: 5s, tls_handshake: 10s, response_header: 30s, idle_conn: 90s }`.

```
$ grep -rnE "http\.DefaultClient|&http\.Client\{\}" --include=*.go .
./acme/acme.gen.go:412:		client.Client = &http.Client{}
$ go test ./acme -run Timeout -race -count=1 -v
=== RUN   TestOverallTimeout
--- PASS: TestOverallTimeout (0.10s)
=== RUN   TestResponseHeaderTimeout
--- PASS: TestResponseHeaderTimeout (0.10s)
=== RUN   TestContextDeadline
--- PASS: TestContextDeadline (0.05s)
ok  	github.com/example/acme-go/acme	0.41s
```
The generated fallback stays, but the constructor always passes `WithHTTPClient`, so it is never reached.

---

## Exit Criteria

DONE when the SDK never uses an unbounded client, all transport timeouts come from the budget, per-call contexts are honored, and tests prove overall, header and context timeouts.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Budget missing a field | **Stop**: ask the user; leaving `ResponseHeaderTimeout` at zero is a decision, not a default to assume. |
| Phase 2 | `DefaultTransport` was replaced by another package | **Adjust**: build a fresh `http.Transport` with the same fields instead of `Clone()`. |
| Phase 3 | `srv.Close()` hangs | **Adjust**: make the handler watch `r.Context().Done()` as in Action 4. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

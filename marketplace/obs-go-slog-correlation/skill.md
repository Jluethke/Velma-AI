# Go log/slog JSON Logging With Correlation IDs

**One-line description:** Wraps the standard library `slog.JSONHandler` in a context-aware handler that adds `request_id` from the request context and `trace_id`/`span_id` from the OpenTelemetry span context, installs a request ID middleware, and proves it with a Go test that decodes the JSON output.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Absolute path to the Go module root (the directory with `go.mod`).
- `service_name` (string, required): Value for the `service` attribute.
- `log_level_policy` (object, required): Output of `obs-log-level-policy`.

---

## Outputs

- `logging_change` (object): Files changed, the diff, `go test` output for the handler test, and one captured JSON log line with `request_id` and `trace_id`.

---

## Phase 1: Write The Context Handler

### Entry Criteria
- `go.mod` declares `go 1.21` or later (`log/slog` entered the standard library in Go 1.21). Check: `rg -n "^go " go.mod`.
- `go test ./...` passes before changes; save the summary.

### Actions
1. Add the OTel trace API module: `go get go.opentelemetry.io/otel/trace`.
2. Create ONE new file `internal/logx/logx.go`:
```go
package logx

import (
    "context"
    "io"
    "log/slog"
    "os"
    "strings"

    "go.opentelemetry.io/otel/trace"
)

type ctxKey struct{}

func WithRequestID(ctx context.Context, id string) context.Context {
    return context.WithValue(ctx, ctxKey{}, id)
}
func RequestID(ctx context.Context) string {
    id, _ := ctx.Value(ctxKey{}).(string)
    return id
}

type ctxHandler struct{ slog.Handler }

func (h ctxHandler) Handle(ctx context.Context, r slog.Record) error {
    if id := RequestID(ctx); id != "" {
        r.AddAttrs(slog.String("request_id", id))
    }
    if sc := trace.SpanContextFromContext(ctx); sc.IsValid() {
        r.AddAttrs(slog.String("trace_id", sc.TraceID().String()),
            slog.String("span_id", sc.SpanID().String()))
    }
    return h.Handler.Handle(ctx, r)
}
func (h ctxHandler) WithAttrs(a []slog.Attr) slog.Handler { return ctxHandler{h.Handler.WithAttrs(a)} }
func (h ctxHandler) WithGroup(n string) slog.Handler      { return ctxHandler{h.Handler.WithGroup(n)} }

func New(w io.Writer, service string) *slog.Logger {
    var lvl slog.Level
    if err := lvl.UnmarshalText([]byte(strings.ToUpper(os.Getenv("LOG_LEVEL")))); err != nil {
        lvl = slog.LevelInfo
    }
    h := slog.NewJSONHandler(w, &slog.HandlerOptions{
        Level: lvl,
        ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
            switch strings.ToLower(a.Key) {
            case "password", "token", "secret", "authorization", "cookie", "api_key":
                return slog.String(a.Key, "[REDACTED]")
            }
            return a
        },
    })
    return slog.New(ctxHandler{h}).With("service", service)
}
```
3. `WithAttrs` and `WithGroup` must return a wrapped `ctxHandler`. If they return the inner handler, any logger created with `.With(...)` silently loses the IDs. This is the most common mistake with slog handler wrappers.
4. Extend the redaction `case` with `log_level_policy.redact_keys`.

### Output
`internal/logx/logx.go`.

### Quality Gate
- `go vet ./internal/logx/` prints nothing.
- `go build ./...` exits 0.

---

## Phase 2: Middleware And Call Sites

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Add the middleware in the file that builds the router:
```go
func requestID(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        id := r.Header.Get("X-Request-ID")
        if id == "" {
            id = uuid.NewString() // github.com/google/uuid, or crypto/rand hex if the repo avoids deps
        }
        w.Header().Set("X-Request-ID", id)
        next.ServeHTTP(w, r.WithContext(logx.WithRequestID(r.Context(), id)))
    })
}
```
2. Order with OTel: wrap as `otelhttp.NewHandler(requestID(mux), "server")` so the span exists in the context the handlers see.
3. Set the default: `slog.SetDefault(logx.New(os.Stdout, "checkout-api"))` in `main`.
4. Convert call sites one file at a time to the `Context` variants: `slog.InfoContext(r.Context(), "order created", "order_id", id)`. A plain `slog.Info(...)` has no context, so the handler cannot add IDs. Find offenders: `rg -n "slog\.(Debug|Info|Warn|Error)\(" --type go`.
5. Run `go test ./...` after each file. Do not delete or skip a failing test.

### Output
Middleware and converted call sites.

### Quality Gate
- `rg -c "slog\.(Debug|Info|Warn|Error)\(" --type go` inside request paths is zero, or each remaining hit is in `main` startup code and listed.
- `go test ./...` passes with the same count.

---

## Phase 3: Prove It With A Test

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Add `internal/logx/logx_test.go`:
```go
func TestRequestIDAndTrace(t *testing.T) {
    var buf bytes.Buffer
    log := New(&buf, "svc")
    tid, _ := trace.TraceIDFromHex("4bf92f3577b34da6a3ce929d0e0e4736")
    sid, _ := trace.SpanIDFromHex("00f067aa0ba902b7")
    ctx := trace.ContextWithSpanContext(context.Background(),
        trace.NewSpanContext(trace.SpanContextConfig{TraceID: tid, SpanID: sid, TraceFlags: trace.FlagsSampled}))
    ctx = WithRequestID(ctx, "verify-123")
    log.With("k", "v").InfoContext(ctx, "probe")
    var m map[string]any
    if err := json.Unmarshal(buf.Bytes(), &m); err != nil { t.Fatal(err) }
    if m["request_id"] != "verify-123" || m["trace_id"] != tid.String() || m["service"] != "svc" {
        t.Fatalf("missing fields: %v", m)
    }
}
```
2. The `log.With("k","v")` call in the test is deliberate: it proves `WithAttrs` keeps the wrapper.
3. Run: `go test ./internal/logx/ -run TestRequestIDAndTrace -v`.
4. Mutation check: temporarily change `WithAttrs` to `return h.Handler.WithAttrs(a)`, rerun, confirm the test FAILS, then restore. A test that cannot fail proves nothing.
5. Run the service and `curl -H "X-Request-ID: verify-123" localhost:8080/orders`; capture the line.

### Output
`logging_change`.

### Quality Gate
- `go test -v` prints `--- PASS: TestRequestIDAndTrace`.
- The mutation run printed `--- FAIL`, and the restored run prints `PASS`.
- The live log line parses with `jq .` and has `request_id` = `verify-123`.

---

## Worked Example

Illustrative only.

```
$ go test ./internal/logx/ -run TestRequestIDAndTrace -v
=== RUN   TestRequestIDAndTrace
--- PASS: TestRequestIDAndTrace (0.00s)
ok   example.com/checkout/internal/logx  0.004s
$ curl -s -H "X-Request-ID: verify-123" localhost:8080/orders >/dev/null
$ ./checkout 2>&1 | rg verify-123 | head -1 | jq .
{
  "time": "2026-10-20T14:07:44.912Z",
  "level": "INFO",
  "msg": "orders listed",
  "service": "checkout-api",
  "count": 3,
  "request_id": "verify-123",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "span_id": "00f067aa0ba902b7"
}
```
Note slog writes `level` as uppercase and `msg` as the message key by default; downstream queries use these exact keys.

---

## Exit Criteria

DONE when the handler test passes and fails under the mutation, request-path call sites use `*Context` variants, and a live line carries the echoed `request_id`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `go.mod` declares a version below 1.21 | **Stop**: report; upgrading Go is a separate change. |
| Phase 2 | `trace_id` missing on live lines | **Adjust**: `requestID` wraps outside `otelhttp`, or the call site uses a non-Context method; fix the order or the call. |
| Phase 3 | Mutation does not make the test fail | **Adjust**: the test does not call `.With(...)`; add it and rerun. |
| Phase 3 | Duplicate `request_id` keys in output | **Adjust**: the ID is added both by `.With` and the handler; remove the `.With` one. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

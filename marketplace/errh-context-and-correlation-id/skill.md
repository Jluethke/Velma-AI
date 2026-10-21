# Error Context and Correlation ID

**One-line description:** Makes every error that reaches a boundary carry two kinds of context: the operation chain added while it propagated (what was being done, with which safe identifiers) and the request-scoped correlation id taken from W3C `traceparent` or a request id header, using each stack's real propagation mechanism.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `stack` (string, required): `python`, `go`, `rust` or `typescript`.
- `boundary_map` (object, required): From `errh-boundary-map`.

---

## Outputs

- `context_plan` (object): `{ id_source, propagation_mechanism, context_rules, files_changed, verification_output }`.

---

## Phase 1: Choose the Correlation ID Source

### Entry Criteria
- `boundary_map` lists HTTP or consumer boundaries.

### Actions
1. Check for OpenTelemetry first: `rg -n "opentelemetry|otel" <manifest files>`.

| Found | `id_source` |
|---|---|
| OpenTelemetry SDK configured | trace id from the active span (W3C Trace Context, `traceparent: 00-<32 hex trace-id>-<16 hex parent-id>-<2 hex flags>`) |
| No OTel, proxy sets `X-Request-ID` | that header; generate a UUIDv4 when absent |
| Neither | generate a UUIDv4 per request at the boundary and return it in a response header |

2. For queue consumers, read the id from message headers or attributes set by the producer; if absent, generate one and log that it was generated.
3. Never trust an inbound id as a secret or for authorization; it is a lookup key only. Truncate inbound values to the format length (32 hex for trace-id) and reject other characters.

### Output
`id_source` chosen.

### Quality Gate
- The choice cites the manifest line or proxy config line that justifies it.

---

## Phase 2: Propagate Request Context

### Entry Criteria
- `id_source` chosen.

### Actions
1. Implement with the mechanism for `stack`. Change one file, run tests, then the next.

| stack | Mechanism | How the id reaches logs |
|---|---|---|
| python | `contextvars.ContextVar("request_id")` set in middleware; works across `await` | `logging.Filter` subclass that sets `record.request_id`, or `structlog.contextvars.bind_contextvars(request_id=...)` with `structlog.contextvars.merge_contextvars` in the processor chain |
| go | `context.Context` as the first parameter of every call on the request path; store with an unexported key type | a `slog.Handler` wrapper whose `Handle(ctx, r)` reads the id from `ctx` and calls `r.AddAttrs`; always call `logger.ErrorContext(ctx, ...)` |
| rust | `tracing` span created per request (`tower_http::trace::TraceLayer` or `#[tracing::instrument]` on the handler) with a `request_id` field | every event inside the span inherits its fields through `tracing-subscriber` |
| typescript | `AsyncLocalStorage` from `node:async_hooks`, `als.run(store, next)` in the first middleware | `pino` child logger stored in the ALS store (`logger.child({ request_id })`), or pino `mixin` reading the store |

2. For thread or task roots found in `boundary_map`, propagate explicitly: python `contextvars.copy_context().run(fn)` for threads (`asyncio.create_task` copies context automatically); go pass `ctx` into the goroutine; rust `.instrument(span)` on spawned futures (`tracing::Instrument`); node ALS follows async continuations but not callbacks from native pools that lose context; test it.
3. Return the id in a response header (`traceparent` is propagated by OTel; otherwise `X-Request-ID`) and in the problem body `trace_id` member.

### Output
Request context propagated.

### Quality Gate
- A test or manual request shows the same id in the response header and in the log line for that request: `curl -si <url> | rg -i "x-request-id|traceparent"` and then `rg <id> <log file>` returns the log line.

---

## Phase 3: Add Operation Context to Errors

### Entry Criteria
- Request context done.

### Actions
1. At each layer an error crosses, add exactly one short phrase: the operation and its safe key. Format: `"<verb> <noun> <id>"` (for example `load invoice 42`).

| stack | Add context with |
|---|---|
| python | `raise InvoiceLoadError(f"load invoice {invoice_id}") from exc`, or `exc.add_note(...)` (Python 3.11+) when the type must stay the same |
| go | `fmt.Errorf("load invoice %d: %w", id, err)` |
| rust | `.with_context(\|\| format!("load invoice {id}"))` (anyhow), or a thiserror variant field |
| typescript | `throw new InvoiceLoadError(\`load invoice ${id}\`, { cause: err })` (ES2022 `cause`) |

2. Never add: passwords, tokens, API keys, session ids, full request or response bodies, card numbers, or personal data (OWASP Logging Cheat Sheet, "Data to exclude").
3. Do not repeat the callee's text: the callee's message is already in the chain.

### Output
`context_plan` with files changed and verification output.

### Quality Gate
- The full test command passes.
- `rg -n -i "password|token|secret|authorization" ` over the diff (`git diff \| rg ...`) shows no new context string containing those values.

---

## Worked Example

Illustrative. `stack=go`, no OTel, nginx sets `X-Request-ID`.

Phase 2: middleware `internal/httpx/reqid.go` reads `r.Header.Get("X-Request-ID")`, validates it against `^[A-Za-z0-9-]{1,64}$`, stores it with `context.WithValue(ctx, reqIDKey{}, id)`. A `ctxHandler` wraps `slog.NewJSONHandler`.
```
$ curl -si localhost:8080/invoices/9999 | rg -i x-request-id
X-Request-ID: 7f1c0f4e-6b9a-4c56-9a0e-2c1d9f3f2b11
$ rg 7f1c0f4e app.log
{"level":"ERROR","msg":"request failed","request_id":"7f1c0f4e-...","err":"get invoice 9999: load invoice 9999: sql: no rows in result set"}
```
The `err` value shows the operation chain added at each layer.

---

## Exit Criteria

DONE when one id ties the response to its log line, task roots propagate it, and errors carry one operation phrase per layer with no secrets.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Two id headers in use | **Adjust**: pick the one the proxy sets; map the other into it at the edge. |
| Phase 2 | Go functions on the request path lack a `ctx` parameter | **Adjust**: add `ctx context.Context` as first parameter one function at a time, callee first; never store ctx in a struct. |
| Phase 2 | Id missing in logs from a thread pool | **Retry**: wrap the submitted callable with `contextvars.copy_context().run`. |
| Phase 3 | Context string would include personal data | **Stop**: use an internal surrogate id instead. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

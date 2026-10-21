# Safe Logging of Rejected Input

**One-line description:** Logs every validation rejection as a structured event (field path, rule, entry point, length, SHA-256 digest of the value, request ID) instead of the raw value, so logs cannot be forged with CR/LF (CWE-117), cannot leak passwords or tokens, and cannot carry stored XSS into log viewers, using structlog, pino or Go `log/slog` with redaction, and adds a rejection counter metric.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `stack` (string, required): `python`, `node` or `go`.

---

## Outputs

- `logging_changes` (object): `logger_setup` (file), `reject_helper` (file), `redacted_fields` (list), `metric_name`, `test_file`, `test_run`.

---

## Phase 1: Find Where Rejected Input Is Logged or Echoed

### Entry Criteria
- Validation exists at entry points (schema flows ran).

### Actions
1. Find log calls near validation errors:

```
# python
rg -n "(log|logger|logging)\.(info|warning|error|exception|debug)\(.*(request\.|e\.errors|ValidationError|str\(e\))" --type py
# node
rg -n "(console|logger|log)\.(log|info|warn|error|debug)\(.*(req\.(body|query|params|headers)|error\.issues|err\.message)" --type js --type ts
# go
rg -n "(log|slog|logger)\.(Print|Printf|Info|Warn|Error)\w*\(.*(r\.(Form|URL|Header|Body)|err)" --type go
```
2. Find error responses that echo input: Pydantic `e.errors()` without `include_input=False`, `e.json()`; Zod issues with `received` values; Go `fe.Value()`; `jsonschema` `e.message`.
3. Classify each hit:

| Hit logs or returns | Problem |
|---|---|
| the raw field value | CRLF forging, secrets, size |
| the whole body or headers | secrets (`Authorization`, `Cookie`, passwords) |
| `f"...{value}..."` into a plain-text log line | CWE-117 log injection |
| the value in an HTTP error response | reflection; possible XSS where errors are rendered |

### Output
Hit list with problem per hit.

### Quality Gate
- Each search has a recorded hit count; each hit has a problem class or "safe" with reason.

---

## Phase 2: Structured Logger, Redaction and Reject Helper

### Entry Criteria
- Hit list exists.

### Actions
1. Use a JSON logger so newlines inside values are escaped as `\n` by the encoder and cannot start a fake line:

| `stack` | Setup |
|---|---|
| python | `structlog.configure(processors=[structlog.processors.add_log_level, structlog.processors.TimeStamper(fmt="iso"), structlog.processors.JSONRenderer()])` |
| node | `pino({ redact: { paths: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.token"], censor: "[REDACTED]" } })` |
| go | `slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{ReplaceAttr: redact}))` where `redact` replaces keys in the redacted list |

2. Redacted fields list: start from fields the inventory shows carry secrets (`password`, `token`, `authorization`, `cookie`, `secret`, `api_key`, card numbers) and record it in `redacted_fields`.
3. Reject helper, one per stack, called from every validation failure path:

```python
import hashlib, structlog
log = structlog.get_logger()

def log_rejection(entry_point: str, field: str, rule: str, value, request_id: str):
    raw = value if isinstance(value, (bytes, str)) else repr(value)
    b = raw.encode("utf-8", "surrogatepass") if isinstance(raw, str) else raw
    log.warning("input_rejected", entry_point=entry_point, field=field, rule=rule,
                length=len(b), sha256=hashlib.sha256(b).hexdigest(),
                request_id=request_id)
    REJECTIONS.labels(entry_point=entry_point, rule=rule).inc()
```
   - The SHA-256 digest lets you correlate repeated payloads without storing them. Do not log the value itself, a truncated value, or a "sanitized" value for fields in `redacted_fields`.
   - If the security team requires the raw payload for investigation, write it to a separate access-controlled store, not the application log; record that as a decision.
   - Field names come from the schema, not from user keys: for unknown-key rejections, log the count of unknown keys, not their names (names are attacker text).
4. Metric: Prometheus counter `input_rejections_total{entry_point, rule}` (python `prometheus_client.Counter`, node `prom-client`, go `prometheus/client_golang`). Keep labels to schema-defined values only; a label from user text creates unbounded series.
5. HTTP error responses: return field path and rule code only (Pydantic `include_input=False`, Zod `{path, code}`, Go `fe.Namespace()` and `fe.Tag()`).
6. Replace each Phase 1 hit with the helper; one module per commit.

### Output
Logger setup, helper, metric, cleaned responses.

### Quality Gate
- Rerun Phase 1 searches; every remaining hit is the helper itself or classified safe.
- `rg -n "include_input=False" --type py` count equals the number of `e.errors(` calls in response paths (Python).

---

## Phase 3: Log Safety Tests

### Entry Criteria
- Helper wired.

### Actions
1. Capture logs in tests (pytest `caplog` with structlog's `structlog.testing.capture_logs()`, pino with a destination stream to an array, slog with a handler writing to a `bytes.Buffer`).
2. Cases:

| Input | Assertion |
|---|---|
| `"abc\r\n{\"level\":\"info\",\"msg\":\"login ok\"}"` in a rejected field | captured output has exactly one record for the request; the fake JSON is not a separate record |
| rejected request with `password: "hunter2-IVAL"` | the string `hunter2-IVAL` appears nowhere in captured logs or the response body |
| `"<script>alert(1)</script>"` in a rejected field | not present in logs or response |
| any rejection | `input_rejections_total` for that entry point and rule increased by 1 |

3. Run, record summary. Mutation check: log the raw value in the helper, rerun, confirm failure, revert.

### Output
`logging_changes`.

### Quality Gate
- Test summary shows 0 failed.
- Mutation run fails; reverted run passes.

---

## Worked Example

Illustrative. `stack` = `go`. `internal/api/orders.go:61` had `log.Printf("bad order: %v body=%s", err, body)`.

Phase 2: replaced with `rejects.Log(ctx, "EP-001", fe.Namespace(), fe.Tag(), fe.Value())`, which emits:
```
{"time":"2026-10-20T14:02:11Z","level":"WARN","msg":"input_rejected","entry_point":"EP-001","field":"CreateOrder.Currency","rule":"oneof","length":3,"sha256":"9f2c1a0b7e44d3a1...","request_id":"r-8c1"}
```
Phase 3: `ok example.com/shop/internal/rejects 0.006s`.

---

## Exit Criteria

DONE when every validation rejection logs a structured event without the raw value, secrets are redacted, error responses carry only path and rule, a bounded-label rejection counter exists, and log safety tests pass and fail under mutation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Logs are shipped as plain text lines to a SIEM that cannot parse JSON | **Adjust**: keep plain text but escape CR, LF and other control characters in every interpolated value (replace with `\r`, `\n` literal escapes) inside the helper. |
| Phase 2 | Security team requires the full rejected payload | **Return**: propose the separate restricted store; do not put it in the shared log. |
| Phase 3 | Secret still appears in logs from framework access logging | **Adjust**: configure the access logger (gunicorn `--access-logformat`, `pino-http` serializers, reverse proxy log format) to drop bodies and sensitive headers. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

# Python structlog JSON Logging With Correlation IDs

**One-line description:** Configures structlog in a Python web service to emit one JSON object per line with `request_id` bound through `contextvars` per request and `trace_id`/`span_id` read from the active OpenTelemetry span, then proves it with a curl request and a JSON parse of the output.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Absolute path to the Python service repository.
- `service_name` (string, required): Value for the `service` field.
- `log_level_policy` (object, required): Output of `obs-log-level-policy` (required fields, redaction keys, level env var).

---

## Outputs

- `logging_change` (object): Files changed, the diff, the verification command, and one captured JSON log line that contains `request_id` and `trace_id`.

---

## Phase 1: Install And Configure structlog

### Entry Criteria
- Python 3.8 or later (structlog `contextvars` support needs Python 3.7+; current structlog releases state their own minimum, check `pip show structlog` after install).
- The repo's test suite passes before any change: run it and save the summary line.

### Actions
1. Add the dependency with the repo's tool. Pick one row:

| Repo uses | Command |
|---|---|
| `uv` (`uv.lock` present) | `uv add structlog` |
| Poetry (`poetry.lock` present) | `poetry add structlog` |
| pip + `requirements.txt` | add `structlog` to `requirements.txt`, then `pip install -r requirements.txt` |

2. Create ONE new file `app/logging_setup.py` (adjust the package path to the repo) with:
```python
import logging, os, sys
import structlog
from opentelemetry import trace

REDACT = {"authorization", "cookie", "set-cookie", "password", "passwd", "secret",
          "token", "api_key", "access_token", "refresh_token", "ssn", "card_number"}

def add_otel_ids(logger, method_name, event_dict):
    ctx = trace.get_current_span().get_span_context()
    if ctx.is_valid:
        event_dict["trace_id"] = format(ctx.trace_id, "032x")
        event_dict["span_id"] = format(ctx.span_id, "016x")
    return event_dict

def redact(logger, method_name, event_dict):
    for k in list(event_dict):
        if k.lower() in REDACT:
            event_dict[k] = "[REDACTED]"
    return event_dict

def configure_logging(service_name: str) -> None:
    level = getattr(logging, os.environ.get("LOG_LEVEL", "INFO").upper(), logging.INFO)
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            add_otel_ids,
            redact,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(level),
        logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
        cache_logger_on_first_use=True,
    )
    structlog.contextvars.bind_contextvars(service=service_name)
```
3. Replace the `REDACT` set with `log_level_policy.redact_keys` if the policy lists more keys.
4. If `opentelemetry-api` is not installed yet, `add_otel_ids` still imports fine once `opentelemetry-api` is added; add it now (`opentelemetry-api`) or run `obs-py-otel-sdk-setup` first. Without an SDK, `get_current_span()` returns an invalid span and the processor adds nothing, which is the correct behavior.

### Output
`logging_setup.py` and the dependency change.

### Quality Gate
- `python -c "import structlog; print(structlog.__version__)"` prints a version.
- `python -c "from app.logging_setup import configure_logging; configure_logging('x'); import structlog; structlog.get_logger().info('probe')"` prints one line that `python -m json.tool` accepts.

---

## Phase 2: Bind request_id Per Request

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Edit only the file that creates the app object (from `signal_plan` entrypoints). Add the middleware for your framework:

| Framework | Code |
|---|---|
| FastAPI / Starlette | see block A |
| Flask | see block B |
| Django | add a middleware class with the same body as block A to `MIDDLEWARE`, first position |

Block A:
```python
import uuid, structlog
from app.logging_setup import configure_logging
configure_logging("checkout-api")

@app.middleware("http")
async def request_id_mw(request, call_next):
    rid = request.headers.get("x-request-id") or str(uuid.uuid4())
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(service="checkout-api", request_id=rid)
    response = await call_next(request)
    response.headers["X-Request-ID"] = rid
    return response
```
Block B:
```python
@app.before_request
def bind_rid():
    rid = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(service="checkout-api", request_id=rid)
    g.request_id = rid

@app.after_request
def echo_rid(resp):
    resp.headers["X-Request-ID"] = g.request_id
    return resp
```
2. Call `clear_contextvars()` at the start of every request. Without it, a reused worker thread or task can carry the previous request's ID into the next request.
3. Do not call `configure_logging` more than once per process.
4. Background work: code started with `asyncio.create_task` copies the context at creation, so IDs flow. Code sent to a `ThreadPoolExecutor` does not; wrap it with `contextvars.copy_context().run(fn, *args)`.

### Output
Middleware in place.

### Quality Gate
- `rg -n "clear_contextvars" "$SERVICE_REPO"` shows exactly one hit inside the request hook.
- The repo's test suite passes with the same pass count as before.

---

## Phase 3: Convert Call Sites And Verify

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Convert log calls one file at a time, starting with files in `log_level_policy.audit_findings`. Pattern: `logger = structlog.get_logger()` and `logger.info("order_created", order_id=oid)`. Pass values as keyword arguments, not f-strings, so they stay queryable fields.
2. Run the tests after each file. Never delete or skip a failing test to get green; fix the logging change instead.
3. Third-party libraries that log through stdlib `logging` (uvicorn, SQLAlchemy) will not go through these processors. If their lines must be JSON too, follow the structlog docs section "Rendering using structlog-based formatters within logging" (`structlog.stdlib.ProcessorFormatter`). Do not hand-write a JSON formatter.
4. Start the service and send a request with a known ID:
   `curl -s -o /dev/null -D - -H "X-Request-ID: verify-123" http://localhost:8000/orders`
5. Capture the matching log line and parse it:
   `<service stdout> | rg '"request_id": "verify-123"' | head -1 | python -m json.tool`

### Output
`logging_change`.

### Quality Gate
- The curl response headers include `x-request-id: verify-123`.
- The parsed log line has `request_id` = `verify-123`, a `timestamp` ending in `Z`, and `level`.
- If the OTel SDK is running, the line has a 32-hex `trace_id`; check with `rg -o '"trace_id": "[0-9a-f]{32}"'`.

---

## Worked Example

Illustrative only.

Input: FastAPI service `checkout-api`, uvicorn on port 8000, OTel SDK already running.

```
$ curl -s -o /dev/null -D - -H "X-Request-ID: verify-123" http://localhost:8000/orders
HTTP/1.1 200 OK
x-request-id: verify-123
$ uvicorn app.main:app 2>&1 | rg '"request_id": "verify-123"' | head -1 | python -m json.tool
{
    "service": "checkout-api",
    "request_id": "verify-123",
    "event": "orders_listed",
    "count": 3,
    "level": "info",
    "timestamp": "2026-10-20T14:02:11.402913Z",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "span_id": "00f067aa0ba902b7"
}
```

`logging_change.files`: `pyproject.toml`, `app/logging_setup.py`, `app/main.py`, `app/routes/orders.py`.

---

## Exit Criteria

DONE when a real request produces a parseable JSON line with the echoed `request_id`, OTel IDs appear when a span is active, and the test suite pass count is unchanged.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ImportError: opentelemetry` | **Adjust**: add `opentelemetry-api` to dependencies; rerun the gate. |
| Phase 2 | Same `request_id` appears on two different requests | **Adjust**: `clear_contextvars()` is missing or runs after binding; move it first. |
| Phase 3 | Output is not JSON (plain text lines) | **Adjust**: the line came from stdlib logging, not structlog; apply step 3 or change the call site to structlog. |
| Phase 3 | `trace_id` missing while SDK runs | **Adjust**: the log call runs outside the request span (startup or a thread); copy context or accept the omission for startup lines. |
| Phase 3 | Tests fail after a call-site change | **Retry**: revert that one file, redo the change, rerun tests. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

# Python HTTP Problem Details Mapping

**One-line description:** Registers framework exception handlers in FastAPI (or Flask, or Django REST Framework) that turn the application exception hierarchy, validation errors and unhandled exceptions into RFC 9457 `application/problem+json` responses using the problem type registry and message catalog.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `py_error_changes` (object, required): From `errh-py-exception-chaining`, or a list of the application exception classes if run standalone.
- `problem_type_registry` (object[], required): From `errh-rfc9457-problem-type-registry`.
- `message_catalog` (object, required): From `errh-user-message-catalog`.
- `test_command` (string, required): Exact test command.

---

## Outputs

- `py_http_error_mapping` (object): `{ framework, handler_file, class_to_problem: [ { exception, type, status } ], default_handlers_overridden: [] }`.

---

## Phase 1: Build the Mapping Table

### Entry Criteria
- Every class in `py_error_changes.classes` has a `taxonomy_class`.

### Actions
1. For each class, find the registry row with the same taxonomy class. Record `exception -> type, status`.
2. Add framework built-ins:

| framework | Built-in | Default today | Map to |
|---|---|---|---|
| FastAPI | `fastapi.exceptions.RequestValidationError` | 422 JSON `{"detail": [...]}` | validation problem, `errors[]` built from `exc.errors()` items (`loc`, `msg`) |
| FastAPI | `starlette.exceptions.HTTPException` | `{"detail": ...}` | `about:blank` problem with that status |
| Flask | `werkzeug.exceptions.HTTPException` | HTML page | `about:blank` problem with `e.code` |
| DRF | `rest_framework.exceptions.ValidationError` | `{"field": [msgs]}` | validation problem |
| all | any other `Exception` | 500 plain text or HTML | `about:blank` 500 with generic detail |

### Output
Mapping table.

### Quality Gate
- Every application class maps to exactly one registry row.

---

## Phase 2: Implement the Handlers

### Entry Criteria
- Mapping table complete.

### Actions
1. Write one helper that builds the body and response. FastAPI version:

```python
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

PROBLEM = "application/problem+json"

def problem(status: int, type_: str, title: str, detail: str, request: Request, **ext) -> JSONResponse:
    body = {"type": type_, "title": title, "status": status, "detail": detail,
            "instance": request.url.path, "trace_id": current_request_id(), **ext}
    return JSONResponse(body, status_code=status, media_type=PROBLEM)

def install(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error(request: Request, exc: AppError):
        row = REGISTRY[exc.taxonomy_class]
        return problem(row.status, row.type, row.title, message(row.key, request), request)

    @app.exception_handler(RequestValidationError)
    async def validation(request: Request, exc: RequestValidationError):
        errors = [{"pointer": "#/" + "/".join(str(p) for p in e["loc"][1:]), "detail": e["msg"]}
                  for e in exc.errors()]
        row = REGISTRY["validation"]
        return problem(422, row.type, row.title, message(row.key, request), request, errors=errors)

    @app.exception_handler(StarletteHTTPException)
    async def http_exc(request: Request, exc: StarletteHTTPException):
        return problem(exc.status_code, "about:blank", phrase(exc.status_code), phrase(exc.status_code), request)

    @app.exception_handler(Exception)
    async def unhandled(request: Request, exc: Exception):
        return problem(500, "about:blank", "Internal Server Error", message("error.internal", request), request)
```

2. Register the handler for `starlette.exceptions.HTTPException`, not only `fastapi.HTTPException`, so router 404s and 405s are covered (FastAPI docs, "Handling Errors").
3. Starlette routes the `Exception` handler through `ServerErrorMiddleware`, which re-raises after responding, so the server logs the traceback. Follow the log-once rule from `errh-log-once-at-boundary`: do not log again inside `unhandled`.
4. Flask: `@app.errorhandler(AppError)`, `@app.errorhandler(HTTPException)`; return `(jsonify(body), status, {"Content-Type": PROBLEM})`. DRF: set `REST_FRAMEWORK = {"EXCEPTION_HANDLER": "app.errors.problem_handler"}`; inside, call `rest_framework.views.exception_handler(exc, context)` first and rewrite its `response.data` and `content_type`.
5. Set `Retry-After` on 429 and 503 when known; set `WWW-Authenticate` on 401 (RFC 9110 section 11.6.1).
6. Run `test_command`.

### Output
Handlers installed.

### Quality Gate
- `rg -n "exception_handler|errorhandler|EXCEPTION_HANDLER" --type py` lists every handler in the mapping table.
- Test summary at or above baseline.

---

## Phase 3: Probe Live Responses

### Entry Criteria
- Handlers installed.

### Actions
1. Start the app locally (`uv run uvicorn app.main:app --port 8000` or the project's run command).
2. Probe one route per class and check the header and body:
   - `curl -si localhost:8000/does-not-exist` gives `HTTP/1.1 404` and `content-type: application/problem+json`.
   - `curl -si -X POST localhost:8000/orders -H 'content-type: application/json' -d '{}'` gives 422 with `errors`.
3. Compare each body to its registry fixture with `jq -S 'del(.trace_id, .instance)'` on both sides and `diff`.

### Output
`py_http_error_mapping`.

### Quality Gate
- Every probe returns `application/problem+json` and the `status` member equals the HTTP status line.
- The `diff` against each fixture prints nothing.
- No body contains `Traceback` (`curl -s ... \| rg -c Traceback` prints 0).

---

## Worked Example

Illustrative. FastAPI.
```
$ curl -si localhost:8000/invoices/9999
HTTP/1.1 404 Not Found
content-type: application/problem+json

{"type":"about:blank","title":"Not Found","status":404,"detail":"We could not find that invoice.","instance":"/invoices/9999","trace_id":"9b1d..."}
```
`InvoiceNotFound` maps through `NotFoundError.taxonomy_class = "not_found"`.

---

## Exit Criteria

DONE when every application exception, the framework's validation and HTTP errors, and unhandled exceptions produce RFC 9457 bodies matching the registry fixtures.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | The service has no HTTP routes (`errh-boundary-map` found none) | **Return**: emit an empty mapping; this flow does not apply. |
| Phase 2 | Handler for `Exception` never fires in tests | **Adjust**: create `TestClient(app, raise_server_exceptions=False)`; the default re-raises server exceptions into the test. |
| Phase 2 | Middleware swallows exceptions before handlers | **Adjust**: read the middleware; remove its catch or move mapping into it. |
| Phase 3 | Content type is `application/json` | **Retry**: confirm `media_type=PROBLEM` is passed and no later middleware rewrites it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

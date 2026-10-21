# SDK Error Hierarchy

**One-line description:** Builds a status-mapped SDK error hierarchy (connection, timeout, and one status error class per meaningful 4xx/5xx) that carries status, request ID, headers and the parsed body (RFC 9457 Problem Details when used), keeps the original cause, and lets callers branch with `except`, `instanceof` or `errors.As`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `api_inventory` (object, required): Output of `sdk-spec-inventory`; `error_model` and declared error status codes.
- `stack` (string, required): `python`, `typescript` or `go`.
- `project_dir` (string, required): SDK repository root.

---

## Outputs

- `error_hierarchy` (object): Class or type tree, status-to-class mapping, fields on each error, the request ID header name, the mapping function's file, and test results.

---

## Phase 1: Design the Tree

### Entry Criteria
- `api_inventory.error_model` is known or `unknown` with reason.

### Actions
1. Use this tree (names are a convention; keep them unless the user has existing names):

| Class | When raised | Extra fields |
|---|---|---|
| `AcmeError` | Base of everything the SDK raises | `message` |
| `APIConnectionError` | No HTTP response (DNS, refused, reset, TLS) | `cause` |
| `APITimeoutError` (subclass of `APIConnectionError`) | Timeout before a full response | `cause` |
| `APIStatusError` | Any non-2xx response not mapped below | `status_code`, `request_id`, `headers`, `body` (parsed JSON or raw text) |
| `BadRequestError` | 400 | inherits |
| `AuthenticationError` | 401 | inherits |
| `PermissionDeniedError` | 403 | inherits |
| `NotFoundError` | 404 | inherits |
| `ConflictError` | 409 | inherits |
| `UnprocessableEntityError` | 422 | field errors if the body has them |
| `RateLimitError` | 429 | `retry_after` parsed from `Retry-After` |
| `InternalServerError` | Any 5xx | inherits |

2. Find the request ID header from the spec or docs (`X-Request-Id`, `Request-Id`, or vendor-specific): `jq -r '.. | objects | .headers? // empty | keys[]' build/openapi.json | sort -u | grep -i request`. Record it; it goes into every error message.
3. If `error_model` is `application/problem+json` (RFC 9457), parse `type`, `title`, `status`, `detail`, `instance` into typed fields; keep extension members in a dict or map.
4. Stack specifics:
   - python: plain classes inheriting from `AcmeError(Exception)`; raise with `raise X(...) from exc` for connection errors.
   - typescript: `class AcmeError extends Error { constructor(msg: string, opts?: { cause?: unknown }) { super(msg, opts); this.name = new.target.name; } }`. `Object.setPrototypeOf(this, new.target.prototype)` is needed only when compiling to ES5; check `target` in `tsconfig.json`.
   - go: one `type APIError struct { StatusCode int; RequestID string; Header http.Header; Body []byte; Problem *Problem }` with `func (e *APIError) Error() string`; status classes as sentinel errors (`var ErrNotFound = errors.New("not found")`) matched through `func (e *APIError) Is(target error) bool { return target == ErrNotFound && e.StatusCode == 404 || ... }`; connection errors wrap the cause with `%w`.

### Output
Tree and field list.

### Quality Gate
- Every status code declared in the spec's responses maps to a class (grep the declared codes from the inventory and check each against the table).

---

## Phase 2: Implement the Mapping

### Entry Criteria
- Tree designed.

### Actions
1. Write ONE function that turns a response into an error: python `_make_status_error(response) -> APIStatusError`, typescript `makeStatusError(res: Response, body: unknown)`, go `newAPIError(resp *http.Response) error`. All transport paths call it; no other code constructs status errors.
2. Read the body once: try JSON; on failure keep raw text (truncated for the message, full in `body`). Never raise a JSON decode error in place of the API error.
3. Message format: `"<status> <title or first error message> (request_id=<id>)"`. Do NOT include request headers or bodies that may contain secrets.
4. `RateLimitError.retry_after`: parse seconds or HTTP-date (RFC 9110 section 10.2.3); `None` when absent.
5. Generated clients: openapi-generator python raises `ApiException` subclasses (`BadRequestException`, `NotFoundException`, ...) in recent versions; wrap them into your tree at the facade or configure the facade to call the mapping function. oapi-codegen returns typed `JSON4xx` fields without an error; the facade must check `StatusCode()` and call the mapping function. openapi-fetch returns `{ error }` without throwing; the facade throws.

### Output
Mapping function and classes.

### Quality Gate
- Type checker passes.
- `grep -rn "raise APIStatusError\|new APIStatusError\|&APIError{" <src>` shows constructions only in the mapping function.

---

## Phase 3: Test

### Entry Criteria
- Mapping compiles.

### Actions
1. Table-driven test over statuses 400, 401, 403, 404, 409, 422, 429, 500, 503 and one unmapped status (for example 418): assert the class (python `pytest.raises(NotFoundError)`, typescript `expect(err).toBeInstanceOf(NotFoundError)`, go `errors.Is(err, ErrNotFound)` and `errors.As(err, &apiErr)`).
2. Assert `status_code`, `request_id` and parsed `body` on one case; assert problem+json fields when used.
3. Assert a non-JSON body (HTML from a proxy) still yields the right class with raw text.
4. Assert `RateLimitError.retry_after` for both formats.
5. Assert connection failure gives `APIConnectionError` with the original cause attached (`__cause__`, `.cause`, `errors.Unwrap`).
6. Run the suite.

### Output
`error_hierarchy`.

### Quality Gate
- All tests pass.
- Mutation check: map 404 to `APIStatusError`; the table test must fail; restore.

---

## Worked Example

Illustrative only. `stack = python`, errors use problem+json, request ID header `X-Request-Id`.

```python
try:
    client.users.retrieve("u_missing")
except NotFoundError as e:
    print(e.status_code, e.request_id, e.problem.detail)
```
```
404 req_8f2a User u_missing does not exist
$ pytest tests/test_errors.py -q
..............                                               [100%]
14 passed in 0.07s
```

---

## Exit Criteria

DONE when every non-2xx response and transport failure maps through one function into the documented tree with status, request ID, body and cause, and tests prove each class and field.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Existing public SDK already has different class names | **Adjust**: keep the existing names; add missing classes as subclasses so callers do not break. |
| Phase 2 | Error body schema differs between operations | **Adjust**: parse the common fields; keep the full body; record the inconsistency for the API owner. |
| Phase 3 | `instanceof` fails in TypeScript tests | **Adjust**: check the compile `target`; add `Object.setPrototypeOf` only for ES5 targets. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

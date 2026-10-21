# RFC 9457 Problem Type Registry

**One-line description:** Defines the service's catalog of RFC 9457 problem types (type URI, title, status, extension members) from the error taxonomy, with the exact JSON shape, media type and member rules the standard requires, so every stack's HTTP mapping emits identical bodies.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `error_taxonomy` (object, required): From `errh-error-taxonomy`.
- `problem_type_base_uri` (string, required): Absolute URI prefix the service controls, for example `https://api.example.com/problems/`. RFC 9457 type values are URI references; an absolute URI avoids resolution against the request URL.

---

## Outputs

- `problem_type_registry` (object[]): `{ class, type, title, status, extensions: [ { name, json_type, meaning } ], doc_path }` per problem type.

---

## Phase 1: Learn the Required Shape

### Entry Criteria
- `problem_type_base_uri` is absolute (starts with `https://`) and the team controls it.

### Actions
1. Use RFC 9457 (July 2023), which obsoletes RFC 7807. Read sections 3 and 4 before writing anything.
2. Fixed rules from the RFC that this registry enforces:
   - Media type: `application/problem+json` (RFC 9457 section 6.1).
   - Members: `type` (URI reference; default `"about:blank"`), `title` (short, the same for every occurrence of that type), `status` (number, advisory, must equal the actual HTTP status), `detail` (this occurrence, human-readable, not for parsing), `instance` (URI reference for this occurrence).
   - When `type` is `"about:blank"`, `title` should be the HTTP status phrase (for example `"Not Found"`).
   - Extension members are allowed; clients must ignore extensions they do not recognize. Extension names should be valid as identifiers (start with a letter, letters, digits, underscore, at least three characters) per section 3.2.
   - `detail` must not be the only place a client finds machine data: put it in an extension member.
3. Do NOT invent members such as `code` or `message` at the top level unless declared as extensions here.

### Output
Rule list pinned to the RFC section numbers.

### Quality Gate
- Each rule cites its RFC 9457 section number.

---

## Phase 2: Define Types

### Entry Criteria
- Rules pinned.

### Actions
1. Create one problem type per taxonomy class that maps to a 4xx or 5xx status, using this naming:

| class | type | title | status |
|---|---|---|---|
| validation | `<base>validation-error` | `Your request is not valid.` | 400 or 422 per taxonomy |
| unauthenticated | `about:blank` | `Unauthorized` | 401 |
| forbidden | `about:blank` | `Forbidden` | 403 |
| not_found | `about:blank` | `Not Found` | 404 |
| conflict | `<base>conflict` | `The resource changed or already exists.` | 409 |
| rate_limited | `about:blank` | `Too Many Requests` | 429 |
| payload_too_large | `about:blank` | `Content Too Large` | 413 |
| dependency_transient | `<base>temporarily-unavailable` | `The service is temporarily unavailable.` | 503 or 504 |
| dependency_permanent | `<base>upstream-error` | `An upstream service failed.` | 502 |
| bug | `about:blank` | `Internal Server Error` | 500 |

2. Add domain-specific types only when a client must branch on them (for example `<base>insufficient-funds`, 422). Each new type needs a `doc_path`.
3. Declare extensions per type:
   - validation: `errors` (array of `{ "pointer": "<JSON Pointer per RFC 6901>", "detail": "<text>" }`). RFC 9457 section 3 shows this pattern for multiple validation problems of the same type.
   - every type: `trace_id` (string, W3C trace-id or request id; lets support find the log line).
   - rate_limited: none in the body; the `Retry-After` header carries the delay.
4. Never put stack traces, SQL, file paths, hostnames or exception class names in any member (CWE-209).

### Output
Type rows.

### Quality Gate
- Every `about:blank` row has a `title` equal to the RFC 9110 reason phrase for its status.
- No extension name collides with a standard member name.
- Every non-`about:blank` type has a `doc_path`.

---

## Phase 3: Write Docs and Fixtures

### Entry Criteria
- Rows defined.

### Actions
1. For each non-`about:blank` type, write a docs page at `doc_path` that states: when it occurs, status, extension members, and what the client should do. RFC 9457 encourages a dereferenceable `type` URI that returns this documentation.
2. Write one JSON fixture per type to `docs/problems/fixtures/<slug>.json`. These fixtures become the expected bodies in the failure-path test flows.
3. Validate every fixture parses: `for f in docs/problems/fixtures/*.json; do jq -e . "$f" >/dev/null || echo "BAD $f"; done` prints nothing.

### Output
`problem_type_registry` plus fixtures.

### Quality Gate
- The jq loop prints no `BAD` line.
- Each fixture's `status` equals the registry row's status.

---

## Worked Example

Illustrative. `problem_type_base_uri=https://api.shop.example/problems/`.

Fixture `validation-error.json`:
```json
{
  "type": "https://api.shop.example/problems/validation-error",
  "title": "Your request is not valid.",
  "status": 422,
  "detail": "2 fields failed validation.",
  "instance": "/orders",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "errors": [
    { "pointer": "#/quantity", "detail": "must be greater than 0" },
    { "pointer": "#/sku", "detail": "is required" }
  ]
}
```
Fixture `not-found.json` uses `"type": "about:blank"`, `"title": "Not Found"`, `"status": 404`.

---

## Exit Criteria

DONE when every 4xx and 5xx taxonomy class has a problem type, every custom type has a docs page and a fixture, and all fixtures parse.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Base URI is relative or not owned | **Stop**: ask for an absolute URI under a domain the team controls. |
| Phase 2 | Existing clients parse an older error body | **Adjust**: keep old fields as declared extension members for one deprecation period; record the removal date as an owner decision. |
| Phase 2 | Request to expose the exception message in `detail` | **Stop**: write a fixed per-class detail; internal text goes to logs only. |
| Phase 3 | A fixture fails `jq -e` | **Retry**: fix the JSON syntax and rerun the loop. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

# Error Taxonomy

**One-line description:** Classifies every error the service can produce into a fixed set of classes along two axes, expected versus unexpected and retryable versus not, and assigns each class one owner action, one HTTP status and one log level, so every later decision is a table lookup instead of a judgment call.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `boundary_map` (object, required): From `errh-boundary-map`.
- `catch_inventory` (object[], required): From `errh-rg-swallowed-catch-inventory`.
- `semgrep_findings` (object[], required): From `errh-semgrep-swallowed-catch-scan`.

---

## Outputs

- `error_taxonomy` (object): `{ classes: [ { class, expected, retryable, http_status, log_level, alert, examples: [type names] } ], type_map: { "<concrete error type>": "<class>" } }`.

---

## Phase 1: Adopt the Base Classes

### Entry Criteria
- The three inputs exist.

### Actions
1. Start from this fixed table. Do not add classes in this phase. Status codes and meanings come from RFC 9110 section 15 and RFC 6585 (429).

| class | expected | retryable | http_status | log_level | alert |
|---|---|---|---|---|---|
| validation | yes | no | 400 (malformed syntax) or 422 (well-formed, semantically invalid) | info | no |
| unauthenticated | yes | no | 401 (must send `WWW-Authenticate`) | info | no |
| forbidden | yes | no | 403 | info | no |
| not_found | yes | no | 404 | info | no |
| conflict | yes | no (retry only after re-read) | 409, or 412 for failed `If-Match` | info | no |
| rate_limited | yes | yes, after `Retry-After` | 429 | warn | no |
| payload_too_large | yes | no | 413 | info | no |
| dependency_transient | no | yes | 503 if our dependency is unavailable, 504 if it timed out, 502 if it returned an invalid response | warn per attempt, error when retries exhaust | when error rate exceeds the SLO |
| dependency_permanent | no | no | 502 | error | yes |
| cancelled | yes | no | none (client is gone); do not write a body | debug | no |
| bug | no | no | 500 | error with stack | yes |
| fatal_resource | no | no | process exits; supervisor restarts | error | yes |

2. `expected` means the error is part of the contract and a correct program will see it. `bug` means the code is wrong; the fix is a code change, never a catch.
3. Rule: a class never gets both `expected: no` and a 4xx status.

### Output
Base class table.

### Quality Gate
- Every row has all six columns filled.
- No row pairs a 4xx status with `expected: no`.

---

## Phase 2: Map Concrete Types

### Entry Criteria
- Base table adopted.

### Actions
1. From `catch_inventory` and `semgrep_findings`, list every concrete error type that appears in a catch, a `raise`/`throw`, a `return Err(...)`, a sentinel (`var ErrX = errors.New`) or a status check.
2. Add library types you depend on. Use this lookup; confirm each type name in the library docs or source before writing it.

| Source error | class |
|---|---|
| PostgreSQL SQLSTATE `23505` unique_violation | conflict |
| PostgreSQL SQLSTATE `40001` serialization_failure, `40P01` deadlock_detected | dependency_transient (retry the whole transaction) |
| PostgreSQL SQLSTATE `57014` query_canceled | cancelled if caused by client cancel, else dependency_transient |
| MySQL error 1213 (deadlock), 1205 (lock wait timeout) | dependency_transient |
| Go `sql.ErrNoRows`, Python `NoResultFound` (SQLAlchemy), Rust `sqlx::Error::RowNotFound` | not_found (only when the caller asked for one row by key) |
| Go `context.Canceled`, Python `asyncio.CancelledError` | cancelled |
| Go `context.DeadlineExceeded`, Python `TimeoutError`, `httpx.TimeoutException`, Node `AbortError` from a timeout signal | dependency_transient |
| Connection refused or reset (`ECONNREFUSED`, `ECONNRESET`, `ConnectionResetError`) | dependency_transient |
| Upstream HTTP 429, 502, 503, 504 | dependency_transient (429 honors `Retry-After`) |
| Upstream HTTP 400, 401, 403, 404, 422 | dependency_permanent (our request is wrong) unless the upstream 404 means "resource absent" in the contract, then not_found |
| Python `KeyError`, `AttributeError`, `TypeError`; Go nil pointer panic; Rust index panic; JS `TypeError` | bug |
| Out of memory, disk full (`ENOSPC`) | fatal_resource |

3. Write `type_map` with one entry per concrete type. A type that fits two classes depending on call site gets the class at each call site recorded in a `site_overrides` list.

### Output
`type_map`.

### Quality Gate
- Every exception or error type named in `catch_inventory` snippets appears in `type_map` or is listed under `unmapped` with a reason.
- Every SQLSTATE or errno in `type_map` cites the vendor documentation page.

---

## Phase 3: Emit

### Entry Criteria
- `type_map` complete.

### Actions
1. Fill `examples` in each class from `type_map`.
2. Write `error_taxonomy`. Do not change the base table rows; additions go to a `project_classes` list, each with all six columns and a reason.

### Output
`error_taxonomy`.

### Quality Gate
- `error_taxonomy.classes` contains the 12 base classes unchanged.
- `unmapped` is empty or each entry has a named owner question.

---

## Worked Example

Illustrative. Inventory from a Python FastAPI service shows `except IntegrityError`, `except httpx.HTTPStatusError`, `except KeyError`, `except Exception`.

Phase 2 `type_map`:
```
sqlalchemy.exc.IntegrityError (pgcode 23505) -> conflict
sqlalchemy.exc.IntegrityError (pgcode 23503 foreign_key_violation) -> validation
httpx.HTTPStatusError status 503 -> dependency_transient
httpx.HTTPStatusError status 400 -> dependency_permanent
KeyError -> bug
```
`IntegrityError` maps by `exc.orig.pgcode` (psycopg) or `exc.orig.sqlstate` (psycopg 3), so it gets two `site_overrides` rows.

---

## Exit Criteria

DONE when every concrete error type in the inventory maps to one class and every class has expected, retryable, status, log level and alert set.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Team wants 200 with an error body | **Stop**: record it as an open question; RFC 9110 status semantics apply to every response and later flows depend on them. |
| Phase 2 | Cannot tell whether an upstream 404 is "absent" or "wrong URL" | **Return**: list it under `unmapped` with the call site; ask the owner of the upstream contract. |
| Phase 2 | Driver exposes no SQLSTATE | **Adjust**: map by driver exception class and cite the driver docs. |
| Phase 3 | Someone proposes a class "other" | **Stop**: every error maps to `bug` until it has a real class. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

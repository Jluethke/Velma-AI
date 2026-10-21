# SDK Handwritten Endpoint Map

**One-line description:** Maps every spec operation that the handwritten or hybrid layer must expose to one SDK method with a fixed signature rule (path params positional, query and body in a typed options object, per-call overrides last), writes the map as a table, and implements one resource at a time with a test per method.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `api_inventory` (object, required): Output of `sdk-spec-inventory`.
- `type_mapping` (object, required): Output of `sdk-model-type-mapping`.
- `generation_plan` (object, required): Output of `sdk-generator-decision`; `approach` is `handwritten` or `hybrid`.
- `stack` (string, required): `python`, `typescript` or `go`.
- `project_dir` (string, required): SDK repository root.

---

## Outputs

- `endpoint_map` (object[]): One row per exposed operation: operationId, HTTP method, path, resource, SDK method name, signature, return type, pagination style, idempotency handling, and the test file that covers it.

---

## Phase 1: Write the Map Before Any Code

### Entry Criteria
- `generation_plan.approach` is `handwritten` or `hybrid`.

### Actions
1. Select the operations: all of them for `handwritten`; for `hybrid`, the operations listed in `generation_plan.handwritten_operations` plus any facade methods the plan requires.
2. For each operation, fill one row using these rules:

| Part | Rule |
|---|---|
| Resource | First tag; if untagged, the first path segment after the version prefix (`/v1/users/{id}` gives `users`) |
| Method name | Verb from the operationId, cased per `type_mapping` naming rules: `listUsers` becomes `users.list` (python `users.list`, typescript `users.list`, go `Users.List`) |
| Path params | Positional arguments in path order |
| Query params and body | One typed options or params object; required fields required in the type |
| Per-call overrides | Last argument: timeout, idempotency key, extra headers. Python keyword-only after `*`; TypeScript a `RequestOptions` object; Go functional options or a `context.Context` first argument plus options |
| Go context | Every Go method takes `ctx context.Context` as its first parameter |
| Return type | The success response model; list operations return the paginator type from the pagination flows |
| 204 responses | Python `None`, TypeScript `Promise<void>`, Go `error` only |

3. Write the map to `docs/endpoint-map.md` as a table. Do NOT start coding until every selected operation has a row.

### Output
`docs/endpoint-map.md`.

### Quality Gate
- Row count equals the number of selected operations.
- No two rows share the same resource and method name.

---

## Phase 2: Implement One Resource

### Entry Criteria
- Map complete.

### Actions
1. Pick the resource with the fewest operations first.
2. Create one file for it: python `acme_client/resources/users.py`, typescript `src/resources/users.ts`, go `acme/users.go`. Edit ONLY this file and its test file in this step.
3. Each method builds the request through the shared transport (the single place where auth, retries, timeouts and errors are applied). Never call the HTTP library directly from a resource method.
4. Path params are URL-encoded: python `urllib.parse.quote(value, safe="")`, typescript `encodeURIComponent(value)`, go `url.PathEscape(value)`. An ID containing `/` must not change the path.
5. Write one test per method that asserts method, path, query string and body seen by the mock server.
6. Run only this resource's tests: python `pytest tests/test_users.py -q`, typescript `npx vitest run src/resources/users.test.ts`, go `go test ./acme -run TestUsers -count=1`.

### Output
One implemented resource with passing tests.

### Quality Gate
- The resource test command exits 0.
- A test passes an ID containing `/` and asserts the encoded path (`%2F`).

---

## Phase 3: Repeat and Reconcile

### Entry Criteria
- First resource done.

### Actions
1. Repeat Phase 2 for each remaining resource, one at a time, running its tests before moving on.
2. After the last resource, run the full suite: `pytest -q`, `npx vitest run`, or `go test ./... -count=1`.
3. Fill the `test file` column of `endpoint_map` for every row.
4. Do NOT add methods that are not in the spec. If a convenience method is wanted, add it as a row marked `facade` with the operations it composes.

### Output
`endpoint_map`.

### Quality Gate
- The full suite exits 0.
- Every row in `endpoint_map` names a test file that exists.

---

## Worked Example

Illustrative only. `stack = python`, `approach = hybrid`, handwritten operations `listUsers`, `getUser`, `updateSettings`.

| operationId | Method | Path | SDK method | Signature | Returns |
|---|---|---|---|---|---|
| listUsers | GET | /v1/users | `users.list` | `(*, status: str \| None = None, limit: int \| None = None, request_options=None)` | `SyncCursorPage[User]` |
| getUser | GET | /v1/users/{user_id} | `users.retrieve` | `(user_id: str, *, request_options=None)` | `User` |

```
$ pytest tests/test_users.py -q
....                                                         [100%]
4 passed in 0.21s
```

---

## Exit Criteria

DONE when every selected operation has a map row, an implementation that goes through the shared transport, and a passing test that checks the request on the wire.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Two operations map to the same method name | **Adjust**: use the full operationId verb (`listOrgUsers` becomes `users.list_for_org`); record it. |
| Phase 2 | A test fails after editing a second file | **Adjust**: revert to the one-file rule; finish the current resource first. |
| Phase 2 | Shared transport does not exist yet | **Return**: build auth, retry and error flows first, or create a minimal transport with a TODO-free interface the later flows extend. |
| Phase 3 | Full suite fails in an earlier resource | **Stop**: fix that regression before adding more methods. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

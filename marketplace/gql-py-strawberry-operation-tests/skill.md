# Resolver and Operation Tests (Python, Strawberry)

**One-line description:** Tests a Strawberry schema with pytest: in-process operation tests through `await schema.execute(...)` for every client operation, HTTP tests through FastAPI's `TestClient` for context and auth wiring, and assertions on `extensions.code` from the error catalog.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `operation_documents` (string, required): Client operations; each gets at least one test.
- `project_dir` (string, required): Python server root.
- `error_code_catalog` (object[], required): Codes tests must assert.

---

## Outputs

- `operation_test_suite` (string): Path to the tests directory.
- `test_run_log` (string): Output of the passing run.

---

## Phase 1: Harness

### Entry Criteria
- `schema` imports from `app.schema` without starting a server.

### Actions
1. `pip install pytest pytest-asyncio httpx` (`httpx` is required by FastAPI's `TestClient`).
2. In `pyproject.toml` set `[tool.pytest.ini_options] asyncio_mode = "auto"` so async tests run without a marker on each (or mark each with `@pytest.mark.asyncio`).
3. Create `tests/conftest.py` with fixtures: a test database session (transaction rolled back after each test), seed data, and `ctx(user=None)` returning the same dict shape `get_context` returns, including fresh loaders.
4. Helper:
```python
async def run(query: str, variables=None, **ctx_kwargs):
    return await schema.execute(query, variable_values=variables or {}, context_value=make_ctx(**ctx_kwargs))
```
`schema.execute` runs parse, validation, extensions and execution in-process. Use `schema.execute_sync` only if every resolver is synchronous.

### Output
Fixtures and helper.

### Quality Gate
- `pytest -q -k typename` with a `{ __typename }` test prints `1 passed`.

---

## Phase 2: Write Tests

### Entry Criteria
- Harness works.

### Actions
1. For each file in `operation_documents`: `q = pathlib.Path("operations/CustomerOrders.graphql").read_text()`, run it with realistic variables, assert `result.errors is None` and specific fields of `result.data`.
2. Error tests: for each catalog code your code produces, trigger it and assert `result.errors[0].extensions["code"] == "FORBIDDEN"`. Note `result.errors` holds `GraphQLError` objects; `MaskErrors` applies during `schema.execute` too, so masked messages appear in tests as clients see them.
3. HTTP tests (wiring only, a few): `client = TestClient(app); r = client.post("/graphql", json={"query": q}, headers={"authorization": f"Bearer {token}"}); assert r.status_code == 200; assert r.json()["data"]...`.
4. Write one test file at a time and run it.
5. Do not patch the resolver under test; patch only external service clients.

### Output
Test files.

### Quality Gate
- Every operation name in `operation_documents` appears in at least one test file (`grep -l "<OperationName>" tests/`).

---

## Phase 3: Run and Record

### Entry Criteria
- Tests written.

### Actions
1. Run `pytest -q -rA` and save output to `test_run_log`.
2. On failure:

| Failure | Action |
|---|---|
| `result.errors` has an unexpected error | print `result.errors[0].original_error` to see the real exception; fix the resolver |
| `RuntimeError: Event loop is closed` or loop mismatch | set `asyncio_mode = "auto"` and a session-scoped loop policy per pytest-asyncio docs; do not mix `anyio` and `pytest-asyncio` markers |
| Expectation contradicts schema or use case | fix the test with a recorded reason |

3. Never add `@pytest.mark.skip`, `xfail`, or delete a failing test to get green.
4. Add `pytest -q` to CI.

### Output
`operation_test_suite`, `test_run_log`.

### Quality Gate
- `pytest -q` exits 0.
- `grep -rn "mark.skip\|mark.xfail" tests/` prints nothing.

---

## Worked Example

Illustrative only.

```python
async def test_cancel_order_by_owner(alice, pending_order):
    q = pathlib.Path("operations/CancelOrder.graphql").read_text()
    r = await run(q, {"input": {"orderId": pending_order.gid}}, user=alice)
    assert r.errors is None
    assert r.data["cancelOrder"]["order"]["status"] == "CANCELLED"

async def test_cancel_order_by_other_user(bob, pending_order):
    r = await run(CANCEL, {"input": {"orderId": pending_order.gid}}, user=bob)
    assert r.data["cancelOrder"]["order"] is None
```
Run: `9 passed in 0.84s`.

---

## Exit Criteria

DONE when every client operation and produced error code has a passing test, wiring is covered by a few HTTP tests, and nothing is skipped.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Fixtures leak rows between tests | **Adjust**: wrap each test in a transaction and roll back in fixture teardown. |
| Phase 2 | Loader returns stale data across tests | **Adjust**: build new loaders in `make_ctx` for every call. |
| Phase 3 | Masked message hides cause | **Adjust**: read `original_error` in the test output; keep masking on. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

# SDK Python Mock Tests

**One-line description:** Writes the Python SDK's HTTP-level test suite with the mocking tool that actually intercepts its HTTP library (responses for requests, respx for httpx, pytest-httpserver for urllib3-based generated clients), with unmatched requests failing the test, and covers auth, errors, retries and pagination.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): SDK repository root.
- `api_inventory` (object, required): Output of `sdk-spec-inventory`.
- `error_hierarchy` (object, required): Output of `sdk-error-hierarchy`; the classes to assert.
- `retry_policy` (object, required): Output of `sdk-retry-backoff`; the retry scenarios to assert.

---

## Outputs

- `py_mock_tests` (object): Mock tool chosen and why, test files, scenario coverage table, and the pytest result line.

---

## Phase 1: Pick the Tool That Intercepts Your Library

### Entry Criteria
- The HTTP library is known (`grep -rhoE "^(import|from) (httpx|requests|urllib3)" acme_client/ | sort -u`).

### Actions
1. Choose with this table. Using the wrong tool means requests go to the real network or the test silently tests nothing.

| HTTP library | Tool | Why |
|---|---|---|
| requests | `responses` | Patches requests' adapter; does NOT intercept httpx or raw urllib3 |
| httpx (sync or async) | `respx` (or `httpx.MockTransport`) | Patches httpx transports; does NOT intercept requests |
| urllib3 (openapi-generator python default) | `pytest-httpserver` (real local HTTP server) | Neither responses nor respx patches urllib3's pool; a real server works with any library |

2. Install pinned dev dependencies: `pip install pytest responses` or `pip install pytest respx` or `pip install pytest pytest-httpserver`, and add them to the dev dependency list in `pyproject.toml`.
3. Block real network access as a safety net: `pip install pytest-socket` and run `pytest --disable-socket --allow-hosts=127.0.0.1,localhost` (pytest-httpserver binds localhost).

### Output
Tool chosen and installed.

### Quality Gate
- The chosen tool matches the table row for the library found.
- `pytest --disable-socket --allow-hosts=127.0.0.1,localhost -q` runs (zero tests collected is fine at this point).

---

## Phase 2: Write Fixtures That Fail on Unmatched Requests

### Entry Criteria
- Tool installed.

### Actions
1. Fixtures per tool:
   - responses: `with responses.RequestsMock(assert_all_requests_are_fired=True) as rsps:`; sequence responses for retries with `registry=responses.registries.OrderedRegistry`; unmatched requests raise `ConnectionError` automatically.
   - respx: `with respx.mock(base_url="https://api.test", assert_all_called=True, assert_all_mocked=True) as mock:`; sequences with `route.mock(side_effect=[httpx.Response(503), httpx.Response(200, json={...})])`; inspect `route.calls` and `route.call_count`.
   - pytest-httpserver: `httpserver.expect_ordered_request("/v1/users", method="GET").respond_with_json({...})`; point the SDK at `httpserver.url_for("/")`; call `httpserver.check_assertions()` at the end of each test; unmatched requests get a 500 and are reported by `check_assertions`.
2. Build the client in a fixture with retries' sleep injected as a no-op so retry tests are instant.
3. Assert the request, not just the response: method, path, query, headers (auth, `User-Agent`, `Idempotency-Key`) and JSON body.

### Output
Fixtures in `tests/conftest.py`.

### Quality Gate
- A test that makes an unmocked call fails (write it, confirm the failure, delete it).

---

## Phase 3: Cover the Scenarios

### Entry Criteria
- Fixtures exist.

### Actions
1. Write tests to fill this coverage table, one test per row:

| Scenario | Assertion |
|---|---|
| Happy path per resource (at least one operation) | Typed model returned; request shape correct |
| Auth header present | Header value equals configured key or token |
| Each error class in `error_hierarchy` | `pytest.raises(<Class>)` with status and request ID |
| Retry on 503 then 200 | 2 calls; success |
| No retry on 400 | 1 call |
| No retry on POST without idempotency key | 1 call |
| `Retry-After` honored | Injected sleep called with the header value |
| Pagination across pages | Item count and request count |
| Connection error | `APIConnectionError` (respx: `side_effect=httpx.ConnectError`; responses: `body=requests.exceptions.ConnectionError()`) |

2. Run `pytest --disable-socket --allow-hosts=127.0.0.1,localhost -q`.
3. Do NOT delete or weaken a failing test to get a green run. A failing test is either a real SDK defect (fix the SDK) or a wrong mock (fix the mock and say which).

### Output
`py_mock_tests`.

### Quality Gate
- Every row of the coverage table has a test (list test names in `py_mock_tests`).
- The pytest result line shows 0 failed and 0 errors.

---

## Worked Example

Illustrative only. httpx-based SDK, respx.

```python
def test_retry_503_then_200(client, respx_mock):
    route = respx_mock.get("https://api.test/v1/users/u_1").mock(
        side_effect=[httpx.Response(503), httpx.Response(200, json={"id": "u_1", "email": "a@b.c", "created_at": "2026-01-01T00:00:00Z"})])
    user = client.users.retrieve("u_1")
    assert user.id == "u_1"
    assert route.call_count == 2
```
```
$ pytest --disable-socket --allow-hosts=127.0.0.1,localhost -q
..........................                                   [100%]
26 passed in 0.44s
```

---

## Exit Criteria

DONE when the suite uses the tool that intercepts the SDK's HTTP library, fails on unmatched requests and real network access, and covers every row of the scenario table with request-level assertions.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Mixed libraries (requests and httpx) | **Adjust**: use pytest-httpserver for both, or one tool per library with separate fixtures. |
| Phase 2 | Mocks pass but real calls go out | **Stop**: the tool does not patch this library; return to the Phase 1 table. |
| Phase 3 | A test fails on an SDK defect | **Return**: report the defect to the owning flow (retry, errors, pagination); keep the test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

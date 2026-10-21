# Python Failure-Path Tests with pytest

**One-line description:** Writes pytest tests that force each error class at its source with `monkeypatch` or fakes and assert the exception type, the preserved `__cause__`, the RFC 9457 response, the retry count and exactly one boundary log record, then proves each test is live by breaking the handler and watching it fail.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `py_error_changes` (object, required): From `errh-py-exception-chaining`.
- `py_http_error_mapping` (object, required): From `errh-py-http-problem-details`.
- `retry_policy_table` (object[], required): From `errh-retryability-table`.
- `test_command` (string, required): Exact test command.

---

## Outputs

- `py_failure_tests` (object): `{ test_files, cases: [ { name, class, asserts } ], mutation_checks: [ { case, broke, failed_as_expected } ], final_summary }`.

---

## Phase 1: Plan Cases

### Entry Criteria
- `pytest --version` prints a version.

### Actions
1. One case per row of this matrix that applies:

| Layer | What to force | What to assert |
|---|---|---|
| Unit, wrap site | Callee raises the low-level error | `pytest.raises(DomainError)`; `isinstance(excinfo.value.__cause__, LowLevelError)` |
| Unit, propagate site | Callee raises | The same exception escapes (no default value returned) |
| HTTP, each problem type | Route triggers the class | status, `content-type: application/problem+json`, body equals fixture minus `trace_id`, `instance` |
| HTTP, unhandled | Route raises `RuntimeError` | 500 problem, no `Traceback` in body |
| Retry, transient | Dependency fails N-1 times then succeeds | call count equals N, result succeeds |
| Retry, permanent | Dependency raises a non-retryable class | call count equals 1 |
| Logging | Any 500 | exactly one ERROR record from the app loggers |
| Cancellation | Task cancelled mid-call | `asyncio.CancelledError` propagates |

2. N for retry cases is `max_attempts` from `retry_policy_table`. If it is `OPEN`, write the retry cases with a parameter and mark them `xfail(strict=True, reason="max_attempts OPEN")` until set.

### Output
Case list.

### Quality Gate
- Every taxonomy class in `py_http_error_mapping.class_to_problem` has at least one HTTP case.

---

## Phase 2: Write the Tests

### Entry Criteria
- Case list exists.

### Actions
1. Use these exact pytest tools:

```python
import logging
import pytest
from fastapi.testclient import TestClient

def test_rates_wraps_timeout(monkeypatch):
    def boom(*a, **k):
        raise httpx.ConnectTimeout("timed out")
    monkeypatch.setattr(rates.client, "get", boom)
    with pytest.raises(DependencyUnavailable, match=r"fetch rates EUR") as excinfo:
        rates.fetch("EUR")
    assert isinstance(excinfo.value.__cause__, httpx.ConnectTimeout)

def test_missing_invoice_is_problem(client):
    r = client.get("/invoices/9999")
    assert r.status_code == 404
    assert r.headers["content-type"].startswith("application/problem+json")
    body = r.json()
    body.pop("trace_id"); body.pop("instance")
    assert body == load_fixture("not-found")

def test_unhandled_logs_once(app, caplog, monkeypatch):
    monkeypatch.setattr(orders, "total", lambda *_: (_ for _ in ()).throw(RuntimeError("x")))
    client = TestClient(app, raise_server_exceptions=False)
    with caplog.at_level(logging.ERROR):
        r = client.get("/orders/1/total")
    assert r.status_code == 500 and "Traceback" not in r.text
    app_errors = [rec for rec in caplog.records if rec.levelno >= logging.ERROR and rec.name.startswith("app")]
    assert len(app_errors) == 1
```

2. `pytest.raises(match=...)` applies `re.search` to `str(exc)`; escape regex characters or use `re.escape`.
3. For retries, count calls with a fake object or `unittest.mock.Mock(side_effect=[exc, exc, ok])`, and patch the wait to zero: for tenacity, set `fn.retry.wait = tenacity.wait_none()` in the test or inject the wait via config; check the tenacity docs for your version.
4. Async code: use `pytest-asyncio` (`@pytest.mark.asyncio`) or `anyio`'s plugin, whichever the repo already uses.
5. Do NOT assert on log message text that the log-once flow may change; assert level, logger name and count.
6. Run `test_command`. All new tests pass.

### Output
Test files.

### Quality Gate
- `test_command` passes; the summary shows the new tests counted (passed count rose by the number of cases).
- `rg -n "pytest.mark.skip|@skip" <new test files>` returns nothing.

---

## Phase 3: Prove Each Test Is Live

### Entry Criteria
- New tests pass.

### Actions
1. For each case, make the smallest break that should fail it, run only that test with `pytest -q <file>::<test>`, confirm FAIL, then restore with `git checkout -- <file>`:
   - wrap case: change `from exc` to `from None`.
   - HTTP case: comment out the handler registration.
   - retry case: set attempts to 1.
   - logging case: add a second `logger.error` in the handler.
2. After all checks, `git status --porcelain` shows only the new test files and intended source changes.

### Output
`py_failure_tests` with mutation results.

### Quality Gate
- Every case has `failed_as_expected: true`.
- Final `test_command` passes and its summary line is recorded.

---

## Worked Example

Illustrative.
```
$ uv run pytest -q tests/test_errors.py
.........                                                     [100%]
9 passed in 0.84s
# break: rates.py "from exc" -> "from None"
$ uv run pytest -q tests/test_errors.py::test_rates_wraps_timeout
F   AssertionError: assert False  (isinstance(None, ConnectTimeout))
$ git checkout -- app/rates.py
```

---

## Exit Criteria

DONE when every error class has a passing failure-path test, each test failed when its handler or wrap was broken, and the source is restored.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | 500 test raises instead of returning a response | **Adjust**: use `TestClient(app, raise_server_exceptions=False)`. |
| Phase 2 | Retry test is slow | **Adjust**: replace the wait with `wait_none()` in the test; never lower production waits to speed tests. |
| Phase 3 | A test still passes after the break | **Stop**: the test does not check the behavior; rewrite its assertion before continuing. |
| Phase 3 | Restore left a diff | **Retry**: `git diff <file>` and `git checkout -- <file>`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

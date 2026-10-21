# Python Client Timeouts From the Timeout Plan

**One-line description:** Applies the planned connect and per-try timeouts to every Python client (requests, httpx, aiohttp, grpcio, psycopg, SQLAlchemy, redis-py, boto3), finds calls with no timeout using Ruff S113 and pylint W3101, and proves each timeout fires with a test against a non-responding socket.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Path to the Python service repository.
- `timeout_plan` (object[], required): Output of `res-timeout-budget`.

---

## Outputs

- `timeout_changes` (object[]): One row per client: dependency name, file:line changed, library, setting written (exact keyword and value), test name that proves it fires, and the test command output line.

---

## Phase 1: Find Every Call Without a Timeout

### Entry Criteria
- `timeout_plan` rows exist with `per_try_timeout_ms`.
- The test suite runs green before any change: run the project's test command (for example `pytest -q`) and save the summary line.

### Actions
1. Run `ruff check --select S113 .` (flake8-bandit rule: requests call without timeout). Save the list.
2. Run `pylint --disable=all --enable=missing-timeout <package>` (W3101, covers `requests` calls). Save the list.
3. These linters only know `requests`. For other libraries run `rg -n "httpx\.(Client|AsyncClient)\(|aiohttp\.ClientSession\(|insecure_channel|secure_channel|create_engine\(|psycopg\.connect|asyncpg\.(connect|create_pool)|redis\.(Redis|from_url)\(|boto3\.client\(" --type py` and open every hit.
4. For each hit record the library default from this table (verify against the docs of the pinned version):

| Library | Setting | Documented default |
|---|---|---|
| requests | `timeout=(connect, read)` per call | none: waits indefinitely |
| httpx | `httpx.Timeout(timeout, connect=, read=, write=, pool=)` | 5 seconds for each phase |
| aiohttp | `aiohttp.ClientTimeout(total=, connect=, sock_connect=, sock_read=)` | `total` 300 seconds |
| grpcio | `timeout=` seconds per stub call | none |
| psycopg 3 / psycopg2 | `connect_timeout` (seconds, conninfo), `options='-c statement_timeout=<ms>'` | none |
| SQLAlchemy | `create_engine(pool_timeout=)` (wait for a pool slot) | 30 seconds |
| redis-py | `socket_connect_timeout=`, `socket_timeout=` | None (blocking) |
| boto3 / botocore | `botocore.config.Config(connect_timeout=, read_timeout=)` | 60 seconds each |

### Output
A list of every client and call site with its current effective timeout.

### Quality Gate
- `ruff check --select S113 .` output saved, and every reported line is in the list.
- Every client from `timeout_plan` has a row.

---

## Phase 2: Set Timeouts at the Client, One Dependency at a Time

### Entry Criteria
- List exists.

### Actions
1. Work on ONE dependency per change. Edit only the file that builds its client. Run the tests after each dependency. Do NOT edit many files in one pass.
2. Convert milliseconds to seconds for every Python library above (all take seconds; psycopg `statement_timeout` is the exception and takes milliseconds by default in PostgreSQL).
3. Set the value at client construction so every call inherits it:
   - requests: wrap in a `requests.Session` subclass or a helper that passes `timeout=(connect_s, read_s)` on every call. `requests` has no session-level timeout attribute; setting `session.timeout = 5` does nothing.
   - httpx: `httpx.Client(timeout=httpx.Timeout(read_s, connect=connect_s))`. Leave `pool=` at the library default unless the plan gives one.
   - aiohttp: `aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=per_try_s, sock_connect=connect_s))`.
   - grpcio: pass `timeout=per_try_s` on each stub call; when serving a request, use `min(per_try_s, context.time_remaining())`.
   - psycopg: `psycopg.connect(conninfo, connect_timeout=connect_s, options=f"-c statement_timeout={per_try_ms}")`. For SQLAlchemy: `create_engine(url, connect_args={"connect_timeout": connect_s, "options": f"-c statement_timeout={per_try_ms}"})`.
   - redis-py: `redis.Redis.from_url(url, socket_connect_timeout=connect_s, socket_timeout=per_try_s)`.
   - boto3: `boto3.client("sqs", config=Config(connect_timeout=connect_s, read_timeout=per_try_s, retries={"mode": "standard", "max_attempts": <from retry_policy or 1>}))`.
4. If `connect_timeout_ms` in the plan is "open question", leave the connect setting at the library default and record that in `timeout_changes`; do not invent one.
5. Wrap the whole inbound handler in the remaining deadline when the framework allows it: in asyncio code `async with asyncio.timeout(remaining_s):` (Python 3.11+) or `asyncio.wait_for(...)` on older versions.

### Output
Edited client constructors, one commit-sized change per dependency.

### Quality Gate
- `ruff check --select S113 .` prints no findings.
- The test suite still passes after each dependency change (same pass count as the baseline or higher).

---

## Phase 3: Prove Each Timeout Fires

### Entry Criteria
- Timeouts set.

### Actions
1. For each dependency, add a test that points the client at a socket that accepts but never answers:
   ```python
   import socket, threading, time, pytest, httpx

   @pytest.fixture
   def blackhole():
       s = socket.socket(); s.bind(("127.0.0.1", 0)); s.listen(1)
       conns = []
       t = threading.Thread(target=lambda: conns.append(s.accept()), daemon=True); t.start()
       yield f"http://127.0.0.1:{s.getsockname()[1]}"
       s.close()

   def test_payments_read_timeout(blackhole):
       client = build_payments_client(base_url=blackhole)   # the real factory from the codebase
       start = time.monotonic()
       with pytest.raises(httpx.ReadTimeout):
           client.get("/health")
       assert time.monotonic() - start < PLAN_PER_TRY_S + 1.0
   ```
2. Use the real client factory from the code. Do NOT construct a fresh client in the test with the timeout typed again; that proves nothing about production code.
3. Expected exceptions: requests `requests.exceptions.ReadTimeout` / `ConnectTimeout`, httpx `httpx.ReadTimeout` / `httpx.ConnectTimeout`, aiohttp `asyncio.TimeoutError` (aiohttp 3.10+ raises `aiohttp.ServerTimeoutError`/`ConnectionTimeoutError`, both subclasses of `asyncio.TimeoutError`), grpc `grpc.RpcError` with `code() == grpc.StatusCode.DEADLINE_EXCEEDED`, redis `redis.exceptions.TimeoutError`, psycopg `psycopg.errors.QueryCanceled` for statement timeout (test with `SELECT pg_sleep(<seconds above timeout>)`).
4. Run `pytest -q -k timeout` and save the output line per test.

### Output
`timeout_changes` with test names and output lines.

### Quality Gate
- Every changed dependency has a test that raises the library's timeout exception, and `pytest -q -k timeout` reports all passed.
- No existing test was deleted, skipped, or loosened (compare `pytest --collect-only -q | tail -1` before and after: the count did not drop).

---

## Worked Example

Illustrative. Plan row: `payments` per-try 750 ms, connect "open question"; `redis` per-try 25 ms, connect 10 ms.

Phase 1: `ruff check --select S113 .` prints `checkout/clients/legacy.py:40:12: S113 Probable use of requests call without timeout`. `rg` finds `httpx.AsyncClient(base_url=settings.PAYMENTS_URL)` with no timeout (effective 5 s default).

Phase 2 edit in `checkout/clients/payments.py:14`:
```python
httpx.AsyncClient(base_url=settings.PAYMENTS_URL, timeout=httpx.Timeout(0.75, connect=5.0))
```
Connect kept at the httpx default of 5.0 seconds, written out explicitly, and recorded as "connect: open question". `checkout/cache.py:8` becomes `redis.Redis.from_url(settings.REDIS_URL, socket_connect_timeout=0.01, socket_timeout=0.025)`.

Phase 3: `pytest -q -k timeout` prints `3 passed in 2.41s`. Collected test count 412 before and 415 after.

---

## Exit Criteria

DONE when every Python client has an explicit timeout from the plan, Ruff S113 is clean, and a test per dependency proves the timeout raises within the planned time.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Baseline tests fail before any change | **Stop**: report the failing tests; do not start timeout work on a red suite. |
| Phase 2 | Client is created inside a third-party SDK with no timeout parameter | **Adjust**: check the SDK docs for a session or transport argument (for example passing an `httpx.Client`); if none exists, wrap the call in `asyncio.timeout` or a thread with `concurrent.futures` `result(timeout=)` and record it. |
| Phase 3 | Timeout test hangs | **Retry**: run with `pytest --timeout=<seconds>` (pytest-timeout plugin) to find which client ignores the setting, then fix that constructor. |
| Phase 3 | A test fails after the change | **Adjust**: the old code relied on a longer wait; check the plan value against the test, never raise the timeout to make a test pass without updating the plan. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

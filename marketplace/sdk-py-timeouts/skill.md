# SDK Python Timeouts

**One-line description:** Sets explicit connect, read, write and pool timeouts for a Python SDK on httpx, requests or urllib3 (each has different defaults, and requests has none), exposes a per-call override, maps timeout exceptions to the SDK's timeout error, and proves each timeout fires against a slow local server.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): SDK repository root.
- `timeout_budget` (object, required): User-supplied timeout values in seconds: `connect`, `read`, and optionally `write`, `pool`, and an overall per-call deadline. These are product decisions; this flow does not pick them.

---

## Outputs

- `py_timeout_config` (object): HTTP library in use, the timeout object and values applied, where they are set, the per-call override parameter, the exception mapping, and test results.

---

## Phase 1: Identify the Library and Its Default

### Entry Criteria
- `timeout_budget` has at least `connect` and `read`.

### Actions
1. Find the HTTP library: `grep -rhoE "^(import|from) (httpx|requests|urllib3|aiohttp)" acme_client/ | sort | uniq -c`.
2. Read the default from this table and record it:

| Library | Default if you pass nothing | Timeout object |
|---|---|---|
| httpx | 5 seconds for each of connect, read, write, pool | `httpx.Timeout(read_value, connect=c, read=r, write=w, pool=p)` |
| requests | No timeout: a stalled server blocks forever | `timeout=(connect, read)` tuple on every call; a `Session` has no default timeout setting |
| urllib3 (used by openapi-generator python) | No timeout unless configured | `urllib3.Timeout(connect=c, read=r)`; generated methods accept `_request_timeout` as a number or a `(connect, read)` tuple |
| aiohttp | `ClientTimeout(total=300)` in current versions; check the installed version's docs | `aiohttp.ClientTimeout(total=, connect=, sock_connect=, sock_read=)` |

3. Note what read timeout means: it is the maximum gap between bytes, not the total response time. A server trickling bytes can exceed any total you expect. If `timeout_budget` has an overall deadline, it needs a separate mechanism (Phase 2 Action 4).

### Output
Library and default recorded.

### Quality Gate
- The grep output names exactly one primary library, or each library is listed with where it is used.

---

## Phase 2: Apply Timeouts

### Entry Criteria
- Library known.

### Actions
1. Set the client-level default from `timeout_budget` in the one place the client is constructed:
   - httpx: `httpx.Client(timeout=httpx.Timeout(r, connect=c, read=r, write=w, pool=p))`.
   - requests: wrap all calls in one `_request()` method that always passes `timeout=(c, r)`. Then grep proves no call skips it: `grep -rnE "requests\.(get|post|put|patch|delete|request)\(|session\.(get|post|put|patch|delete|request)\(" acme_client/` must show only that method.
   - openapi-generator urllib3: set the default by passing `_request_timeout=(c, r)` from your facade on every call, since the generated `Configuration` has no global timeout field in many versions; confirm by grepping the generated `rest.py` for `timeout`.
2. Add a per-call override: keyword-only `timeout: float | httpx.Timeout | None = None` on facade methods; `None` means use the client default. Do NOT accept `0` to mean "no timeout"; use an explicit sentinel if unlimited must be supported.
3. Map exceptions to the SDK error hierarchy:

| Library exception | SDK error |
|---|---|
| `httpx.ConnectTimeout`, `httpx.ReadTimeout`, `httpx.WriteTimeout`, `httpx.PoolTimeout` (all subclass `httpx.TimeoutException`) | `APITimeoutError` |
| `requests.exceptions.ConnectTimeout`, `requests.exceptions.ReadTimeout` (both subclass `requests.exceptions.Timeout`) | `APITimeoutError` |
| `urllib3.exceptions.ConnectTimeoutError`, `urllib3.exceptions.ReadTimeoutError` (may arrive wrapped in `MaxRetryError`; check `.reason`) | `APITimeoutError` |

   Raise with `raise APITimeoutError(...) from exc` so the cause is kept.
4. Overall deadline (if in `timeout_budget`): for async code use `asyncio.timeout(seconds)` (Python 3.11 or later) around the whole call including retries; for sync code, check the elapsed time with `time.monotonic()` before each retry attempt and stop when the budget is spent.

### Output
Timeouts applied.

### Quality Gate
- `mypy acme_client` reports no new errors.
- For requests, the grep in Action 1 shows a single call site.

---

## Phase 3: Prove Each Timeout Fires

### Entry Criteria
- Timeouts applied.

### Actions
1. Read timeout test: start a local server that accepts and then sleeps longer than the read timeout before responding (`pytest-httpserver` with a handler that calls `time.sleep`, or `http.server` in a thread). Use a tiny read timeout in the test (for example 0.2 s). Assert `APITimeoutError` is raised and the elapsed time is below the sleep time.
2. Connect timeout test: connecting to a non-routable address such as `10.255.255.1` usually hangs until the connect timeout, but behavior depends on the network. If it returns "network unreachable" immediately on your machine, mark the test as environment-dependent and skip it with a reason instead of faking a pass.
3. Override test: client default read timeout large, per-call override tiny; assert the override fires.
4. Run `pytest tests/test_timeouts.py -q`.

### Output
`py_timeout_config`.

### Quality Gate
- The read-timeout and override tests pass.
- Mutation check: remove the timeout argument; the read-timeout test must now fail or hang until the pytest-timeout plugin's limit (`pytest --timeout=<seconds>` when `pytest-timeout` is installed); restore.

---

## Worked Example

Illustrative only. httpx client, `timeout_budget = { connect: 5, read: 30, write: 30, pool: 5 }`.

```python
self._http = httpx.Client(timeout=httpx.Timeout(30.0, connect=5.0, read=30.0, write=30.0, pool=5.0))
```
```
$ pytest tests/test_timeouts.py -q
..s                                                          [100%]
2 passed, 1 skipped in 0.62s
SKIPPED [1] tests/test_timeouts.py:41: 10.255.255.1 returns ENETUNREACH on this host
```

---

## Exit Criteria

DONE when every request path carries the user's timeout values, a per-call override exists, every library timeout exception maps to `APITimeoutError` with its cause, and tests prove the read timeout and override fire.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `timeout_budget` missing values | **Stop**: ask the user; do not copy a default from another SDK. |
| Phase 2 | Generated code ignores `_request_timeout` on some path | **Adjust**: route those calls through the facade; record the generated method. |
| Phase 3 | Read-timeout test hangs | **Adjust**: the timeout is not applied on that path; add `pytest-timeout` to stop the run and trace the call site. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

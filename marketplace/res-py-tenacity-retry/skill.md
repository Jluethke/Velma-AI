# Python Retries With Tenacity, Full Jitter and a Retry Budget

**One-line description:** Implements the retry policy in Python with tenacity (wait_random_exponential for full jitter, stop_after_attempt, exception and status predicates, Retry-After support), a thread-safe retry budget, and removal of duplicate retry layers, then proves attempt counts with respx or responses mocks.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Path to the Python service repository.
- `retry_policy` (object[], required): Output of `res-retry-policy`.

---

## Outputs

- `retry_changes` (object[]): One row per dependency: wrapper file:line, the tenacity arguments written, layers removed (file:line), budget parameters, test names, and the `pytest` output line.

---

## Phase 1: Remove Duplicate Retry Layers

### Entry Criteria
- `retry_policy` rows with `owning_layer` and `layers_to_disable`.
- Baseline `pytest -q` summary saved.

### Actions
1. For each `layers_to_disable` entry, open the file:line and remove only that retry loop or decorator. Keep the call itself.
2. If the owning layer is botocore, set it explicitly: `Config(retries={"mode": "standard", "max_attempts": <max_attempts>})`. In botocore `max_attempts` counts the first call. Remove any app loop around it.
3. If the owning layer is a mesh, make sure the app does NOT retry: for `requests` with an `HTTPAdapter`, set `max_retries=0`; for `httpx` leave `HTTPTransport(retries=0)` (the default; httpx `retries` only covers connect errors anyway).
4. Do NOT remove a retry that the policy did not list. Run `pytest -q` after each removal.

### Output
Duplicate layers removed.

### Quality Gate
- `rg -n "@retry|Retrying\(|AsyncRetrying\(|Retry\(|for attempt in" <changed files>` shows only the owning layer's retry.
- `pytest -q` passes after each removal.

---

## Phase 2: Write One Wrapper per Dependency

### Entry Criteria
- `tenacity` is installed (`python -c "import tenacity, sys; print(tenacity.__version__ if hasattr(tenacity,'__version__') else 'ok')"` succeeds; check the installed version against the tenacity docs).

### Actions
1. Create the retry predicate from `retry_on` exactly. Example for httpx:
   ```python
   import httpx
   from tenacity import retry, stop_after_attempt, wait_random_exponential, retry_if_exception, before_sleep_log

   RETRY_STATUS = {502, 503, 504, 408, 429}

   class RetryableStatus(Exception):
       def __init__(self, response): self.response = response

   def _retryable(exc: BaseException) -> bool:
       if isinstance(exc, (httpx.ConnectError, httpx.ConnectTimeout)):
           return True                        # request never sent
       if isinstance(exc, httpx.ReadTimeout):
           return OPERATION_IDEMPOTENT        # from retry_policy
       if isinstance(exc, RetryableStatus):
           return True
       return False
   ```
2. Implement `Retry-After` as a custom wait that falls back to full jitter. tenacity accepts any callable that takes `retry_state` and returns seconds:
   ```python
   _jitter = wait_random_exponential(multiplier=BASE_S, max=CAP_S)  # full jitter: uniform(0, min(max, multiplier * 2**n))

   def wait_policy(retry_state):
       exc = retry_state.outcome.exception()
       if isinstance(exc, RetryableStatus):
           ra = exc.response.headers.get("Retry-After")
           if ra and ra.isdigit():
               return float(ra)
       return _jitter(retry_state)
   ```
   `Retry-After` may also be an HTTP date (RFC 9110 section 10.2.3); parse it with `email.utils.parsedate_to_datetime` if the dependency sends dates.
3. Decorate the single call function:
   ```python
   @retry(stop=stop_after_attempt(MAX_ATTEMPTS), wait=wait_policy, retry=retry_if_exception(_retryable),
          before_sleep=before_sleep_log(log, logging.WARNING), reraise=True)
   async def charge(client, body, key):
       r = await client.post("/charge", json=body, headers={"Idempotency-Key": key})
       if r.status_code in RETRY_STATUS:
           raise RetryableStatus(r)
       r.raise_for_status()
       return r.json()
   ```
   tenacity's `retry` works on `async def` functions directly. `stop_after_attempt(n)` counts the first call, so `MAX_ATTEMPTS` equals `retry_policy.max_attempts`.
4. Set `reraise=True` so callers see the original exception, not `tenacity.RetryError`.
5. Generate the idempotency key ONCE outside the decorated function and pass it in. A key generated inside is new on every attempt and defeats deduplication.
6. Do NOT use `wait_exponential` without jitter; synchronized retries from many clients arrive together.

### Output
One wrapper function per dependency.

### Quality Gate
- `rg -n "wait_exponential\(" <package>` shows no hits in changed wrappers (only `wait_random_exponential` or the custom wait).
- Each wrapper's `stop_after_attempt` value equals `retry_policy.max_attempts` (list both side by side in `retry_changes`).

---

## Phase 3: Add the Retry Budget and Prove Behavior

### Entry Criteria
- Wrappers written.

### Actions
1. Add a budget with the policy's parameters (token bucket: each first attempt deposits `ratio` tokens, each retry withdraws 1):
   ```python
   import threading
   class RetryBudget:
       def __init__(self, ratio: float, max_tokens: float):
           self._ratio, self._max, self._tokens, self._lock = ratio, max_tokens, max_tokens, threading.Lock()
       def on_request(self):
           with self._lock: self._tokens = min(self._max, self._tokens + self._ratio)
       def try_retry(self) -> bool:
           with self._lock:
               if self._tokens >= 1: self._tokens -= 1; return True
               return False
   ```
   Call `on_request()` once per logical call and add `and BUDGET.try_retry()` at the end of `_retryable`. `ratio` and `max_tokens` come from `retry_policy.budget`; write their source in a comment.
2. Write tests with `respx` (httpx) or `responses` (requests). Remove the sleep in tests with `charge.retry_with(wait=wait_none())`:
   ```python
   @respx.mock
   async def test_charge_retries_503_then_succeeds():
       route = respx.post("https://payments.test/charge").mock(side_effect=[httpx.Response(503), httpx.Response(200, json={"ok": True})])
       await charge.retry_with(wait=wait_none())(client, body, "k1")
       assert route.call_count == 2
       assert route.calls[0].request.headers["Idempotency-Key"] == route.calls[1].request.headers["Idempotency-Key"]

   @respx.mock
   async def test_charge_never_retries_400():
       route = respx.post("https://payments.test/charge").mock(return_value=httpx.Response(400))
       with pytest.raises(httpx.HTTPStatusError):
           await charge.retry_with(wait=wait_none())(client, body, "k1")
       assert route.call_count == 1
   ```
3. Add one test per row of `never_retry_on`, one that exhausts `max_attempts` (call_count equals `max_attempts`), one where the budget is empty (call_count 1), and one unit test for the wait: call `wait_policy` with a fake retry state 1000 times and assert every value is between 0 and `min(CAP_S, BASE_S * 2**n)`.
4. Run `pytest -q -k "retry or budget"` and save output.

### Output
`retry_changes` with budget and tests.

### Quality Gate
- Tests assert exact `call_count` for success-after-retry, exhaustion, every never-retry code, and empty budget; all pass.
- The collected test count did not drop (`pytest --collect-only -q | tail -1` before and after).

---

## Worked Example

Illustrative. Policy for `payments`: `max_attempts` 2, base 100 ms, cap 1000 ms, budget ratio 0.2 and max 10 (user input), owning layer app wrapper; `layers_to_disable`: `checkout/clients/payments.py:40` (manual `for attempt in range(3)` loop).

Phase 1 deletes the loop at line 40, keeping the inner `client.post`. `pytest -q` prints `412 passed`.

Phase 2 writes `@retry(stop=stop_after_attempt(2), wait=wait_policy, retry=retry_if_exception(_retryable), reraise=True)` with `wait_random_exponential(multiplier=0.1, max=1.0)`.

Phase 3: `pytest -q -k "retry or budget"` prints `7 passed in 0.38s`; total now `419 passed`.

---

## Exit Criteria

DONE when each dependency has one tenacity wrapper matching its policy, duplicate retry layers are gone, a retry budget gates retries, and tests prove exact attempt counts.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Removing a loop breaks a test that expected 3 attempts | **Adjust**: update that test to the policy's attempt count and note it; do not keep the duplicate layer. |
| Phase 2 | `retry_with` not available in the installed tenacity | **Adjust**: check the tenacity changelog for the version; patch `time.sleep`/`asyncio.sleep` in the test instead. |
| Phase 3 | Test shows retries on a 400 | **Stop**: the predicate is wrong; fix `_retryable` before anything else. |
| Phase 3 | Budget parameters have no source | **Return**: ask the user; do not choose them. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

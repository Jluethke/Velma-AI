# Python Circuit Breaker With pybreaker

**One-line description:** Implements the breaker policy in Python with pybreaker (fail_max, reset_timeout, exclude predicates for 4xx, listeners for state-change metrics, optional CircuitRedisStorage for multi-worker state), places it inside the retry wrapper, and proves open, reject, half-open and close transitions in tests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Path to the Python service.
- `breaker_policy` (object[], required): Output of `res-breaker-policy`.

---

## Outputs

- `breaker_changes` (object[]): One row per dependency: file:line of the breaker, constructor arguments, listener and metric names, storage choice, gaps between policy and library, test names, and the `pytest` output line.

---

## Phase 1: Check Fit and Install

### Entry Criteria
- Baseline `pytest -q` passes.

### Actions
1. pybreaker trips on consecutive failures (`fail_max`). It has no failure-rate window and no slow-call rule. For each policy row with `window.type` = time or a `failure_rate_threshold`, record a gap: "rate-based policy not expressible in pybreaker" and return it as an open question (options: accept consecutive counting with the user's `fail_max`, or use a different library). Do NOT emulate a rate window by guessing a `fail_max`.
2. Check whether the call path is `async def`. pybreaker's `call_async` historically depends on Tornado; read the README for the installed version (`pip show pybreaker`). If asyncio is not supported by the installed version, record it and stop for that dependency. Do NOT decorate a coroutine function with the sync decorator: it counts creating the coroutine, not awaiting it, so failures are never seen.
3. Process model: gunicorn or uvicorn with several workers gives each worker its own breaker. If the policy needs shared state, use `pybreaker.CircuitRedisStorage(pybreaker.STATE_CLOSED, redis_client, namespace=<name>)`; the redis client must be created with `decode_responses=False` per pybreaker docs. Otherwise record "per-process breaker".
4. `pip install pybreaker` (or add to the dependency file) and record the version.

### Output
Fit decisions, gaps, and storage choice per dependency.

### Quality Gate
- Every policy row has either a supported mapping or a recorded gap.
- `python -c "import pybreaker; print(pybreaker.CircuitBreaker)"` runs without error.

---

## Phase 2: Create the Breaker and Wire It

### Entry Criteria
- Fit confirmed for at least one dependency.

### Actions
1. One module-level breaker per dependency (never one per request):
   ```python
   import pybreaker, httpx
   from prometheus_client import Counter, Gauge

   BREAKER_STATE = Gauge("breaker_open", "1 when the breaker is open", ["name"])
   BREAKER_TRANSITIONS = Counter("breaker_transitions_total", "state changes", ["name", "to"])

   class Metrics(pybreaker.CircuitBreakerListener):
       def state_change(self, cb, old_state, new_state):
           BREAKER_TRANSITIONS.labels(cb.name, new_state.name).inc()
           BREAKER_STATE.labels(cb.name).set(1 if new_state.name == "open" else 0)

   def _is_client_error(exc):                 # never_counts: 4xx
       return isinstance(exc, httpx.HTTPStatusError) and 400 <= exc.response.status_code < 500

   payments_breaker = pybreaker.CircuitBreaker(
       fail_max=FAIL_MAX, reset_timeout=RESET_TIMEOUT_S, name="payments",
       exclude=[_is_client_error], listeners=[Metrics()])
   ```
   `exclude` accepts exception types and callables that return True for exceptions that must not count. Check the installed docs for listener method signatures before relying on `new_state.name`.
2. Apply the breaker to the single call function, and put the retry wrapper OUTSIDE it:
   ```python
   @retry(...)                       # from res-py-tenacity-retry
   def charge(body, key):
       return payments_breaker.call(_charge_once, body, key)
   ```
3. Add `pybreaker.CircuitBreakerError` to the tenacity predicate's never-retry list.
4. When the breaker opens, the tripping call may raise `CircuitBreakerError` instead of the original error depending on version (see the `throw_new_error_on_trip` argument in newer releases). Handle both in the caller.
5. Map `CircuitBreakerError` at the HTTP boundary to the policy's `open_error` response (for example 503 with `Retry-After` set to the remaining open time, or the fallback).
6. Change one dependency per edit; run `pytest -q` after each.

### Output
Breakers wired with metrics.

### Quality Gate
- `rg -n "pybreaker.CircuitBreaker\(" <package>` shows one construction per dependency at module level.
- In every wrapper, the retry decorator is above (outside) the breaker call (show the lines).

---

## Phase 3: Prove the State Machine

### Entry Criteria
- Breakers wired.

### Actions
1. Make `reset_timeout` injectable (a factory or settings value) so tests can use a small value.
2. Tests:
   ```python
   def test_opens_after_fail_max_and_rejects_without_calling(monkeypatch):
       calls = {"n": 0}
       def boom(*a): calls["n"] += 1; raise httpx.ConnectError("x")
       cb = make_payments_breaker(reset_timeout=0.2)
       for _ in range(FAIL_MAX):
           with pytest.raises((httpx.ConnectError, pybreaker.CircuitBreakerError)): cb.call(boom)
       assert cb.current_state == "open"
       with pytest.raises(pybreaker.CircuitBreakerError): cb.call(boom)
       assert calls["n"] == FAIL_MAX                # rejected without calling

   def test_half_open_success_closes():
       cb = make_payments_breaker(reset_timeout=0.2); trip(cb)
       time.sleep(0.25)
       assert cb.call(lambda: "ok") == "ok"
       assert cb.current_state == "closed"

   def test_4xx_does_not_count():
       cb = make_payments_breaker(reset_timeout=60)
       for _ in range(FAIL_MAX + 2):
           with pytest.raises(httpx.HTTPStatusError): cb.call(raise_404)
       assert cb.current_state == "closed"
   ```
3. Add a test that a half-open failure reopens the breaker, and one that `breaker_transitions_total{name="payments",to="open"}` increments (read it with `REGISTRY.get_sample_value`).
4. Run `pytest -q -k breaker` and save output.

### Output
`breaker_changes` with tests.

### Quality Gate
- Tests cover open, reject-without-call, half-open close, half-open reopen, 4xx exclusion, and metric emission; all pass.
- Test count did not drop versus the baseline.

---

## Worked Example

Illustrative. `breaker_policy` for `payments`: consecutive failures, user `fail_max` 5, reset 60 s, multi-worker shared state required. `fraud-score`: time window, 50% rate.

Phase 1: `fraud-score` gap recorded ("rate window not supported by pybreaker"); `payments` uses `CircuitRedisStorage` with the existing redis.

Phase 2: `checkout/clients/payments.py:20` defines `payments_breaker`; `charge()` calls `payments_breaker.call(_charge_once, ...)` inside the tenacity decorator.

Phase 3: `pytest -q -k breaker` prints `6 passed in 0.91s`.

---

## Exit Criteria

DONE when every dependency the policy maps to pybreaker has one module-level breaker with 4xx excluded, metrics on transitions, retry outside it, and tests proving each state transition; every unsupported policy row is returned as a gap.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Async call path, no asyncio support in installed pybreaker | **Return**: record the gap; do not wrap coroutines with the sync decorator. |
| Phase 2 | Redis storage raises decode errors | **Adjust**: create the redis client with `decode_responses=False` as the pybreaker docs require. |
| Phase 3 | Breaker never opens in test | **Adjust**: check `exclude` is not matching the test's exception. |
| Phase 3 | Half-open test flaky | **Adjust**: sleep at least `reset_timeout` plus a margin in the test only; never change production values for a test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

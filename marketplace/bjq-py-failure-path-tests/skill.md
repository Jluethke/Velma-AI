# Python Job Failure-Path Tests

**One-line description:** Writes pytest tests for the failure paths of Celery or RQ jobs (retryable error triggers a retry with the policy's countdown, permanent error does not retry, duplicate delivery has one effect, invalid payload is rejected, time limit is handled) using a real worker fixture or a burst worker instead of `task_always_eager`, which skips serialization and broker behavior.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root with the test suite.
- `queue_choice` (string, required): `celery` or `rq`.
- `retry_policy` (object[], required): Output of `bjq-retry-backoff-jitter-policy`; gives the error classes and delays to assert.
- `idempotency_design` (object, required): Output of `bjq-idempotency-key-store`; gives the duplicate-effect assertion per job.

---

## Outputs

- `py_failure_tests` (object[]): Per job: test file path, test names for each failure path F1 to F5, and the passing pytest output.

---

## Phase 1: Choose the Harness

### Entry Criteria
- `pytest --version` runs in the project environment.

### Actions
1. Pick the harness from this table:

| `queue_choice` | Unit level (fast) | Integration level (real path) |
|---|---|---|
| celery | Call the task body with `task.run(...)` (runs the function without the broker) and patch external clients | `celery.contrib.pytest` fixtures: `celery_app`, `celery_worker` (an embedded worker thread), `celery_config` returning `{"broker_url": "memory://", "result_backend": "cache+memory://"}` or a Redis container URL; register the plugin with `pytest_plugins = ("celery.contrib.pytest",)` in `conftest.py` |
| rq | Call the job function directly | `fakeredis.FakeStrictRedis()` (package `fakeredis`) or a Redis container, `Queue(connection=conn)`, then `SimpleWorker([q], connection=conn).work(burst=True)` to process in the test process |

2. Do not rely on `task_always_eager = True` for failure tests. Eager mode runs the task in the caller, skips the serializer (so non-JSON arguments pass), and does not exercise acks or broker redelivery. Use it only if existing tests already depend on it, and add integration tests next to them.
3. Keep tests in one new file per job (`tests/jobs/test_<job>_failures.py`). Do not edit unrelated test files.

### Output
Harness choice and test file paths.

### Quality Gate
- `conftest.py` registers the Celery pytest plugin or a fakeredis fixture (cite file:line).

---

## Phase 2: Write the Five Failure Tests

### Entry Criteria
- Harness ready.

### Actions
1. Write these tests per job, one at a time, running each before writing the next:

| Id | Path | Celery assertion | RQ assertion |
|---|---|---|---|
| F1 | Retryable error | Patch the client to raise a retryable error and patch `mock.patch.object(task, "retry", side_effect=celery.exceptions.Retry)`; `with pytest.raises(celery.exceptions.Retry): task.run(payload)`; assert `retry` was called once and, when the task passes `countdown` itself, that it lies in the range from `retry_policy`. With `autoretry_for`, Celery wraps `run` so the same patch applies. | Enqueue with `retry=Retry(max=2, interval=[0, 0])`, run burst worker twice; `job.retries_left` decreased; final status per mock |
| F2 | Permanent error | Patch to raise a permanent error; assert `task.retry` is not called and the error propagates (`pytest.raises`) | `job.get_status() == "failed"` after one run and `job.retries_left` unchanged |
| F3 | Duplicate delivery | Run the task body twice with the same envelope; assert the effect count from `idempotency_design` is 1 | Same, enqueue twice with the same envelope and burst |
| F4 | Invalid payload | Payload with unknown `schema_version`; assert the permanent-failure path (no retry) and a log line or failure record | Same |
| F5 | Time limit | Celery: patch the body to raise `celery.exceptions.SoftTimeLimitExceeded`; assert cleanup ran and the task re-raised or returned the documented result | RQ: run with `job_timeout=1` against a body that sleeps longer; status `failed` with a timeout in `exc_info` (only with a real worker that forks; `SimpleWorker` enforces timeouts with a signal-based death penalty on Unix, check your version) |

2. For jittered delays, assert the countdown is within `[0, min(cap, base * 2**n)]`, never an exact number. Celery exposes its calculation as `celery.utils.time.get_exponential_backoff_interval(factor, retries, maximum, full_jitter)`; call it with `full_jitter=False` to get the upper bound.
3. Patch at the place the job looks the name up (`mock.patch("billing.tasks.stripe_client")`, not `mock.patch("stripe_client")`).
4. Never assert on log text that the code does not control (library log formats change).

### Output
Test files.

### Quality Gate
- Each job has five tests named `test_f1_...` to `test_f5_...` (`pytest --collect-only -q tests/jobs | rg "test_f[1-5]"`).

---

## Phase 3: Prove the Tests Catch Breakage

### Entry Criteria
- Five tests per job pass.

### Actions
1. Mutation check, one at a time, on a local branch: (a) remove the permanent error from the permanent list, or add it to `autoretry_for`: F2 must fail; (b) remove the idempotency claim: F3 must fail; (c) remove schema validation: F4 must fail. Revert each change with `git checkout -- <file>` after observing the failure.
2. A test that still passes after its mutation is not testing the path. Fix the test, not the code.
3. Run the full suite: `pytest -q`. Do not skip, xfail or delete tests to get green.

### Output
`py_failure_tests` with outputs.

### Quality Gate
- Each mutation produced a failing test (output pasted), and `git status --porcelain` shows the code reverted afterwards.
- Final `pytest -q` exits 0.

---

## Worked Example

Illustrative only.

Input: `queue_choice` = `celery`, job `charge_order`; `retry_policy`: `stripe.error.APIConnectionError` retryable (base 2, cap 300), `stripe.error.CardError` permanent.

```python
def test_f2_card_error_not_retried():
    with mock.patch("billing.tasks.stripe") as s, mock.patch.object(charge_order, "retry") as r:
        s.PaymentIntent.create.side_effect = stripe.error.CardError("declined", None, "card_declined")
        with pytest.raises(stripe.error.CardError):
            charge_order.run(ENVELOPE)
        r.assert_not_called()
```
```
$ pytest -q tests/jobs/test_charge_order_failures.py
.....                                                     [100%]
5 passed in 0.62s
```
Mutation (a): adding `CardError` to `autoretry_for` makes `test_f2_card_error_not_retried` fail with `AssertionError: Expected 'retry' to not have been called`; reverted.

---

## Exit Criteria

DONE when each job has five passing failure-path tests on a non-eager harness or with a stated reason, each test was shown to fail under its mutation, and the full suite passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `celery_worker` fixture hangs | **Adjust**: set `celery_config` to `memory://` broker and `cache+memory://` backend and confirm the task module is imported in `celery_includes`. |
| Phase 2 | Task body cannot be called without the broker | **Adjust**: extract the body into a plain function the task calls; test the function and keep one integration test for the wrapper. |
| Phase 3 | Mutation does not fail any test | **Retry**: strengthen the assertion and rerun the mutation. |
| Phase 3 | Existing tests fail | **Stop**: report them; do not modify or skip them without the owner's approval. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

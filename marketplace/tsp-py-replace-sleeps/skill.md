# Pytest Sleep Replacement

**One-line description:** Removes real waiting from Python tests by fixing each sleep at its source (patching an injected or module-level `sleep`, `tenacity` `retry_with(wait=wait_none())`, `threading.Event` or condition polling for background work, `freezegun` or `time-machine` for clock reads) while proving with a mutation check that each test still fails when the code is broken.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `hotspot_plan` (object, required): From `tsp-hotspot-classify`; items with cause `sleep` and their `file:line` evidence.

---

## Outputs

- `py_sleep_fixes` (object): One row per item: test id, sleep kind from the decision table, technique used, commit SHA, test seconds before and after, mutation check result, and full-suite pass result after the change.

---

## Phase 1: Classify Each Sleep

### Entry Criteria
- `hotspot_plan` has at least one `todo` item with cause `sleep`.

### Actions
1. For each item, open the evidence line and decide where the sleep lives and why, with this table:

| Where the sleep is | What it waits for | Kind |
|---|---|---|
| Production code, inside retry or backoff (`time.sleep(delay)` in a loop) | Nothing real; the delay is policy | `prod_backoff` |
| Production code via `tenacity` `@retry(wait=...)` | Same | `tenacity_wait` |
| Test code, after starting a thread, process, or async task | A side effect to appear | `wait_for_effect` |
| Test code or prod code comparing `time.time()`, `datetime.now()`, `time.monotonic()` against an expiry or TTL | Wall clock to pass | `clock_read` |
| `asyncio.sleep` inside a test | An async task to progress | `async_wait` |

2. Record the kind on the item. One item at a time from here on.

### Output
Kind per item.

### Quality Gate
- Every item has one kind and the line number of the sleep call.

---

## Phase 2: Apply One Fix

### Entry Criteria
- One item selected; full suite is green at HEAD.

### Actions
1. Time the item's test before the change: `pytest <nodeid> --durations=0 -q -p no:randomly`. Record the `call` seconds.
2. Apply the technique for the kind. Change only the test file and, where the table says so, one fixture. Do NOT edit more than one item per commit.

| Kind | Technique |
|---|---|
| `prod_backoff` | Patch the name the module uses. If the module does `import time`, use `monkeypatch.setattr(<module>.time, "sleep", fake_sleep)`; this replaces `time.sleep` process-wide for the test and is undone after it. If it does `from time import sleep`, use `monkeypatch.setattr(<module>, "sleep", fake_sleep)`. `fake_sleep` appends its argument to a list, and the test asserts the list (for example `[1, 2, 4]`), so the backoff schedule is still checked. |
| `tenacity_wait` | Call `func.retry_with(wait=tenacity.wait_none())(*args)` in the test, or patch the wrapped function's sleep as documented by tenacity for your installed version (`pip show tenacity`, then the tenacity docs). Assert attempt count through `func.retry.statistics["attempt_number"]` only if your version documents it. |
| `wait_for_effect` | Replace `time.sleep(n)` with a wait on the real signal: a `threading.Event` the code sets, `queue.get(timeout=n)`, `future.result(timeout=n)`, or a polling helper `wait_until(predicate, timeout=n)` that checks every short interval and raises on timeout. Keep the old `n` as the timeout so a slow machine fails the same way as before; it now returns as soon as the effect appears. |
| `clock_read` | Freeze and move time: `freezegun` `with freeze_time("2024-01-01") as frozen: ... frozen.tick(timedelta(seconds=61))`, or the `time_machine` pytest fixture `time_machine.move_to(...)` and `time_machine.shift(...)`. Check which clock the code reads: confirm in the library docs that the chosen library patches that function (`time.monotonic` support differs between the two). |
| `async_wait` | Await the real completion: `await asyncio.wait_for(task, timeout=n)` or an `asyncio.Event`. Do not shrink `asyncio.sleep(1)` to `asyncio.sleep(0.01)`; that is still a race. |

3. Do NOT lower a sleep value as the fix. Smaller sleeps make tests flaky on slow CI machines.
4. Do NOT delete assertions or the test. Do NOT add `@pytest.mark.skip` or `@pytest.mark.flaky`.

### Output
One-item change in the working tree.

### Quality Gate
- `git diff --stat` shows the test file and at most one fixture file changed.
- `grep -n "time.sleep\|asyncio.sleep" <test file>` no longer shows the removed call at the item's line.

---

## Phase 3: Prove and Commit

### Entry Criteria
- Change applied.

### Actions
1. Run the test: `pytest <nodeid> --durations=0 -q -p no:randomly`. Record `call` seconds.
2. Mutation check: break the behavior the test covers in production code in one obvious way (for example change `max_attempts = 3` to `1`, or remove the line that sets the event), run the test, and confirm it FAILS. Revert the mutation with `git checkout -- <prod file>`. If the test passes with the mutation, the fix removed the assertion's power; revert the whole change and redo Phase 2.
3. Run the full suite with the baseline command. It must pass.
4. Commit only the test change: `git commit -m "test: replace sleep in <nodeid> with <technique>"`.
5. Record the row in `py_sleep_fixes` and set the item status to `done`.

### Output
Row in `py_sleep_fixes`.

### Quality Gate
- The mutation run output shows `1 failed`; the reverted run shows `1 passed`.
- Full suite output ends with `passed` and no `failed`.
- `git diff HEAD~1 --stat` shows no production file changed.

---

## Worked Example

Illustrative. Item: `tests/notify/test_email.py::test_retry_backoff`, `shop/notify/retry.py:22` `time.sleep(delay)` with `import time`, 6.02 s.

- Phase 1: kind `prod_backoff`.
- Phase 2: test now has
  `calls = []`
  `monkeypatch.setattr(retry.time, "sleep", calls.append)`
  `send_with_retry(msg)`
  `assert calls == [1, 2, 3]`
- Phase 3: `0.01s call`. Mutation `max_attempts = 1` makes it fail with `assert [] == [1, 2, 3]`; reverted, it passes. Full suite `412 passed`. Commit `test: replace sleep in test_retry_backoff with patched sleep`.

---

## Exit Criteria

DONE when every `sleep` item in `hotspot_plan` is `done` with a committed one-item change, a failing mutation run, a passing full suite, and before and after seconds in `py_sleep_fixes`, or is recorded as not fixable with the reason.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Sleep is in a third-party library | **Adjust**: patch the library's documented hook or the name it imports; if none exists, record the item as `not fixable here`. |
| Phase 2 | Test becomes flaky after replacing a sleep with a wait | **Retry**: the predicate waits on the wrong signal; wait on the state the assertion reads. |
| Phase 3 | Mutation does not make the test fail | **Stop**: revert the change; the test no longer checks the behavior. |
| Phase 3 | Full suite fails in another test | **Return**: revert the commit candidate; a patched global leaked (missing `monkeypatch` cleanup or a module-level patch). Use `monkeypatch` or `with mock.patch(...)` only. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

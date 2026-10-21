# Python Async Wait Fix

**One-line description:** Replaces fixed sleeps and unsynchronized background work in a flaky Python test with explicit completion signals (asyncio events, `asyncio.wait_for`, `threading.Event`, joined threads), deadline-bounded polling, and auto-waiting assertions in Playwright or Selenium, configured for the installed pytest-asyncio mode.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_cause_evidence` (object, required): From `flk-classify-root-cause`; names the suspect lines.
- `flake_class` (string, required): Must be `timing` or `race`.
- `baseline_command` (string, required): Command that reproduces the flake.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `py_async_fix_diff` (string): Unified diff of the change (`git diff`), with a note per hunk naming the wait it replaced.

---

## Phase 1: Locate Every Unsynchronized Wait

### Entry Criteria
- `flake_class` is `timing` or `race`. Otherwise emit an empty `py_async_fix_diff` and stop.

### Actions
1. In the test and its fixtures, list every line matching: `grep -n -E "time\.sleep|asyncio\.sleep|\.sleep\(|threading\.Thread|create_task|ensure_future|run_in_executor|ThreadPoolExecutor|subprocess\.Popen" <test files> <conftest.py files>`.
2. For each match, write what it waits for: "sleep 0.5 so the worker consumes the queue", "task created and never awaited", "thread started, not joined".
3. Read pytest-asyncio settings: `grep -n -E "asyncio_mode|asyncio_default_fixture_loop_scope" pytest.ini pyproject.toml setup.cfg tox.ini 2>/dev/null` and `python -m pip show pytest-asyncio` for the version. In `strict` mode (the default) async tests need `@pytest.mark.asyncio` and async fixtures need `@pytest_asyncio.fixture`; in `auto` mode both are picked up. An async test the plugin does not pick up never runs its body: pytest reports `async def functions are not natively supported` and skips it or (newer pytest) fails it. Read the pytest output for that line.
4. If the test drives a browser, identify the library (Playwright `page.`, Selenium `driver.`).

### Output
A list of wait sites, each with what it waits for.

### Quality Gate
- Every `sleep` in the test path is listed with its purpose.

---

## Phase 2: Replace Each Wait With A Signal

### Entry Criteria
- Wait sites listed.

### Actions
1. Edit one wait site at a time, then run the test once before the next. Never rewrite the whole file.
2. Use this replacement table:

| Waiting for | Replace with |
|---|---|
| asyncio task to finish | `await task` or `await asyncio.wait_for(task, timeout=<existing timeout>)` |
| async event from code under test | Have the code set an `asyncio.Event` (or expose a future); test does `await asyncio.wait_for(event.wait(), timeout=<existing timeout>)` |
| Background thread to finish | `thread.join(timeout=<existing>)` then `assert not thread.is_alive()` |
| Thread to reach a point | `threading.Event` set by the thread; `assert ready.wait(timeout=<existing>)` (returns False on timeout) |
| Queue consumer done | `queue.join()` (with `task_done()` in the consumer) or `await asyncio_queue.join()` |
| Executor work | `future.result(timeout=<existing>)` |
| Condition with no hook (external process, file appears) | Poll: `deadline = time.monotonic() + <existing>; while not cond(): assert time.monotonic() < deadline, "<what>"; time.sleep(<poll interval already in the code or a few milliseconds>)` |
| Playwright element state | `expect(page.get_by_role("button", name="Pay")).to_be_enabled()`; `expect(...)` retries until its timeout. Remove `page.wait_for_timeout(...)`. |
| Selenium element state | `WebDriverWait(driver, <existing>).until(EC.element_to_be_clickable((By.ID, "pay")))`; remove `time.sleep` and do not raise `implicitly_wait` |

3. Timeout values: reuse the number already in the test (the old sleep is a lower bound the author accepted) or the suite's existing timeout constant. The deadline only limits how long a failure takes; on the passing path the wait returns as soon as the condition holds. Do not invent a new number.
4. Use `time.monotonic()`, never `time.time()`, for deadlines; wall-clock time can jump.
5. Never "fix" by increasing a sleep. A longer sleep lowers the rate and keeps the bug.
6. For `race` class in product code: the fix is in product code (a lock, an awaited task, an atomic queue). Add the synchronization in product code and keep the test's assertion unchanged.

### Output
Edited test (and product code if `race`).

### Quality Gate
- `grep -n -E "time\.sleep|asyncio\.sleep|wait_for_timeout" <test file>` shows no remaining sleep used as a wait, or each remaining one is inside a deadline poll loop.
- The edited test passes once: `python -m pytest "<test_id>" -q` exit code 0.

---

## Phase 3: Check Async Hygiene And Produce The Diff

### Entry Criteria
- Waits replaced.

### Actions
1. Run with warnings as errors for never-awaited coroutines and asyncio debug: `PYTHONASYNCIODEBUG=1 python -m pytest "<test_id>" -W error::RuntimeWarning -q`. `RuntimeWarning: coroutine '...' was never awaited` now fails the test; fix by awaiting.
2. Run the test file, not only the test, once: `python -m pytest <test file> -q`.
3. Produce the diff: `git -C <repo_path> diff > flk-py-async.diff`, paste into `py_async_fix_diff`, then delete the file.
4. Do NOT run verification here; `flk-verify-same-count` reruns `baseline_command` unchanged.

### Output
`py_async_fix_diff`.

### Quality Gate
- Step 1 command exits 0.
- `git diff --stat` lists only files that contain a wait site from Phase 1 (or product files for `race`).

---

## Worked Example

Illustrative. `tests/worker/test_email_queue.py::test_sends_receipt`, class `timing`, pytest-asyncio 0.24, `asyncio_mode = auto`.

- Phase 1: `await asyncio.sleep(0.2)  # let worker drain` after `queue.put(job)`; `asyncio.create_task(worker.run())` never awaited.
- Phase 2: `await asyncio.wait_for(queue.join(), timeout=2)` (2 seconds is the suite's existing `QUEUE_TIMEOUT`); worker task cancelled and awaited in fixture teardown.
- Phase 3: `PYTHONASYNCIODEBUG=1 python -m pytest tests/worker/test_email_queue.py::test_sends_receipt -W error::RuntimeWarning -q` prints `1 passed`. Diff: 1 file, 6 insertions, 3 deletions.

---

## Exit Criteria

DONE when every listed wait is replaced by a signal or deadline poll, the hygiene run exits 0, and the diff touches only the listed sites.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `flake_class` not timing or race | **Return**: empty diff. |
| Phase 2 | Code under test exposes no hook to wait on | **Adjust**: add the smallest hook in product code (return the task, set an event) and say so in the diff note. |
| Phase 2 | Test fails after replacement | **Adjust**: the wait now exposes the real ordering bug; read the failure, do not restore the sleep. |
| Phase 3 | `ScopeMismatch` or "attached to a different loop" errors | **Adjust**: align fixture and test loop scope (`loop_scope` in pytest-asyncio 0.24+); check the pytest-asyncio docs for your version. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

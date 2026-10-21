# Python asyncio Cancellation and Task Lifetime Audit

**One-line description:** Audits asyncio code for swallowed `CancelledError`, lost task references, unsupervised `gather`, unsafe cleanup in `finally`, timeouts that leave work running, and shutdown that never cancels tasks, and writes a test that cancels each operation mid-flight.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the project root.
- `py_asyncio_debug_findings` (object[], required): From `race-py-asyncio-debug`; `task-destroyed-pending` and `exception-never-retrieved` rows point at sites to audit first.

---

## Outputs

- `py_cancellation_findings` (object[]): One row per defect: `location` (file:line), `pattern` (from the audit table), `evidence` (grep line, ruff line, or cancellation test result), `fix_direction`.

---

## Phase 1: Static Audit

### Entry Criteria
- The project uses asyncio tasks or timeouts (`rg -n "create_task|ensure_future|gather|wait_for|timeout|TaskGroup" --type py` finds hits).

### Actions
1. Run each search and inspect each hit against the table. Python version matters: run `python -V` first.

| Search | Pattern | Why it is a defect | Fix direction |
|---|---|---|---|
| `rg -n "except\s*:" --type py` and `rg -n "except BaseException" --type py` inside `async def` | Swallowed cancel | `CancelledError` derives from `BaseException` since Python 3.8; a bare `except` or `except BaseException` that does not re-raise stops cancellation | Re-raise: `except asyncio.CancelledError: <cleanup>; raise` |
| `rg -n "except (asyncio\.)?CancelledError" --type py` | Cancel caught without `raise` | Same; the task reports success while its caller expected it to stop | Add `raise` at the end of the handler |
| `rg -n "^\s*asyncio\.create_task\(|^\s*asyncio\.ensure_future\(|^\s*loop\.create_task\(" --type py` | Fire-and-forget task | The asyncio docs state the loop keeps only weak references to tasks; a task with no saved reference can be garbage-collected mid-execution | Keep tasks in a set and `discard` in `add_done_callback`, or use `asyncio.TaskGroup` (3.11+) |
| `rg -n "asyncio\.gather\(" --type py` | Unsupervised gather | When one awaitable raises, `gather` propagates the first exception but does not cancel the others; they keep running | `asyncio.TaskGroup` (3.11+), or cancel the remaining tasks in an `except` |
| `rg -n "finally:" --type py` inside `async def` followed by `await` | Cleanup can be cancelled again | An `await` in `finally` after cancellation can itself be interrupted by a second cancel | Keep cleanup short; use `asyncio.shield()` only for cleanup that must finish, and still re-raise |
| `rg -n "wait_for\(|asyncio\.timeout\(" --type py` | Timeout semantics | `wait_for` cancels the inner awaitable on timeout and waits for it to finish cancelling; if the inner code swallows cancel, the timeout never fires | Fix the swallowing first; on 3.11+ prefer `async with asyncio.timeout(s):` |
| `rg -n "run_until_complete|loop\.close\(|signal" --type py` | Shutdown | Closing the loop with tasks pending gives `Task was destroyed but it is pending!` | Cancel `asyncio.all_tasks()` except the current task, then `await asyncio.gather(*tasks, return_exceptions=True)`; or use `asyncio.run`, which does this |

2. Run `ruff check --select RUF006 "<repo_path>"` if ruff is present (`RUF006`: store a reference to the return value of `asyncio.create_task`; confirm with `ruff rule RUF006`).
3. Add every `task-destroyed-pending` and `exception-never-retrieved` row from the input as a finding with the matching pattern.

### Output
Static findings list.

### Quality Gate
- Each search command was run and its output saved.
- Each finding names one table row and a file:line.

---

## Phase 2: Cancellation Test for Each Operation

### Entry Criteria
- Static findings exist, or the user asks to prove cancellation behavior.

### Actions
1. For each public coroutine that owns a finding, write one test (pytest with `pytest-asyncio` `@pytest.mark.asyncio`, or `anyio`) of this shape:
   ```
   async def test_cancel_mid_flight():
       started = asyncio.Event()
       task = asyncio.create_task(op_under_test(on_start=started.set))
       await started.wait()          # the operation is now inside its critical section
       task.cancel()
       with pytest.raises(asyncio.CancelledError):
           await task
       assert resource_released()    # lock free, connection returned, temp file gone
       assert not partial_state()    # no half-written row, no counter off by one
   ```
   If the coroutine has no hook to signal it started, gate on an observable step (a fake dependency whose method sets the event). Do not use `asyncio.sleep(<n>)` to guess timing.
2. Add a test that the operation finishes cleanly under `async with asyncio.timeout(<small user value>)` (3.11+) or `asyncio.wait_for`, asserting `TimeoutError` is raised (on 3.11+ `asyncio.TimeoutError` is an alias of the builtin `TimeoutError`).
3. Run the tests with debug mode on: `PYTHONASYNCIODEBUG=1 python -X dev -m pytest <test file> -q`. A swallowed cancel shows as `Failed: DID NOT RAISE <class 'asyncio.exceptions.CancelledError'>`.
4. Do not change production code here. Record each failing test as evidence on its finding.

### Output
`py_cancellation_findings` with test evidence.

### Quality Gate
- Every cancellation test uses an event or fake dependency for timing (`rg -n "asyncio\.sleep\(" <test file>` shows no timing guesses).
- Each finding's evidence is a grep line or a copied test failure message.

---

## Worked Example

Illustrative only.

Phase 1: `rg -n "except\s*:" app/` prints `app/worker.py:88:        except:` inside `async def consume()`, followed by `log.exception("consume failed")` and `continue`. Pattern "Swallowed cancel". `ruff check --select RUF006 app/` prints `app/server.py:40:5: RUF006 Store a reference to the return value of asyncio.create_task`.

Phase 2: `test_cancel_consume` cancels after the fake queue delivers one message. Output: `Failed: DID NOT RAISE <class 'asyncio.exceptions.CancelledError'>`; the loop logged the cancel and kept consuming. Findings: `worker.py:88` (fix: `except Exception:` plus a separate `except asyncio.CancelledError: raise`), `server.py:40` (fix: keep a task set).

---

## Exit Criteria

DONE when every table search ran, every hit is a finding or dismissed with a reason, and each affected public coroutine has a cancellation test whose result is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Python older than 3.8 | **Adjust**: `CancelledError` is an `Exception` subclass there, so `except Exception` also swallows it; add those hits. |
| Phase 1 | Python older than 3.11 (no `TaskGroup`, no `asyncio.timeout`) | **Adjust**: use explicit task sets and `wait_for`, or the `anyio` task groups if the project depends on anyio. |
| Phase 2 | Operation cannot be gated | **Adjust**: inject a fake dependency through the constructor or a pytest fixture; do not add test-only branches to production code. |
| Phase 2 | Test hangs after `task.cancel()` | **Return**: that is the finding (cancel swallowed in a loop); record it and stop the test with pytest-timeout. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

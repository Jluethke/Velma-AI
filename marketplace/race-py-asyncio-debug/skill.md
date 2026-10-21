# Python asyncio Debug Mode Sweep

**One-line description:** Runs the asyncio code under asyncio debug mode and Python development mode with tracemalloc, turns `never awaited` warnings into errors, and collects every slow-callback, missing-await, destroyed-pending-task and unretrieved-exception message with its source location.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the project root.
- `stress_command` (string, required): From `race-stress-harness`; a pytest command for an asyncio harness.

---

## Outputs

- `py_asyncio_debug_findings` (object[]): One row per message: `message_kind` (`slow-callback`, `never-awaited`, `task-destroyed-pending`, `exception-never-retrieved`, `non-threadsafe-call`, `unclosed-resource`), `location` (file:line from the message or tracemalloc trace), `duration_seconds` (slow callbacks), `raw_line`.

---

## Phase 1: Enable Debug Mode

### Entry Criteria
- The code under test uses `asyncio` (`rg -n "async def|asyncio\." <repo_path>` finds hits).

### Actions
1. Enable all three switches, documented in the Python `asyncio` "Developing with asyncio" page and the `-X dev` docs:
   - `PYTHONASYNCIODEBUG=1` (or `asyncio.run(main(), debug=True)`, or `-X dev`, which turns on asyncio debug mode),
   - `PYTHONTRACEMALLOC=20` so warnings show where the coroutine object was created (20 is the number of frames to keep; any positive number works),
   - `-W error::RuntimeWarning` so `coroutine '...' was never awaited` fails the test instead of scrolling past.
2. Turn on the asyncio logger at DEBUG so slow-callback messages appear: in `conftest.py` add `logging.getLogger("asyncio").setLevel(logging.DEBUG)` and run pytest with `-o log_cli=true --log-cli-level=DEBUG`, or `logging.basicConfig(level=logging.DEBUG)` for a script.
3. Note the slow-callback threshold: `loop.slow_callback_duration` defaults to 0.1 seconds per the docs. Keep the default unless the user gives a latency budget; then set it at startup with `asyncio.get_running_loop().slow_callback_duration = <user value>`.
4. Full command for pytest with pytest-asyncio or anyio:
   `PYTHONASYNCIODEBUG=1 PYTHONTRACEMALLOC=20 python -X dev -W error::RuntimeWarning -m pytest "<nodeid>" -o log_cli=true --log-cli-level=DEBUG > /tmp/aiodebug.txt 2>&1`

### Output
Saved debug run output.

### Quality Gate
- The saved command line contains `PYTHONASYNCIODEBUG=1` or `-X dev`.
- `/tmp/aiodebug.txt` contains the pytest summary line.

---

## Phase 2: Collect and Classify Messages

### Entry Criteria
- Debug output saved.

### Actions
1. Search the output with these literal patterns and classify:

| `grep` pattern | `message_kind` | Meaning |
|---|---|---|
| `Executing <` and `took` | slow-callback | A callback or task step ran longer than `slow_callback_duration` without yielding; something blocked the loop |
| `was never awaited` | never-awaited | A coroutine was created and discarded; the work never ran |
| `Task was destroyed but it is pending` | task-destroyed-pending | A task was garbage-collected or the loop closed while it ran; often a lost `create_task` reference |
| `Task exception was never retrieved` | exception-never-retrieved | A task failed and nobody awaited it or called `.exception()` |
| `Non-thread-safe operation invoked on an event loop other than the current one` | non-threadsafe-call | Loop method called from another thread; use `loop.call_soon_threadsafe` or `asyncio.run_coroutine_threadsafe` |
| `ResourceWarning: unclosed` | unclosed-resource | Transport, socket or client session never closed |

2. For each match, pull the location: slow-callback lines name the task and coroutine with `running at <file>:<line>`; never-awaited lines are followed, with tracemalloc on, by `Coroutine created at (most recent call last)` and frames. Record the deepest in-repo frame.
3. For slow-callback, record the reported seconds and the coroutine. The cause is found in `race-py-asyncio-blocking`.
4. For never-awaited, open the line. Usual forms: `session.close()` instead of `await session.close()`, `asyncio.sleep(1)` without `await`, calling an `async def` function from sync code, passing a coroutine function where a callback expects a regular function.
5. Static cross-check, if `ruff` is available: `ruff check --select RUF006 <repo_path>` flags `asyncio.create_task` results that are not stored (a documented cause of tasks disappearing), and `ruff check --select ASYNC <repo_path>` flags blocking calls in `async def`. Confirm rule codes with `ruff rule <code>` before citing them.

### Output
`py_asyncio_debug_findings`.

### Quality Gate
- Each row's `raw_line` is found verbatim in `/tmp/aiodebug.txt` (`grep -F`), or in the ruff output for static rows.
- Each row has an in-repo `location`, or a note that the frame is inside a named library.

---

## Worked Example

Illustrative only.

Command per Phase 1 on `tests/test_ingest.py::test_ingest_many`.

Output excerpts:
```
WARNING  asyncio:base_events.py Executing <Task pending name='Task-7' coro=<ingest_one() running at app/ingest.py:58> wait_for=<Future pending ...>> took 1.204 seconds
E   RuntimeWarning: coroutine 'Queue.put' was never awaited
Coroutine created at (most recent call last)
  File "app/ingest.py", line 71, in producer
    q.put(item)
```
Rows: slow-callback at `app/ingest.py:58`, 1.204 s; never-awaited at `app/ingest.py:71` (`q.put(item)` on an `asyncio.Queue` must be `await q.put(item)`).

---

## Exit Criteria

DONE when the harness ran with debug mode, tracemalloc and RuntimeWarning-as-error, and every matching message is a classified row with a location.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `-W error::RuntimeWarning` breaks on an unrelated library warning | **Adjust**: narrow the filter with `-W "error:coroutine .* was never awaited:RuntimeWarning"` and record the library warning separately. |
| Phase 1 | No slow-callback lines though latency is high | **Retry**: confirm the `asyncio` logger level is DEBUG and debug mode is on (`asyncio.get_running_loop().get_debug()` returns True). |
| Phase 2 | Location points into a framework (aiohttp, FastAPI) | **Adjust**: walk the tracemalloc frames up to the first in-repo frame. |
| Phase 2 | No messages at all | **Return**: record a clean debug run; continue with `race-py-asyncio-cancellation` and the interleaving checks, since debug mode does not catch logic races across `await`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

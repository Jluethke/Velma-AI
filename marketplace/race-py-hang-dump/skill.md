# Python Hang Dump With py-spy and faulthandler

**One-line description:** Captures every thread's stack (and asyncio tasks) from a hung Python process using `py-spy dump`, `faulthandler` and `asyncio` task introspection, then identifies the lock, queue, join or awaited future each thread is stuck on.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the project root.
- `stress_command` (string, required): From `race-stress-harness`.
- `failure_class` (string, required): From `race-symptom-triage`; this flow applies to `deadlock`, `livelock`, `goroutine-or-thread-leak` and `cancellation-bug` (shutdown hangs).

---

## Outputs

- `py_hang_report` (object): `dump_files`, `threads` (name, state idle or active, top in-repo frame, blocking call), `tasks` (asyncio task name, coroutine, awaited object), `wait_for_graph`, `classification` (`lock-cycle`, `join-never-returns`, `queue-get-no-producer`, `lock-held-across-blocking-io`, `pending-task-never-done`, `spin`).

---

## Phase 1: Capture Stacks

### Entry Criteria
- `failure_class` is one of the classes listed above.

### Actions
1. Pick a capture method with this table:

| Situation | Method |
|---|---|
| Hang inside pytest | `pip install pytest-timeout`, run `stress_command` with `--timeout=<user max seconds> --timeout-method=thread`; it prints all thread stacks before failing the test |
| Process you can restart | Start it with `python -X faulthandler ...` and register a signal: `faulthandler.register(signal.SIGUSR1, all_threads=True)` at startup; then `kill -USR1 <pid>` prints every thread's traceback to stderr (Linux/macOS) |
| Self-timed dump without signals (also Windows) | `faulthandler.dump_traceback_later(<seconds>, repeat=False, exit=False)` at the start of the operation; cancel with `faulthandler.cancel_dump_traceback_later()` if it finishes |
| Process already hung, cannot restart | `pip install py-spy`, then `py-spy dump --pid <pid>`; add `--locals` to see local variables and `--native` to include C frames |

2. py-spy needs ptrace permission on Linux: run with `sudo`, or in Docker add `--cap-add SYS_PTRACE`. On macOS it needs `sudo`.
3. Take a second capture after the operation should have finished. Same frames in both captures means stuck.
4. If the program is asyncio-based, also capture task state. Add a debug hook in the program (or a test) that prints `for t in asyncio.all_tasks(): t.print_stack()` from inside the loop, for example via a signal handler installed with `loop.add_signal_handler(signal.SIGUSR2, ...)` on Linux/macOS. On Python 3.14, also check the official docs for `python -m asyncio ps <pid>` and `python -m asyncio pstree <pid>`, which list tasks of a running process.

### Output
Two thread dumps (and task dumps for asyncio) saved to files.

### Quality Gate
- Each dump contains at least one `Thread` header (py-spy prints `Thread 0x... (idle): "MainThread"`; faulthandler prints `Thread 0x... (most recent call first):`).
- Two captures with timestamps exist.

---

## Phase 2: Identify What Each Thread Waits On

### Entry Criteria
- Dumps saved.

### Actions
1. For each thread, find the top frame and match it:

| Top frames | Blocking call | Next check |
|---|---|---|
| `acquire (threading.py)` or `__enter__` of a `Lock`/`RLock` | Waiting for a lock | Which thread is inside a `with lock:` block for that lock |
| `wait (threading.py)` under `Condition.wait` or `Event.wait` | Waiting for notify or set | Is any thread able to call `notify`/`set` |
| `get (queue.py)` | `queue.Queue.get()` with no timeout | Is a producer alive; was a sentinel sent for shutdown |
| `join (threading.py)` | `thread.join()` | Is the joined thread itself stuck |
| `result (concurrent/futures/_base.py)` | `future.result()` | Is the executor full of tasks that each wait on other tasks (pool starvation) |
| socket, `ssl`, `select`, DB driver frames while a lock is held | Blocking I/O under a lock | Every other thread waiting for that lock |
| `run_forever`, `_run_once`, `select` in an event loop thread | Loop idle | Look at tasks, not threads |

2. Build `wait_for_graph`: for each lock wait, find the holder by locating a thread whose stack shows a frame inside the `with <lock>:` block for the same lock object (match by the variable name in the source line; with `--locals`, match by object address). An edge is "thread A holds L1, waits L2". A closed loop is `lock-cycle`.
3. A thread waiting on its own `threading.Lock` a second time is a self-deadlock: `Lock` is not reentrant. The fix direction is `RLock` or restructuring; record it.
4. For asyncio tasks, a task pending forever on `Future` or `Event.wait()` with no setter is `pending-task-never-done`.

### Output
`py_hang_report`.

### Quality Gate
- Every stuck thread has a blocking call from the table, or is marked `spin` because it is active in both captures with changing frames.
- A `lock-cycle` lists at least two edges closing the loop, each with file:line.

---

## Worked Example

Illustrative only.

`sudo py-spy dump --pid 31877`:
```
Thread 0x7F2A1C5FF640 (idle): "worker-1"
    acquire (threading.py:...)
    transfer (bank/ledger.py:44)
Thread 0x7F2A1BDFE640 (idle): "worker-2"
    acquire (threading.py:...)
    transfer (bank/ledger.py:44)
```
Source line 43: `with src.lock:`; line 44: `with dst.lock:`. With `--locals`, worker-1 has `src=<Account 1>`, `dst=<Account 2>`; worker-2 has `src=<Account 2>`, `dst=<Account 1>`. Edges: worker-1 holds A1 waits A2; worker-2 holds A2 waits A1. Classification `lock-cycle`; hand to `race-lock-ordering`.

---

## Exit Criteria

DONE when stacks for every thread (and tasks for asyncio) were captured twice, each stuck thread has a named blocking call, and the hang has a classification with file:line evidence.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Permission denied` from py-spy | **Adjust**: rerun with `sudo`, or add `SYS_PTRACE` to the container. |
| Phase 1 | Windows, no `SIGUSR1` | **Adjust**: use `faulthandler.dump_traceback_later` or `py-spy dump`, which works on Windows. |
| Phase 2 | All threads idle in the event loop | **Adjust**: capture asyncio tasks; the hang is an awaited future, not a thread lock. |
| Phase 2 | Holder of a lock not found | **Adjust**: the lock was acquired with `.acquire()` and never released on an exception path; search `rg -n "\.acquire\(" <files>` and check each has a `finally: release()`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

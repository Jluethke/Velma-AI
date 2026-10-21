# Python Threading Race Exposure

**One-line description:** Exposes races in Python threaded code that the GIL does not prevent (read-modify-write, check-then-act on dicts, iteration during mutation, non-thread-safe clients) by shrinking the interpreter switch interval, running on the free-threaded build when available, and mapping each failure to the exact unguarded statement.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the project root.
- `stress_command` (string, required): From `race-stress-harness`; a pytest command for the harness.
- `shared_state_inventory` (object[], required): From `race-shared-state-inventory`.

---

## Outputs

- `py_thread_findings` (object[]): One row per finding: `statement` (file:line and the source text), `pattern` (from the pattern table), `evidence` (failing assertion, exception text, or count from a run), `interpreter` (`python -VV` output and whether it is free-threaded), `switch_interval`.

---

## Phase 1: Mark Non-Atomic Statements

### Entry Criteria
- Inventory rows with `stack` = python and guard `NONE` or `INCONSISTENT` exist.

### Actions
1. For each write site in those rows, open the line and match it against this table:

| Pattern | Example | Why the GIL does not help |
|---|---|---|
| Read-modify-write | `self.count += 1`, `d[k] = d.get(k, 0) + 1` | Compiles to several bytecodes; a thread switch between load and store loses an update |
| Check-then-act | `if k not in cache: cache[k] = build()` | Two threads both see "missing" and both build |
| Iterate while another thread mutates | `for x in shared_list:` with `append` elsewhere | `RuntimeError: dictionary changed size during iteration` or skipped items |
| Lazy singleton | `if _client is None: _client = Client()` | Two clients created; one leaks connections |
| Non-thread-safe object shared | one `requests.Session`, one `sqlite3` connection, one DB cursor across threads | The library does not document thread safety for that object |
| Mutable default argument | `def f(acc=[])` called from threads | One list shared by every call |

2. Use the disassembler to show a statement is several steps when it is unclear: `python -c "import dis; dis.dis('x.count += 1')"` prints separate `LOAD_ATTR`, `BINARY_OP`, `STORE_ATTR` instructions (names vary by version).
3. For `sqlite3`, note that `check_same_thread=False` only disables the check; it does not make sharing safe without your own lock.

### Output
List of candidate statements with a pattern.

### Quality Gate
- Every candidate names exactly one table row.
- Every candidate is a file:line inside `repo_path`.

---

## Phase 2: Amplify and Run

### Entry Criteria
- Candidate list exists.

### Actions
1. Record the interpreter: `python -VV`. If it reports a free-threaded build (the version string contains `experimental free-threading build`, available from Python 3.13 per PEP 703), note it. Check `python -c "import sys; print(sys._is_gil_enabled())"` on 3.13 and later; `False` means no GIL and races show far more often.
2. Add a fixture to the harness test module that shrinks the switch interval during the test and restores it after:
   ```
   import sys, pytest
   @pytest.fixture(autouse=True)
   def fast_switch():
       old = sys.getswitchinterval()
       sys.setswitchinterval(1e-6)
       yield
       sys.setswitchinterval(old)
   ```
   The documented default switch interval is 0.005 seconds; smaller values make the interpreter hand the GIL to another thread more often.
3. Run `stress_command` and save output. Then, if a free-threaded interpreter is installed (`python3.13t` or later), create a venv with it and run the same command again. Record both results separately.
4. For hangs during the run, add pytest-timeout and run with `--timeout=<user max seconds> --timeout-method=thread`; on expiry it dumps every thread's stack. Hand that dump to `race-py-hang-dump`.
5. Do not add `time.sleep` to production code to widen the window. If the race still does not show, add a temporary `time.sleep(0)` only in a test-local monkeypatch of the function, and remove it in the same session.

### Output
Saved runs for each interpreter and switch interval.

### Quality Gate
- The saved output of each run includes the pytest summary line (`passed`, `failed`).
- `sys.setswitchinterval` is restored in the fixture (`rg -n "setswitchinterval\(old\)" <test file>` finds it).

---

## Phase 3: Tie Failures to Statements

### Entry Criteria
- Runs saved.

### Actions
1. For each failing run, read the assertion or exception and its traceback. Match the deepest in-repo frame to a candidate statement.
2. A wrong final count with no traceback maps to the read-modify-write or check-then-act candidate that writes that value.
3. Confirm by a minimal guard experiment in a scratch copy, never in the committed tree: wrap only that statement in `with lock:` using one `threading.Lock()` and rerun `stress_command`. If the failure count drops to zero over the same number of runs, the statement is confirmed. Then discard the experiment (`git stash` or `git checkout -- <file>`); the real fix happens in `race-apply-fix`.
4. Record each finding.

### Output
`py_thread_findings`.

### Quality Gate
- Every finding cites a run output file and line.
- The guard experiment, if done, is reverted: `git -C "<repo_path>" status --porcelain` shows no change to production files.

---

## Worked Example

Illustrative only.

Inventory row `_counts` in `app/metrics.py:21`: `_counts[k] = _counts.get(k, 0) + 1`, pattern read-modify-write.

Phase 2: `python -VV` prints `Python 3.12.6`. With the fixture, `python -m pytest tests/test_metrics_stress.py --count=200 -x` prints `1 failed, 41 passed` with `AssertionError: assert 7994 == 8000`.

Phase 3: the assertion checks `_counts["hit"]`; the only writer is line 21. Guard experiment with `with _lock:` around line 21: `200 passed`. Reverted. Finding: `metrics.py:21`, read-modify-write, evidence "7994 != 8000 at run 42", switch interval `1e-06`.

---

## Exit Criteria

DONE when every unguarded write is matched to a pattern, the harness ran with a shortened switch interval (and on a free-threaded build when installed), and each failure is tied to one statement.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Shared object is a C extension object with unknown thread safety | **Adjust**: check its official docs; if not documented as thread-safe, treat it as unsafe. |
| Phase 2 | No failure in any configuration | **Return**: record "not reproduced" with every configuration tried; the statements still match unsafe patterns and stay in the findings. |
| Phase 2 | `sys._is_gil_enabled` missing | **Adjust**: the interpreter is older than 3.13 and has a GIL; record that. |
| Phase 3 | Failure traceback is inside a library | **Adjust**: walk up to the first in-repo frame and record the call that passed shared state to the library. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

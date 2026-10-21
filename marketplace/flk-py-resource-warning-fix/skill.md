# Python Resource Warning Fix

**One-line description:** Turns Python `ResourceWarning` and pytest's unraisable-exception and thread-exception warnings into errors, traces each leaked file, socket, subprocess or thread to the line that allocated it with `tracemalloc`, closes it with a context manager or fixture teardown, and keeps the warnings as errors in config.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_cause_evidence` (object, required): Leak markers (`ResourceWarning: unclosed`, `Too many open files`, `PytestUnraisableExceptionWarning`).
- `flake_class` (string, required): Must be `resource_leak`.
- `baseline_command` (string, required): Reproduction.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `py_leak_fix_diff` (string): Unified diff with a note per hunk naming the resource now closed.

---

## Phase 1: Surface Every Leak With Its Allocation Site

### Entry Criteria
- `flake_class` is `resource_leak`. Otherwise return an empty diff.

### Actions
1. Run the affected tests with leak warnings as errors and allocation tracebacks:
   `PYTHONTRACEMALLOC=25 python -X dev -m pytest <selection> -p no:randomly -W error::ResourceWarning -W error::pytest.PytestUnraisableExceptionWarning -W error::pytest.PytestUnhandledThreadExceptionWarning -q`
   `-X dev` enables Python Development Mode (shows `ResourceWarning`, which is ignored by default). `PYTHONTRACEMALLOC=25` stores 25 frames per allocation so the warning includes `Object allocated at (most recent call last):` with the allocating line.
2. Know the attribution trap: a `ResourceWarning` fires when the object is garbage collected, which can be during a later test. The failing test is often the victim, not the leaker. The `Object allocated at` traceback names the real leaker.
3. For `Too many open files` without warnings, count descriptors around the test on Linux: in a temporary autouse fixture, `before = len(os.listdir(f"/proc/{os.getpid()}/fd"))`, `yield`, `gc.collect()`, `after = ...`, print both. If `psutil` is installed, `psutil.Process().num_fds()` does the same on Unix.
4. Record each leak: type (file, socket, subprocess, thread, event loop, DB connection), allocating file:line, and the test that triggered it.

### Output
Leak list with allocation sites.

### Quality Gate
- Every leak has an allocation file:line copied from an `Object allocated at` traceback or a descriptor count difference tied to one test.

---

## Phase 2: Close Each Resource

### Entry Criteria
- Leak list exists.

### Actions
1. Fix where it is allocated, one leak at a time:

| Leak | Fix |
|---|---|
| `open(...)` without close | `with open(...) as f:` |
| `requests.Session()` / `httpx.Client()` | `with httpx.Client() as c:` or close in fixture teardown after `yield` |
| `socket.socket()` | `with socket.socket(...) as s:` |
| `subprocess.Popen` | `with subprocess.Popen(...) as p:` or `p.wait()` and close pipes; on timeout `p.kill()` then `p.wait()` |
| `threading.Thread` left running | Signal stop (an `Event`) and `join()` in teardown |
| asyncio loop or transports | `asyncio.run(...)`, or close the loop in the fixture that created it; with pytest-asyncio let the plugin own the loop |
| DB connection or engine | `conn.close()` / `engine.dispose()` in fixture teardown |
| `tempfile.NamedTemporaryFile(delete=False)` | Use `tmp_path`, or remove in teardown |

2. Teardown code goes after `yield` in a fixture so it runs when the test fails.
3. If the leak is in product code (a function that opens and never closes), fix product code.
4. Do NOT silence the warning with `filterwarnings = ignore::ResourceWarning`, `warnings.simplefilter("ignore")`, or `-p no:warnings`.

### Output
Closed resources.

### Quality Gate
- The Phase 1 command exits 0.

---

## Phase 3: Keep Leaks Failing And Diff

### Entry Criteria
- Phase 1 command passes.

### Actions
1. Add to the existing pytest config (`pytest.ini` `[pytest]` or `pyproject.toml` `[tool.pytest.ini_options]`), merging with any existing `filterwarnings` list:
   `filterwarnings = error::ResourceWarning` and `error::pytest.PytestUnraisableExceptionWarning`.
   Note: `ResourceWarning` is only emitted when warnings are enabled for it; pytest's warning capture shows it, and `-X dev` in CI makes it reliable.
2. Run the whole suite once with the new config to find other leaks: `python -X dev -m pytest -q`. If unrelated leaks appear, list them in the diff note as follow-ups rather than fixing them all in this change.
3. `git -C <repo_path> diff > flk-pyleak.diff`; copy into `py_leak_fix_diff`; delete it.

### Output
`py_leak_fix_diff`.

### Quality Gate
- Whole-suite run result recorded; the target tests pass with the config in place.

---

## Worked Example

Illustrative. `tests/export/test_csv.py::test_large_export` intermittently fails with `OSError: [Errno 24] Too many open files`.

- Phase 1: the `-X dev` run shows `ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/export-...csv'>` with `Object allocated at: export/writer.py:41 fh = open(path, "w", newline="")`.
- Phase 2: `writer.py` now uses `with open(path, "w", newline="") as fh:`.
- Phase 3: `filterwarnings` extended in `pyproject.toml`; `python -X dev -m pytest -q` prints `530 passed`.

---

## Exit Criteria

DONE when every leak is closed at its allocation site, the warnings-as-errors run passes, and config keeps leaks failing.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `flake_class` not matched | **Return**: empty diff. |
| Phase 1 | No `Object allocated at` lines | **Adjust**: `PYTHONTRACEMALLOC` was not set in the same process; set it in the environment of the pytest command, not in a subshell. |
| Phase 2 | Leak is inside a third-party library | **Adjust**: close the object your code receives; if the library itself leaks, record it with the library version and add a narrow `filterwarnings` for that message only, with a comment. |
| Phase 3 | Whole suite has many unrelated leaks | **Adjust**: scope the rule to the affected test modules with `pytestmark = pytest.mark.filterwarnings("error::ResourceWarning")` at module level, and record the other leaks as follow-ups; do not drop the rule entirely. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

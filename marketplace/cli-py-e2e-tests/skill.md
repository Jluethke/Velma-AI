# Python CLI End-to-End Tests

**One-line description:** Tests the installed Python console script as a real subprocess with pytest (`subprocess.run` with `capture_output`, isolated `HOME`/`XDG_CONFIG_HOME`/`APPDATA`, `tmp_path`), asserting exit codes, stdout and stderr separately, help snapshots, stdin piping, broken pipes and SIGINT, instead of relying only on in-process runners.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cli_spec` (object, required): Commands and flags to cover.
- `exit_code_table` (object[], required): Codes to assert.
- `help_text_snapshot` (string[], required): Snapshot files from `cli-help-usage-text`.
- `stream_contract` (object, required): Stream rules and broken-pipe status.
- `signal_policy` (object, required): SIGINT and SIGTERM statuses.
- `project_dir` (string, required): Root of the Python project.

---

## Outputs

- `e2e_test_files` (string[]): Paths of the test files created.
- `e2e_run_log` (string): Full pytest output of the final run.

---

## Phase 1: Harness

### Entry Criteria
- `stack` == `python`; `pip install -e .` (or `uv pip install -e .`) succeeded in a virtual environment.
- `which logtrim` (or `where logtrim` on Windows) finds the console script inside the virtual environment.

### Actions
1. Create `tests/e2e/conftest.py`:
```python
import os, shutil, subprocess, sys
import pytest

EXE = shutil.which("logtrim")

@pytest.fixture
def run(tmp_path):
    env = {k: v for k, v in os.environ.items() if not k.startswith("LOGTRIM_")}
    env.update(HOME=str(tmp_path), USERPROFILE=str(tmp_path),
               XDG_CONFIG_HOME=str(tmp_path / ".config"), APPDATA=str(tmp_path / "AppData"),
               NO_COLOR="1", COLUMNS="100", PYTHONUTF8="1")
    def _run(*args, input=None, extra_env=None):
        return subprocess.run([EXE, *args], input=input, capture_output=True, text=True,
                              env={**env, **(extra_env or {})}, cwd=tmp_path, timeout=60)
    return _run
```
2. Run the console script (`EXE`), not `python -m`, so the test also proves the `[project.scripts]` entry point works. Keep one test that runs `[sys.executable, "-m", "logtrim", "--version"]` to cover `__main__.py`.
3. Fail fast with a clear message if `EXE` is `None`: `assert EXE, "install the project first: pip install -e ."`.
4. `timeout` is a guard against hangs; pick it from the user's CI limits or keep pytest's own timeout plugin settings. Do not treat the value above as a measured requirement.

### Output
`conftest.py` with the `run` fixture.

### Quality Gate
- `python -m pytest tests/e2e -q --collect-only` collects without errors.

---

## Phase 2: Contract Tests

### Entry Criteria
- Harness exists.

### Actions
1. Create `tests/e2e/test_contract.py` with one test per row:

| Test | Assertion |
|---|---|
| help per command | `r.returncode == 0`, `r.stdout == Path(snapshot).read_text()`, `r.stderr == ""` |
| version | `returncode == 0`, stdout matches `importlib.metadata.version("logtrim")` |
| usage error per command | `returncode == <usage code>`, `r.stdout == ""`, `"--help" in r.stderr` |
| missing file | runtime code, stderr names the file, stdout empty |
| stdin with `-` | `run("stats", "-", input=data).stdout == run("stats", str(f)).stdout` |
| piped stdin, no operand | same as above |
| env var applies | `extra_env={"LOGTRIM_COLOR": "always"}` changes output as specified |
| no traceback ever | `"Traceback" not in r.stderr` for every test (put it in a helper) |

2. Generate the usage-error tests from `cli_spec` with `pytest.mark.parametrize` over the command names, so a new command without a test fails review.
3. Compare help text to the snapshot exactly. If it differs, regenerate the snapshot only by rerunning the capture from `cli-help-usage-text`, never by editing the file.

### Output
Contract tests.

### Quality Gate
- Every command in `cli_spec` appears in the parametrize list (count them).
- Every code in `exit_code_table` except 130, 143 and the broken-pipe status is asserted by at least one test.

---

## Phase 3: Pipes and Signals

### Entry Criteria
- Contract tests pass.

### Actions
1. Broken pipe test (POSIX only):
```python
@pytest.mark.skipif(sys.platform == "win32", reason="POSIX pipes")
def test_broken_pipe(tmp_path):
    big = tmp_path / "big.log"
    big.write_text("".join(f"2024-01-01T00:00:00Z INFO line {i}\n" for i in range(200_000)))
    p = subprocess.Popen([EXE, "trim", "--older-than", "1d", str(big)],
                         stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    p.stdout.readline()
    p.stdout.close()
    err = p.stderr.read().decode()
    assert p.wait(timeout=60) == EXPECTED_PIPE_STATUS   # from stream_contract
    assert "Traceback" not in err and "BrokenPipe" not in err
```
   A process killed by a signal shows as a negative `returncode` in Python (`-13` for SIGPIPE), not 141. Assert the form `stream_contract` describes.
2. SIGINT and SIGTERM tests: use the `Popen` plus ready-marker pattern from `cli-signal-sigint-handling` Phase 3; assert 130 and 143.
3. Run the whole suite: `python -m pytest tests/e2e -q -rA > e2e.txt 2>&1; echo "exit=$?"`. Save `e2e.txt` content as `e2e_run_log`.
4. Optional coverage across subprocesses: coverage.py measures child processes only with its subprocess support configured (see the coverage.py docs, "Measuring subprocesses"). Do not report in-process coverage as e2e coverage.

### Output
`e2e_test_files`, `e2e_run_log`.

### Quality Gate
- `e2e_run_log` ends with a summary showing 0 failed and 0 errors, and `exit=0`.
- Skipped tests are only the POSIX-only ones, each with a reason.

---

## Do Not

- Do not use `shell=True`; quoting differs per OS and hides argument bugs.
- Do not let tests read the developer's real config; the fixture isolates it.
- Do not mark a failing test `xfail` or delete it to get green.

---

## Worked Example

Illustrative.
```
$ python -m pytest tests/e2e -q -rA
....................s.                                    [100%]
PASSED tests/e2e/test_contract.py::test_help[trim]
...
SKIPPED [1] tests/e2e/test_pipes.py:9: POSIX pipes      (Windows run)
21 passed, 1 skipped in 6.84s
```
On Linux the broken-pipe test asserts `returncode == 1` because the tool uses the Python docs recipe (`sys.exit(1)` after `dup2`), as recorded in `stream_contract`.

---

## Exit Criteria

DONE when the installed console script passes contract, pipe and signal tests in an isolated environment, and `e2e_run_log` shows 0 failures.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `EXE` is `None` | **Stop**: install the project in the active virtual environment, then rerun. |
| Phase 2 | Help snapshot mismatch only in width | **Adjust**: confirm `COLUMNS` is passed in `env`. |
| Phase 3 | Broken-pipe test flaky | **Retry**: read one line before closing; confirm the input is large enough that the tool is still writing. |
| Phase 3 | Signal test hangs | **Adjust**: ensure the tool prints the ready marker and flushes stderr. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

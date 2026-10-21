# TDD Unittest Runner Setup

**One-line description:** Sets up the standard library unittest runner with test discovery that actually finds the tests, proves it passes and fails a canary, and records the discover, single-test, failfast and file-watch commands for a project that cannot add pytest.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Root of the Python project.

---

## Outputs

- `runner_config` (object): `start_dir`, `top_level_dir`, `pattern`, `suite_command`, `single_test_command` (template), `failfast_command`, `watch_command`, `python_version`.
- `smoke_result` (object): Exit code and last summary line (`OK` or `FAILED (failures=1)`) for the canary pass run and fail run.

---

## Phase 1: Make Discovery Work

### Entry Criteria
- `project_dir` exists. Python 3.8 or newer (`python --version`).

### Actions
1. Decide the layout and fill `start_dir` and `top_level_dir`:

| Layout | start_dir (`-s`) | top_level_dir (`-t`) |
|---|---|---|
| `mypkg/` and `tests/` side by side at the root | `tests` | `.` |
| `src/mypkg/` and `tests/` | `tests` | `.` and install the package with `python -m pip install -e .` |
| tests inside the package (`mypkg/tests/`) | `mypkg/tests` | `.` |

2. Make sure `tests/__init__.py` exists (an empty file). Discovery imports test files as modules of a package; without it, imports inside tests can fail or the folder is skipped.
3. Keep the default file pattern `test*.py`. Only pass `-p` if the project already uses another pattern such as `*_test.py`.
4. Base command: `python -m unittest discover -s tests -t . -v`.

### Output
Discovery settings filled in `runner_config`.

### Quality Gate
- `tests/__init__.py` exists.
- `python -m unittest discover -s tests -t . -v` runs without `ImportError` (it may report `Ran 0 tests`).

---

## Phase 2: Canary Pass and Fail

### Entry Criteria
- Discovery runs without import errors.

### Actions
1. Create `tests/test_canary.py`:

```python
import unittest


class TestCanary(unittest.TestCase):
    def test_runner_executes_tests(self):
        self.assertEqual(1 + 1, 2)
```

2. Run `python -m unittest discover -s tests -t . -v`. Expect `test_runner_executes_tests ... ok`, `Ran 1 test`, `OK`, exit code 0.
3. Change `2` to `3`. Run again. Expect `FAIL: test_runner_executes_tests`, `AssertionError: 2 != 3`, `FAILED (failures=1)`, exit code 1.
4. Read the summary: `failures=` counts failed assertions; `errors=` counts exceptions that are not assertion failures (for example `NameError`). An error is NOT a valid red in TDD; it means the test itself is broken.
5. Delete `tests/test_canary.py`. Record both runs in `smoke_result`.

### Output
`smoke_result`.

### Quality Gate
- Pass run exit code 0 with `OK`; fail run exit code 1 with `FAILED (failures=1)`.
- `tests/test_canary.py` is deleted.

---

## Phase 3: Selection, Failfast and Watch

### Entry Criteria
- Canary proved pass and fail.

### Actions
1. Record:

| Purpose | Command |
|---|---|
| Full suite | `python -m unittest discover -s tests -t . -v` |
| One test method | `python -m unittest tests.test_user.TestValidate.test_rejects_21_chars -v` (dotted module path, no `.py`) |
| Name substring filter | `python -m unittest discover -s tests -t . -k rejects` (`-k` exists since Python 3.7) |
| Stop at first failure | add `-f` (failfast) |
| Hide stdout of passing tests | add `-b` (buffer) |
| Turn warnings into a visible list | `python -W default -m unittest ...` |

2. Use `self.subTest(case=value)` inside a loop for table cases so one failing case does not hide the others. Each failing sub-test is reported separately.
3. Watch mode: unittest has none. Install `python -m pip install watchfiles` and run the suite command through its CLI; check `watchfiles --help` for how the installed version takes a shell command and the paths to watch (for example `src` and `tests`). If installing packages is not allowed, record `watch_command` as "none" and rerun manually after each save.
4. Do NOT mix `pytest` features (`assert` rewriting, fixtures) into unittest tests; use `self.assert*` methods so failure messages show both values.

### Output
`runner_config`.

### Quality Gate
- The single-test command, run on any existing test, prints `Ran 1 test`.
- `watch_command` is a command shown working once, or "none" with the reason.

---

## Worked Example

Illustrative only. Project `ledger/` with `ledger/` package and `tests/`.

```
$ python -m unittest discover -s tests -t . -v
test_runner_executes_tests (tests.test_canary.TestCanary.test_runner_executes_tests) ... ok
----------------------------------------------------------------------
Ran 1 test in 0.000s

OK
```

After changing the expected value:

```
FAIL: test_runner_executes_tests (tests.test_canary.TestCanary.test_runner_executes_tests)
AssertionError: 2 != 3
FAILED (failures=1)
```

`runner_config.single_test_command` = `python -m unittest tests.{module}.{Class}.{method} -v`.

---

## Exit Criteria

DONE when discovery finds tests without import errors, a canary was seen as `OK` and as `FAILED (failures=1)`, the canary is gone, and the commands are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ModuleNotFoundError: No module named 'mypkg'` | **Adjust**: set `-t .` from the project root, or `python -m pip install -e .` for a src layout. |
| Phase 2 | `Ran 0 tests` | **Retry**: check file name starts with `test`, class subclasses `unittest.TestCase`, method starts with `test`, and `tests/__init__.py` exists. |
| Phase 2 | Fail run shows `errors=1` instead of `failures=1` | **Stop**: the canary has a typo; fix it until the failure is an `AssertionError`. |
| Phase 3 | Single-test path gives `AttributeError: module has no attribute` | **Retry**: copy the dotted name exactly as printed by `-v` output. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

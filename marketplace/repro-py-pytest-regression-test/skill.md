# Python Failing Regression Test with pytest

**One-line description:** Converts the minimal repro into one pytest test that fails today for the reported reason, using `pytest.raises` with `match=`, exact value asserts, `tmp_path` and `monkeypatch` fixtures, and confirms the red run with `pytest -x -vv` before any fix is written.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `minimal_repro` (object, required): Output of `repro-ddmin-minimize`.
- `minimal_input` (object, required): Output of `repro-ddmin-minimize`.
- `repo_path` (string, required): Absolute path to the local clone.

---

## Outputs

- `py_regression_test` (object): Test file path, test node ID (`tests/path/test_x.py::test_name`), full test source, the command to run it, and the red run output showing the failure reason. Empty when `stack` is not python.

---

## Phase 1: Find Where the Test Belongs

### Entry Criteria
- `minimal_repro` reproduces on every run.
- `python -m pytest --version` prints a version.

### Actions
1. Read the pytest config in this order and record which exists: `pyproject.toml` `[tool.pytest.ini_options]`, `pytest.ini`, `setup.cfg` `[tool:pytest]`, `tox.ini` `[pytest]`. Note `testpaths`, `addopts`, `python_files`, and markers registered under `markers`.
2. Find existing tests for the failing module: `git grep -ln "<module or function from error_signature>" -- "tests/" "test/" "*_test.py" "test_*.py"`.
3. Pick the file with this rule: if a test file for that module exists, add the test there; otherwise create `tests/<package path>/test_<module>.py` following the existing directory layout. Do not create a new top-level test directory.
4. Read `conftest.py` files on the path to that test file and list the fixtures they define (`grep -n "@pytest.fixture" conftest.py`). Use an existing fixture rather than writing a new one when it builds the same object.

### Output
Chosen file and reusable fixtures.

### Quality Gate
- `python -m pytest --collect-only -q <chosen file>` runs without collection errors (or the file does not exist yet).

---

## Phase 2: Write the Test

### Entry Criteria
- File chosen.

### Actions
1. Name the test after the behavior, not the ticket: `test_<function>_<condition>_<expected>` (for example `test_read_rows_utf16_bom_decodes_header`). Put the issue reference in a one-line comment above it.
2. Build the input:
   - Small text or bytes: inline literal in the test (`data = b"\xff\xfeh\x00i\x00"`).
   - Files: write into the built-in `tmp_path` fixture (`p = tmp_path / "in.csv"; p.write_bytes(data)`), never into the repo tree.
   - Environment and time zone: `monkeypatch.setenv("TZ", "America/Los_Angeles")` plus `time.tzset()` on POSIX; `monkeypatch.setattr(module, "name", value)` for module globals.
   - Large fixtures: commit them under the existing fixtures directory (for example `tests/fixtures/`) and load via a path relative to `__file__`.
3. Write the assertion so it states the expected behavior, so it fails now and passes after the fix:

| Bug kind | Assertion |
|---|---|
| Wrong exception raised | Call the code and assert the correct result; the current exception will fail the test with a traceback |
| Should raise a specific error but does not | `with pytest.raises(ValueError, match=r"exact message regex"):` |
| Wrong value | `assert result == expected_literal` (pytest rewrites asserts to show both sides) |
| Floating point | `assert result == pytest.approx(expected, rel=<tolerance from the spec>)`; the tolerance must come from the spec or the user, not invented |
| Warning expected | `with pytest.warns(DeprecationWarning, match="..."):` |
| Hang | Use `pytest-timeout` only if installed (`pip show pytest-timeout`): `@pytest.mark.timeout(<reported wait>)`; otherwise run the call in a thread and `join(timeout=...)` then `assert not t.is_alive()` |

4. Do not use `pytest.mark.xfail` on the new test. An xfail test is green when the bug is present and turns the suite red only with `strict=True`; the chain needs a plain failing test.
5. Do not edit any file other than the chosen test file (and a new fixture file if needed).

### Output
Test source.

### Quality Gate
- `git diff --stat` lists only the test file and optional fixture files.
- The test body contains no `xfail`, `skip`, or bare `except`.

---

## Phase 3: Confirm the Red Run

### Entry Criteria
- Test written.

### Actions
1. Run only the new test: `python -m pytest "<file>::<test_name>" -x -vv -p no:cacheprovider`.
2. Read the output: the summary line must say `1 failed`. Find the `E   ` lines under the test; they must show the same exception type and message as `error_signature`, or the assert comparison with the wrong actual value from the bug report.
3. If the test fails for any other reason (`ImportError`, `fixture 'x' not found`, `NameError`, `TypeError` in the test itself), the test is wrong, not red. Fix the test and rerun.
4. Run it with the repo's configured options too (plain `python -m pytest "<node id>"`) to be sure `addopts` such as `--strict-markers` or `-W error` do not change the outcome.

### Output
`py_regression_test` with the red output pasted.

### Quality Gate
- Output contains `1 failed` and an `E   ` line matching the error signature.
- Output does not contain `error` in the summary line (`1 error` means a fixture or collection problem, not a red test).

---

## Worked Example

Illustrative only.

```python
# Regression for issue 4123: UTF-16 BOM input crashed read_rows.
def test_read_rows_utf16_bom_decodes_header(tmp_path):
    p = tmp_path / "in.csv"
    p.write_bytes("id,name\n1,a\n".encode("utf-16"))
    rows = list(read_rows(p))
    assert rows[0] == {"id": "1", "name": "a"}
```

`python -m pytest "tests/importer/test_csv_reader.py::test_read_rows_utf16_bom_decodes_header" -x -vv` prints:

```
E   UnicodeDecodeError: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
src/importer/csv_reader.py:88: UnicodeDecodeError
========================= 1 failed in 0.21s =========================
```

The `E` line matches the reported signature. Red confirmed.

---

## Exit Criteria

DONE when one new pytest test fails with the reported error signature and nothing else in the repo changed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Repo has no pytest config and uses `unittest` | **Adjust**: pytest runs `unittest.TestCase` classes; add a `TestCase` method if the file uses that style, and run it with pytest. |
| Phase 2 | Test needs network or a real database | **Adjust**: use the repo's existing fake or test container fixture; if none, isolate the pure function that misbehaves and test that. |
| Phase 3 | Test passes on unfixed code | **Stop**: the test does not exercise the bug; compare its input with `minimal_input` byte for byte. |
| Phase 3 | Weak model "fixes" the source in the same step | **Stop**: revert source changes with `git checkout -- <src files>`; this flow only produces a red test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

# Port a Shell Script to Python

**One-line description:** Replaces a shell script that outgrew shell with a Python 3 program that keeps the same CLI and exit codes: characterization tests recorded from the old script first, then `argparse`, `subprocess.run([...], check=True)` with list arguments (never `shell=True` on input), `tempfile.TemporaryDirectory`, `pathlib`, `logging` to stderr and `os.replace` for atomic writes, ending when the same tests pass against both versions.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `existing_script` (string, optional): Path to the shell script being replaced. Empty when there is no old script.
- `script_requirements` (object, required): Output of `shs-script-requirements-intake`.
- `decision_evidence` (object[], required): From `shs-real-language-decision`; names the shell weaknesses the port must fix.

---

## Outputs

- `python_port` (object): New program path, Python version floor, mapping of shell constructs to Python, characterization test file, and test results against old and new.

---

## Phase 1: Record Characterization Tests From the Old Script

### Entry Criteria
- `existing_script` exists. If empty, skip to Phase 2 and write tests from `script_requirements` instead.

### Actions
1. List observable behaviors: each option and operand, each exit code, stdout content, files created, external commands run.
2. Write pytest tests that run a program given by an environment variable, so the same test runs against old and new:

```python
# tests/test_cli.py
import os, subprocess, sys
PROG = os.environ.get("PROG", "bin/archive-logs").split()

def run(*args, **kw):
    return subprocess.run([*PROG, *args], capture_output=True, text=True, **kw)

def test_help_exits_0():
    r = run("-h")
    assert r.returncode == 0
    assert "Usage" in r.stdout

def test_unknown_option_exits_2():
    r = run("-z")
    assert r.returncode == 2
    assert r.stdout == ""

def test_archives_old_file(tmp_path):
    (tmp_path / "a.log").write_text("x\n")
    os.utime(tmp_path / "a.log", (0, 0))
    r = run("-o", str(tmp_path / "out"), str(tmp_path))
    assert r.returncode == 0
    assert (tmp_path / "out" / "a.log.gz").exists()
```

3. Run against the old script: `PROG=bin/archive-logs python -m pytest -q tests/`. Every test must pass. A failing test means the test is wrong about current behavior; fix the test, not the script, in this phase.

### Output
Characterization tests passing on the old script.

### Quality Gate
- `pytest` against the old script reports `passed` with 0 failed.
- Every exit code in the old script's usage or code has a test.

---

## Phase 2: Write the Python Program

### Entry Criteria
- Tests pass on the old script (or are written from requirements).

### Actions
1. Choose the floor: the lowest `python3 --version` on the target platforms; record it. Do not use syntax newer than that floor (for example `match` needs 3.10).
2. Map each shell construct:

| Shell | Python |
|---|---|
| `getopts` / manual loop | `argparse.ArgumentParser`; argparse exits 2 on usage errors by default, matching the bash convention |
| `set -e` and `cmd \|\| die` | `subprocess.run([...], check=True)` raises `CalledProcessError`; catch at top level and `sys.exit(code)` |
| `"$var"` quoting | pass a list of arguments; never build a command string; never `shell=True` with any input-derived value |
| `mktemp -d` + `trap cleanup EXIT` | `with tempfile.TemporaryDirectory(prefix="archive-logs-") as tmp:` |
| `log() ... >&2` | `logging.basicConfig(stream=sys.stderr, format="%(asctime)s %(levelname)s %(name)s: %(message)s")` |
| stdout data | `print(..., file=sys.stdout)` only for data |
| `mv tmp dest` atomic | `os.replace(tmp, dest)` on the same filesystem |
| `find -mtime +N` | `pathlib.Path.rglob` with `stat().st_mtime` |
| `command -v tool` | `shutil.which("tool")` |
| `trap 'exit 130' INT` | `except KeyboardInterrupt: sys.exit(130)` |
| `flock` | `fcntl.flock` (Unix only) or a lock-file library; on Windows `msvcrt.locking` |

3. Structure: `def main(argv=None) -> int:` returning the exit code, and `if __name__ == "__main__": sys.exit(main())`. Keep the same exit code table as the old script.
4. Address each `decision_evidence` item explicitly (for example JSON with the `json` module, decimals with `decimal` or `float` as the requirement states).
5. Write the program in one file first. Do not split into a package until tests pass.

### Output
Python program.

### Quality Gate
- `python3 -m py_compile <program>` exits 0.
- `grep -n 'shell=True' <program>` prints nothing, or each hit uses a constant string with no input.

---

## Phase 3: Prove Equivalence

### Entry Criteria
- Program written.

### Actions
1. Run the same tests against the new program: `PROG="python3 bin/archive_logs.py" python -m pytest -q tests/`.
2. If a test fails, change the Python program until it matches. Do NOT edit or delete characterization tests to match the new program, unless the user approves a deliberate behavior change; record each approved change.
3. Run a linter if the project uses one (`ruff check`, `python -m pyflakes`), and record the result.
4. Leave the old script in place until the user approves removal; record that in `python_port`.

### Output
`python_port`.

### Quality Gate
- The same test file passes against old and new with identical pass counts.
- Every approved behavior change is listed with the user's approval.

---

## Worked Example

Illustrative only.

```
$ PROG=bin/archive-logs python -m pytest -q tests/
...                                                       [100%]
3 passed in 0.41s
$ PROG="python3 bin/archive_logs.py" python -m pytest -q tests/
.F.                                                       [100%]
FAILED tests/test_cli.py::test_unknown_option_exits_2 - assert 1 == 2
```
The port caught `SystemExit` and returned 1; fixed to let argparse's exit 2 through.
```
$ PROG="python3 bin/archive_logs.py" python -m pytest -q tests/
3 passed in 0.52s
```

---

## Exit Criteria

DONE when the Python program passes the characterization tests that the old script passes, keeps the CLI and exit codes, and fixes each weakness in `decision_evidence`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Old script's behavior is nondeterministic (timestamps in output) | **Adjust**: assert on stable parts only and record the excluded fields. |
| Phase 2 | Target lacks Python 3 | **Return**: send back to `shs-real-language-decision`; the platform constraint changes the answer. |
| Phase 3 | Behavior differences the user wants kept | **Adjust**: record approval, then update the test with a comment naming the change. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

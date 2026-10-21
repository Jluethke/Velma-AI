# Python Characterization Tests with syrupy and Branch Coverage

**One-line description:** Pins the current behavior of the Python code you are about to refactor with syrupy snapshot tests, makes the output deterministic, and proves with coverage.py branch coverage that every line and branch of the target is executed by the new tests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `target_paths` (string[], required): Files or functions to be refactored, for example `["billing/invoice.py::parse_invoice"]`.
- `test_command` (string, required): Full suite command, for example `pytest -q`.
- `baseline_commit` (string, required): SHA from `srf-baseline-green-check`.

---

## Outputs

- `characterization_tests` (object): Test file paths, snapshot file paths (`__snapshots__/*.ambr`), the command that runs only them, and their pass count.
- `target_coverage` (object): Per target file: statements, missed lines, branches, partial branches, from `coverage report -m`.

---

## Phase 1: Find the Observable Behavior

### Entry Criteria
- `git rev-parse HEAD` equals `baseline_commit` or descends from it with no code changes.
- `pip show syrupy` and `pip show pytest-cov` succeed. If not, run `pip install syrupy pytest-cov` into the project's environment and record the versions. Do not add them to runtime dependencies; add them to the test or dev dependency group the project already uses.

### Actions
1. Open each file in `target_paths`. For each target function or method, list every observable effect: return value, raised exception type and message, mutated arguments, writes to files, log records, outgoing calls to collaborators.
2. Find existing callers: `git grep -n "parse_invoice(" -- "*.py"`. Collect 3 or more real argument shapes from the callers and from existing tests.
3. List every non-deterministic input the target reads and choose the control from this table:

| Source | Control |
|---|---|
| `datetime.now()`, `date.today()`, `time.time()` | `freezegun` (`@freeze_time("2024-01-01")`) or `monkeypatch.setattr` on the module's imported name |
| `random`, `uuid.uuid4()` | `monkeypatch.setattr(module, "uuid4", lambda: UUID(int=1))`, or `random.seed(0)` when the code uses the global generator |
| Dict or set ordering in output | Sort in the test before snapshotting; never change the target code to sort |
| Environment variables | `monkeypatch.setenv` / `monkeypatch.delenv` |
| Filesystem | `tmp_path` fixture |
| Network | Fake the collaborator at the boundary the code already has; never hit a real service |

4. Do NOT edit the target code in this flow. Characterization tests describe what the code does now, including bugs. A surprising output is recorded, not fixed.

### Output
An inventory of behaviors, inputs and non-deterministic sources per target.

### Quality Gate
- Every target has at least one listed observable effect and one listed input set.
- Every non-deterministic source has a control from the table, or is reported as an open question.

---

## Phase 2: Write the Snapshot Tests

### Entry Criteria
- Phase 1 inventory exists.

### Actions
1. Create `tests/characterization/test_<module>_characterization.py`. One test file per target module. Do not add assertions to existing test files.
2. Write one test per input set, using the `snapshot` fixture that syrupy provides:
```python
import pytest
from billing.invoice import parse_invoice

CASES = {
    "minimal": "INV-1|2024-01-01|10.00",
    "two_lines": "INV-2|2024-01-01|10.00\nLINE|a|5.00",
    "bad_total": "INV-3|2024-01-01|abc",
}

@pytest.mark.parametrize("name", sorted(CASES))
def test_parse_invoice(name, snapshot):
    try:
        result = parse_invoice(CASES[name])
    except Exception as exc:  # capture the failure behavior too
        result = {"raised": type(exc).__name__, "message": str(exc)}
    assert result == snapshot
```
3. Record snapshots once: `pytest tests/characterization -q --snapshot-update`. syrupy writes `tests/characterization/__snapshots__/test_<module>_characterization.ambr`.
4. Open the `.ambr` file and read every entry. If any entry contains a memory address (`at 0x7f...`), a timestamp, or a random id, go back to Phase 1 step 3 and add a control. Never hand-edit an `.ambr` file.
5. Run `pytest tests/characterization -q` twice without `--snapshot-update`. Both must pass. syrupy fails the run when a snapshot is unused, so a mistyped test name shows up here.

### Output
Characterization test file and `.ambr` snapshot file.

### Quality Gate
- `pytest tests/characterization -q` exits 0 twice in a row with no `--snapshot-update` flag.
- `git diff --stat` after the second run shows no change to any `.ambr` file.
- `grep -n "0x[0-9a-f]\{6,\}" tests/characterization/__snapshots__/*.ambr` prints nothing.

---

## Phase 3: Prove Coverage of the Target

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Run only the characterization tests under branch coverage:
   `pytest tests/characterization -q --cov=billing --cov-branch --cov-report=term-missing`
2. Read the row for each target file. Columns are `Stmts Miss Branch BrPart Cover Missing`. `Missing` lists uncovered line numbers and partial branches as `12->15`.
3. For every missed line or partial branch that lies inside a target function, add an input set to `CASES` that reaches it, then repeat Phase 2 steps 3 to 5 and this phase.
4. If a line cannot be reached from the public entry point (dead branch), record it in `target_coverage` as `unreachable_candidate`. Do not delete it here; `srf-py-dead-code-vulture-coverage` handles removal.
5. Mutation check: change one comparison in the target (for example `>` to `>=`), run `pytest tests/characterization -q`, confirm at least one test fails, then restore with `git checkout -- <file>` and confirm `git diff --stat` shows only test files. A safety net that does not catch a mutation is not a safety net.
6. Commit: `git add tests/characterization && git commit -m "test: characterize parse_invoice before refactor"`.

### Output
`characterization_tests`, `target_coverage`.

### Quality Gate
- The coverage `Missing` column for each target function's line range is empty, or every remaining line is listed as `unreachable_candidate`.
- The mutation in step 5 made at least one characterization test fail.
- `git diff HEAD~1 --stat` lists only files under `tests/`.

---

## Worked Example

Illustrative only. Target `billing/invoice.py::parse_invoice` (lines 10 to 48).
```
$ pytest tests/characterization -q --snapshot-update
3 passed in 0.21s
3 snapshots generated.
$ pytest tests/characterization -q --cov=billing --cov-branch --cov-report=term-missing
Name                 Stmts   Miss Branch BrPart  Cover   Missing
billing/invoice.py      31      2     12      1    91%   33-34, 29->33
```
Lines 33 to 34 handle a `LINE` row with a negative amount. Add case `"negative_line": "INV-4|2024-01-01|5.00\nLINE|b|-1.00"`, regenerate, rerun: `Missing` is empty. Mutation of `if amount < 0` to `if amount <= 0` fails `test_parse_invoice[negative_line]`. Restored, committed.

---

## Exit Criteria

DONE when every target line and branch is executed by snapshot tests that pass twice without update, a deliberate mutation is caught, and the tests are committed alone.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Target has no deterministic seam for time or randomness | **Adjust**: monkeypatch the name where the target module imported it (`billing.invoice.datetime`), not where it is defined. |
| Phase 2 | Snapshot differs between two runs | **Retry**: find the non-deterministic field in the diff syrupy prints, add a control, regenerate. |
| Phase 2 | Output object has no stable repr | **Adjust**: convert to a dict of public fields in the test before asserting. |
| Phase 3 | Branch unreachable from any input | **Return**: list it as `unreachable_candidate` for the dead code flow. |
| Phase 3 | Mutation not caught | **Retry**: add an input set that crosses the mutated boundary, then rerun the mutation. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

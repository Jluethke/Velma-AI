# Python Approval Tests over Input Combinations

**One-line description:** Locks a Python function's behavior across the full cross product of representative argument values with ApprovalTests `verify_all_combinations`, so one `.approved.txt` file records hundreds of input and output pairs and any refactoring that changes one of them fails with a readable diff.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `approval_function` (string, required): Dotted path of the function to lock, for example `billing.tax.compute_tax`.
- `input_domains` (object, required): One list of representative values per parameter, in parameter order, for example `{"amount": [0, 1, 99.99, -5], "region": ["US-CA", "US-OR", "XX"], "exempt": [true, false]}`.
- `test_command` (string, required): Full suite command.
- `characterization_tests` (object, required): Output of `srf-py-characterization-tests`; this flow adds to that safety net, it does not replace it.

---

## Outputs

- `approval_tests` (object): Test file path, `.approved.txt` path, number of combinations recorded, and the command that runs the test.

---

## Phase 1: Choose the Domains

### Entry Criteria
- `pip show approvaltests` succeeds, or the user approves `pip install approvaltests` into the dev environment.
- The function in `approval_function` imports without side effects: `python -c "import billing.tax"` exits 0.

### Actions
1. For each parameter in `input_domains`, check the list covers these classes; add missing ones and report what you added:

| Parameter kind | Values to include |
|---|---|
| Number | zero, one, a typical value, each boundary constant found in the function body (`git grep -n "<\|>\|==" billing/tax.py`), one value either side of each boundary, a negative |
| String or enum | each value the function compares against (read every `==` and `in` test), one unknown value, empty string |
| Boolean | `True`, `False` |
| Optional | `None` plus one real value |

2. Multiply list lengths. Report the product as the combination count. If the count exceeds what the user agreed to run, stop and ask which parameter lists to shorten; do not silently drop values.
3. Do NOT include values drawn from `random` or the current date. The approved file must be identical on every run.

### Output
Final `input_domains` and combination count.

### Quality Gate
- Every boundary constant in the function body has a value on each side in the domain lists.
- The combination count is reported as a number.

---

## Phase 2: Record and Approve

### Entry Criteria
- Phase 1 complete.

### Actions
1. Create `tests/approvals/test_compute_tax_approvals.py`:
```python
from approvaltests.combination_approvals import verify_all_combinations
from billing.tax import compute_tax

def safe_compute_tax(amount, region, exempt):
    try:
        return compute_tax(amount, region, exempt)
    except Exception as exc:
        return f"raised {type(exc).__name__}: {exc}"

def test_compute_tax_all_combinations():
    verify_all_combinations(
        safe_compute_tax,
        [[0, 1, 99.99, -5], ["US-CA", "US-OR", "XX", ""], [True, False]],
    )
```
2. Run `pytest tests/approvals -q`. The first run fails by design and writes `tests/approvals/test_compute_tax_approvals.test_compute_tax_all_combinations.received.txt`. ApprovalTests may try to open a diff tool; that is expected.
3. Open the `.received.txt` file. Each line has the form `args: (0, 'US-CA', True) => 0.0`. Read every line. Confirm no line contains a memory address or a timestamp.
4. Approve by renaming: `mv <name>.received.txt <name>.approved.txt`. This records current behavior, including any bugs. Do not edit lines in the approved file to "fix" values.
5. Run `pytest tests/approvals -q` twice. Both must pass and no `.received.txt` file may remain.
6. Commit: `git add tests/approvals && git commit -m "test: approval combinations for compute_tax"`. Never commit `.received.txt` files; add `*.received.*` to `.gitignore` if the project has not.

### Output
`approval_tests`.

### Quality Gate
- `pytest tests/approvals -q` exits 0 twice.
- `ls tests/approvals/*.received.txt` finds no files.
- `wc -l` on the approved file equals the combination count from Phase 1.
- Mutation check: change one boundary in `compute_tax`, run `pytest tests/approvals -q`, see a failure with a diff, restore with `git checkout -- billing/tax.py`.

---

## Worked Example

Illustrative only. `approval_function=billing.tax.compute_tax`, domains 4 x 4 x 2 = 32 combinations.
```
$ pytest tests/approvals -q
F
FAILED tests/approvals/test_compute_tax_approvals.py::test_compute_tax_all_combinations
$ head -3 tests/approvals/test_compute_tax_approvals.test_compute_tax_all_combinations.received.txt
args: (0, 'US-CA', True) => 0.0
args: (0, 'US-CA', False) => 0.0
args: (0, 'US-OR', True) => 0.0
$ mv ...received.txt ...approved.txt
$ pytest tests/approvals -q
1 passed in 0.08s
```
`wc -l` on the approved file prints `32`. Changing `if amount > 0` to `if amount >= 0` produces a diff on the `-5` and `0` rows; restored.

---

## Exit Criteria

DONE when the approved file holds one line per combination, the test passes twice, a boundary mutation is caught, and only the test and approved file are committed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Combination count too large to review | **Return**: ask the user which domain lists to shorten. |
| Phase 2 | Diff tool launch fails in a headless shell | **Adjust**: ignore the reporter error; the `.received.txt` file is still written. Check the ApprovalTests docs for a reporter setting if it blocks the run. |
| Phase 2 | Output contains unstable values | **Adjust**: use a scrubber (`create_regex_scrubber` in `approvaltests.scrubbers`, confirm the name in the installed version) passed through `options=Options().with_scrubber(...)`. |
| Phase 2 | Approved file differs between runs | **Stop**: the function is non-deterministic; record it and return to `srf-py-characterization-tests` controls. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

# Python Threshold Tests with pytest Parametrize

**One-line description:** Turns derived boundary cases into a `pytest.mark.parametrize` table with readable ids and exact hex float inputs, asserts decisions by equality, and proves the tests catch an off-by-one operator change with a manual mutation on a scratch branch.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `boundary_cases` (object[], required): Output of `detd-threshold-boundary-cases`.

---

## Outputs

- `boundary_test_file` (string): Path of the generated test file and the count of collected cases.

---

## Phase 1: Write the Table

### Entry Criteria
- Every case has `expected_decision`, or is excluded with its open question recorded in a comment.

### Actions
1. Create `tests/test_thresholds.py`. One `CASES` list of `pytest.param(float.fromhex("0x1.8p+1"), "not_triggered", id="max_lateral_accel-at")` entries. Use `float.fromhex` so the value is exact; never retype the decimal.
2. Ids follow `<limit_name>-<relation>`, so a failure names the case.
3. Test body: call the decision function with all other inputs at a nominal value from the spec, and `assert decision == expected`. Compare decisions (enums or strings) with `==`. Do not use `pytest.approx` for decisions or for the input values.
4. Sequence cases (hysteresis, debounce): a second parametrized test that steps a fresh decision object through the sequence with an injected `FakeClock` and asserts the decision after each step.
5. Special values: include `float("nan")`, `math.inf`, `-math.inf`, `-0.0`.

### Output
Test file.

### Quality Gate
- `pytest --collect-only -q tests/test_thresholds.py | tail -n 1` reports a count equal to the number of cases (plus sequences).

---

## Phase 2: Run and Report

### Entry Criteria
- Tests collect.

### Actions
1. Run `pytest -v tests/test_thresholds.py`. Each id appears with `PASSED` or `FAILED`.
2. A failing case means code disagrees with the spec. Do not change the expected value. Do not mark it `xfail` without a linked defect id in the reason: `pytest.mark.xfail(reason="DEF-123 inclusive vs strict", strict=True)`; `strict=True` makes an unexpected pass fail, so the marker is removed when the defect is fixed.

### Output
Test run log.

### Quality Gate
- The run log is saved; every failure has a defect id.

---

## Phase 3: Prove the Tests Bite

### Entry Criteria
- Tests run.

### Actions
1. `git switch -c detd-mutation-scratch`.
2. Change one comparison operator at a `code_site` from the cases (for example `>` to `>=`).
3. Run `pytest -q tests/test_thresholds.py`. The `-at` case for that limit must fail.
4. `git switch -` back and `git branch -D detd-mutation-scratch`.
5. Optionally automate with `mutmut` (check `mutmut --help` for the version's configuration keys).

### Output
`boundary_test_file` with the mutation evidence.

### Quality Gate
- The mutation run shows the expected `-at` id as FAILED.
- `git branch --list detd-mutation-scratch` prints nothing afterward.

---

## Worked Example

Illustrative only. `pytest -v tests/test_thresholds.py` prints `test_threshold[max_lateral_accel-at] FAILED` with `assert 'triggered' == 'not_triggered'`. Marked `xfail(strict=True, reason="DEF-88")`. Mutation of `max_speed` from `>` to `>=` makes `test_threshold[max_speed-at] FAILED`.

---

## Exit Criteria

DONE when every boundary case is a collected test with an exact input, failures carry defect ids, and the mutation check fails the expected case.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Decision function needs many inputs | **Adjust**: build a fixture with nominal spec values; vary only the limit input. |
| Phase 2 | Failure blamed on test | **Stop**: recheck the spec text; never edit the expectation to pass. |
| Phase 3 | Mutation not detected | **Retry**: the case does not hit that code site; trace the call and fix the test input. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

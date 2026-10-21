# TDD Red: One Failing Test

**One-line description:** Writes exactly one new test for the next behavior in Arrange-Act-Assert form, runs it alone, and proves it fails for the right reason (an assertion about the missing behavior, not a typo, import error or compile error) before any production code is written.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `behavior_list` (object[], required): Ordered behaviors; the next row with `status` "todo" is the target.
- `test_names` (object[], required): File, name and `select_command` per behavior from `tdd-test-naming`.
- `double_plan` (object[], optional): Doubles to use for collaborators, from `tdd-test-double-choice`.
- `test_runner` (string, required): One of `pytest`, `unittest`, `jest`, `vitest`, `go-test`, `cargo-test`, `junit5`.

---

## Outputs

- `failing_test` (object): `behavior_id`, `test_file`, `test_name`, the test source, and `select_command`.
- `red_evidence` (object): The exact command run, exit code, and the failure lines showing expected versus actual.

---

## Phase 1: Pick the Target and Check the Baseline

### Entry Criteria
- At least one row in `behavior_list` has `status` "todo".

### Actions
1. Take the FIRST "todo" row. Only this one. Do not write tests for later rows yet.
2. Run the full suite with the runner's suite command. Record the result.
3. If the suite is red before you start, stop: a new failing test is meaningless on a red suite.

### Output
Target behavior and a green baseline.

### Quality Gate
- Baseline suite exit code is 0 (or the runner's "no tests" code when the suite is empty: pytest 5, unittest 5 on Python 3.12+).

---

## Phase 2: Write the Test in Arrange-Act-Assert

### Entry Criteria
- Green baseline.

### Actions
1. Open (or create) `test_file` from `test_names`. Add ONE test with the exact `test_name`.
2. Lay it out in three blocks separated by a blank line:
   - Arrange: build inputs from the row's `given` and `example_input`; create doubles from `double_plan`.
   - Act: exactly one call to the unit (one line when possible).
   - Assert: check the row's `expected_output` with the runner's equality assertion.
3. Assertion forms that print both values on failure:

| test_runner | Equality | Error expected |
|---|---|---|
| pytest | `assert result == expected` | `with pytest.raises(ValueError, match="too long"):` |
| unittest | `self.assertEqual(result, expected)` | `with self.assertRaises(ValueError):` |
| jest / vitest | `expect(result).toEqual(expected)` (deep), `toBe` (identity/primitives) | `expect(() => fn()).toThrow(TooLongError)` |
| go-test | `if got != want { t.Errorf("got %v, want %v", got, want) }`; for structs and slices `cmp.Diff` from `github.com/google/go-cmp/cmp` if present, else `reflect.DeepEqual` | `if !errors.Is(err, ErrTooLong) { t.Fatalf(...) }` |
| cargo-test | `assert_eq!(result, expected);` | `assert!(matches!(result, Err(Error::TooLong)));` or `#[should_panic(expected = "...")]` for panics |
| junit5 | `assertEquals(expected, result)` (expected first) | `assertThrows(TooLongException.class, () -> ...)` |

4. Rules for the test body: no `if`, no loops (use the runner's table feature later in `tdd-triangulate`), no `try/catch` around the act, no `sleep`, no printing instead of asserting, no reading real files or network.
5. If the function or type under test does not exist yet, create the smallest stub so the test compiles or imports and then fails on its assertion:

| test_runner | Stub |
|---|---|
| pytest / unittest | `def validate(name): return None` |
| jest / vitest | `export function validate(name) { return undefined; }` |
| go-test | `func Validate(name string) Result { return Result{} }` (zero value) |
| cargo-test | `pub fn validate(name: &str) -> Result<(), Error> { Ok(()) }` (a wrong value; avoid `todo!()`, which panics instead of failing the assertion) |
| junit5 | method returning `null`, `0` or `false` |

### Output
One new test plus at most one stub.

### Quality Gate
- `git diff --stat` shows changes in at most two files: the test file and the stub file.
- The new test has exactly one act line under the arrange block (read the test).

---

## Phase 3: Run It and Read the Failure

### Entry Criteria
- Test written.

### Actions
1. Run only the new test with its `select_command`.
2. Classify the failure with this table:

| Output shows | Meaning | Action |
|---|---|---|
| `AssertionError`, `assert X == Y`, `Expected: ... Received:`, `expected ... to be ...`, `got ..., want ...`, `left: ... right: ...`, `expected: <...> but was: <...>` | correct red | record and finish |
| `ImportError`, `ModuleNotFoundError`, `Cannot find module`, `undefined: X`, `cannot find function`, `cannot find symbol` | stub missing or wrong path | fix the stub or import, rerun |
| `NameError`, `TypeError`, `ReferenceError` raised from the test file itself | test has a bug | fix the test, rerun |
| Exception raised from the stub (`NotImplementedError`, `todo!()` panic) | stub too strong | change the stub to return a wrong value, rerun |
| Test PASSES | behavior already exists, or the assertion is too weak | see Error Handling |
| `0 tests`, `no tests ran`, `filtered out` | selector wrong | fix the name, rerun |

3. Record the exact command, exit code and failure lines in `red_evidence`.
4. Do NOT write production logic in this flow. Do NOT add a second test.

### Output
`failing_test`, `red_evidence`.

### Quality Gate
- `red_evidence` exit code is nonzero and its failure lines match a row in the "correct red" category.
- The failure message contains the row's `expected_output` value.

---

## Worked Example

Illustrative only. `test_runner` = `pytest`, row B04 "rejects 21 characters".

Phase 1: `python -m pytest -q` gives `3 passed`.
Phase 2:

```python
def test_validate_username_with_21_chars_returns_too_long():
    name = "a" * 21

    result = validate_username(name)

    assert result == Invalid("too_long")
```

Phase 3:

```
$ python -m pytest tests/test_username.py::test_validate_username_with_21_chars_returns_too_long -q
E       AssertionError: assert Valid() == Invalid(reason='too_long')
1 failed in 0.04s
```

Correct red: an assertion failure naming `too_long`.

---

## Exit Criteria

DONE when exactly one new test exists for the first todo behavior, it was run alone, and it fails on an assertion that names the expected result.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Baseline suite red | **Stop**: fix or report the existing failure first; never stack a new test on red. |
| Phase 3 | New test passes immediately | **Adjust**: check the assertion compares to `expected_output`; if it does and behavior already exists, mark the row "done (pre-existing)" and return to Phase 1 with the next row. |
| Phase 3 | Failure is not an assertion | **Retry**: fix the stub or test only, up to the point the failure is an assertion. |
| Phase 3 | Temptation to also write the implementation | **Stop**: hand off to `tdd-green-minimal-code`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

# TDD Triangulate

**One-line description:** Removes faked constants by adding a second and third example that force the general rule, then folds the examples into the runner's table-driven form (pytest parametrize, subTest, test.each, Go table tests, rstest, JUnit ParameterizedTest).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `behavior_list` (object[], required): Ordered behaviors with examples.
- `production_change` (object, required): From `tdd-green-minimal-code`, including the strategy used.
- `test_runner` (string, required): One of `pytest`, `unittest`, `jest`, `vitest`, `go-test`, `cargo-test`, `junit5`.

---

## Outputs

- `generalized_change` (object): Final production diff with no remaining faked constants for this behavior, plus suite evidence.
- `parametrized_tests` (object): The table-driven test (file, name, case list) and its run output.

---

## Phase 1: Detect a Fake

### Entry Criteria
- Full suite green.

### Actions
1. Look at the production code from `production_change`. It is a fake if any line returns or compares against a literal that equals a test's expected value (for example `return 5` while the test expects 5) and no rule produces it.
2. If `production_change.strategy` is `obvious` and no fake is found, skip to Phase 3.

### Output
Fake present or not.

### Quality Gate
- Every literal in the changed production lines is classified as "rule constant from the requirement" or "fake".

---

## Phase 2: Add Examples Until the Fake Breaks

### Entry Criteria
- A fake exists.

### Actions
1. Pick a second example for the same behavior with a DIFFERENT expected value (use the row's example or a plain variation: one item priced 5 becomes one item priced 7).
2. Write it as a new test (red rules apply: run it alone, see an assertion failure).
3. Replace the fake with the general rule. Run the full suite; it must be green.
4. If the rule still has a suspicious branch (for example only works for one item), add a third example from a different ZOMBIES category (Many after One). Stop at the first example that passes without a production change; it confirms the rule.
5. Do not add examples that are copies of existing ones with different numbers but the same path through the code. Each example must be able to fail against some plausible wrong implementation.

### Output
General rule in place, two or more examples.

### Quality Gate
- Rerunning the Phase 1 check finds no fake literal.
- Full suite exit code 0.

---

## Phase 3: Fold Into a Table

### Entry Criteria
- Two or more tests check the same behavior with different data.

### Actions
1. Convert them into one table-driven test. Every case gets a readable id:

| test_runner | Table form |
|---|---|
| pytest | `@pytest.mark.parametrize(("items", "expected"), [pytest.param([], 0, id="empty"), pytest.param([5], 5, id="one"), pytest.param([5, 7], 12, id="many")])` |
| unittest | loop over cases with `with self.subTest(case=name):` inside one test method |
| jest | `test.each([{ items: [], expected: 0 }, ...])('total of $items is $expected', ({ items, expected }) => {...})` |
| vitest | `test.each([...])('...', ...)` same as Jest (also `it.each`) |
| go-test | `tests := []struct{ name string; items []Item; want int }{...}` and `for _, tt := range tests { t.Run(tt.name, func(t *testing.T) {...}) }` |
| cargo-test | `rstest` crate: `#[rstest] #[case::empty(vec![], 0)] #[case::one(vec![5], 5)] fn total_cases(#[case] items: Vec<u32>, #[case] expected: u32)`; without rstest, keep separate `#[test]` functions |
| junit5 | `@ParameterizedTest(name = "{0} -> {1}")` with `@CsvSource({"'', 0", "5, 5"})` or `@MethodSource("cases")` (needs `junit-jupiter-params`, included in `junit-jupiter`) |

2. Count cases before and after: the table must hold every example from the separate tests. Then delete the separate tests that the table now covers.
3. Run the table test and confirm the runner reports each case separately (pytest shows `[empty]`, Go shows `--- PASS: TestTotal/empty`, Jest shows each title).
4. Mutation check of the table: temporarily change one expected value in the table, run, confirm exactly one case fails, then change it back.

### Output
`parametrized_tests`, `generalized_change`.

### Quality Gate
- Case count in the table equals the number of separate tests removed.
- The temporary wrong-value run failed exactly one case, and the final run is green (`git diff` shows the value restored).

---

## Worked Example

Illustrative only. `test_runner` = `pytest`. Production: `def shipping(weight_kg): return 4.99` after the first test (weight 1 kg costs 4.99). The requirement table: up to 2 kg 4.99, over 2 kg 9.99.

Phase 1: `return 4.99` is a rule constant (it is in the requirement), but the function ignores weight, so the over-2-kg behavior is missing. A test for 3 kg is added.
Phase 2: `python -m pytest -k shipping -q` shows `assert 4.99 == 9.99`; rule becomes `return 4.99 if weight_kg <= 2 else 9.99`; boundary example 2 kg and 2.01 kg added.
Phase 3:

```python
@pytest.mark.parametrize(("weight", "expected"), [
    pytest.param(1, 4.99, id="light"),
    pytest.param(2, 4.99, id="at_limit"),
    pytest.param(2.01, 9.99, id="just_over"),
    pytest.param(3, 9.99, id="heavy"),
])
def test_shipping_cost_by_weight(weight, expected):
    assert shipping(weight) == expected
```

`python -m pytest -k shipping -v` lists `test_shipping_cost_by_weight[light] PASSED` and three more.

---

## Exit Criteria

DONE when no faked constant remains for the behavior, the examples are in one table test with named cases, and a deliberate wrong value in the table was caught.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | New example passes without code change at the first try | **Adjust**: it confirms the rule; keep it only if it covers a new ZOMBIES category. |
| Phase 2 | Requirement gives no second value | **Return**: add an open question; keep the fake marked with a comment naming the question. |
| Phase 3 | `rstest` or params library not available | **Adjust**: keep separate named tests. |
| Phase 3 | Wrong-value check fails zero or several cases | **Stop**: the table is not wired to the assertion; fix before continuing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

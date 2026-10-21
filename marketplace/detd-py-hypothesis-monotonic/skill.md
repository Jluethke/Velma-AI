# Python Monotonic Property Tests with Hypothesis

**One-line description:** Writes Hypothesis property tests asserting that the decision is monotonic in each hazard input (more hazard never yields a more permissive decision), repeatable within a process, and latching where the spec says so, with a derandomized CI profile, explicit `@example` boundary cases and the falsifying-example workflow.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `limit_spec` (object[], required): Limits and their direction (which way is more hazardous).
- `decision_entrypoint` (string, required): The function under test.

---

## Outputs

- `property_tests` (string[]): Test node ids and the property each checks.

---

## Phase 1: State the Properties

### Entry Criteria
- `pip show hypothesis` prints a version.
- The decision output has a defined order of permissiveness (for example `stop < hold < limited < normal`). If not, define it from the spec; if the spec does not define it, record an open question and stop.

### Actions
1. For each hazard input h (for example obstacle closing speed), write the property: for x1 <= x2, `rank(decide(h=x2, rest)) <= rank(decide(h=x1, rest))`.
2. For each input where more is safer (for example distance), the reversed inequality.
3. Repeatability: `decide(x) == decide(x)` for two fresh decision objects with the same injected clock and seed.
4. Latching (if the spec says a state holds until a reset condition): a stateful test where, after entering the state, no input sequence without the reset condition leaves it.
5. Write each property in one sentence with its spec reference.

### Output
Property list.

### Quality Gate
- Every property cites a spec section.

---

## Phase 2: Implement

### Entry Criteria
- Properties listed.

### Actions
1. Strategy for floats: `st.floats(min_value=lo, max_value=hi, allow_nan=False, allow_infinity=False)` with lo and hi from the input's specified range. NaN and infinity are covered by the boundary case tests, not here.
2. Monotonic test: draw two values, order them with `x1, x2 = sorted((a, b))`, call the decision with all other inputs drawn from their own strategies (the same `rest` for both calls), and assert the rank inequality.
3. Add `@example(...)` decorators with the `at` and adjacent values from boundary cases so the edges are always tried.
4. Latching: `hypothesis.stateful.RuleBasedStateMachine` with `@rule` methods for each input change and an `@invariant` checking the latch.
5. Profiles in `conftest.py`: `settings.register_profile("ci", derandomize=True, database=None, print_blob=True)` and `settings.load_profile(os.getenv("HYPOTHESIS_PROFILE", "default"))`. `derandomize=True` makes the CI run the same examples every time. `max_examples` defaults to 100 in Hypothesis; raise it only via a recorded user decision.

### Output
Test file.

### Quality Gate
- `HYPOTHESIS_PROFILE=ci pytest -q tests/test_properties.py` passes twice with the same output.

---

## Phase 3: Handle Failures and Prove the Tests Bite

### Entry Criteria
- Tests run.

### Actions
1. On failure Hypothesis prints `Falsifying example: test_name(a=..., b=...)` with the shrunk minimal input, and with `print_blob=True` a `@reproduce_failure(...)` line. Copy the falsifying example as a permanent `@example` and file a defect; never delete the property.
2. Mutation check on a scratch branch: invert one comparison inside the decision so that a larger hazard gives a more permissive result in some range; run the tests; confirm a falsifying example is printed; delete the branch.
3. Note: Hypothesis keeps found failures in `.hypothesis/`; the `ci` profile disables the database, so add found failures as `@example` instead of relying on it.

### Output
`property_tests`.

### Quality Gate
- The mutation run prints `Falsifying example`.
- Each real failure has an `@example` and a defect id.

---

## Worked Example

Illustrative only. Property: closing speed monotonic. Run prints `Falsifying example: test_closing_speed_monotonic(a=12.5, b=12.500000000000002, gap=30.0)`: at 12.5 the decision is `hold`, just above it is `limited`. Cause: two limits checked in the wrong order. `@example(a=12.5, b=12.500000000000002, gap=30.0)` added; defect filed.

---

## Exit Criteria

DONE when each spec-backed property is a passing or defect-linked test, CI uses the derandomized profile, and the mutation check produces a falsifying example.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No permissiveness order exists | **Stop**: the property cannot be stated; record the open question. |
| Phase 2 | `HealthCheck.filter_too_much` | **Adjust**: build inputs directly in range instead of using `assume()` heavily. |
| Phase 3 | Failure only appears in non-CI runs | **Adjust**: copy the printed falsifying example into `@example` so CI runs it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

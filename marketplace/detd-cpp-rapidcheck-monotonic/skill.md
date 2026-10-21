# C++ Monotonic Property Tests with RapidCheck

**One-line description:** Writes RapidCheck property tests through its GoogleTest integration (`RC_GTEST_PROP`) asserting monotonic decisions in each hazard input and repeatability, with finite-input preconditions, fixed seeds in CI through the `RC_PARAMS` environment variable, and the printed reproduce string workflow for failures.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `limit_spec` (object[], required): Limits and their hazard direction.
- `decision_entrypoint` (string, required): The C++ function under test.

---

## Outputs

- `property_tests` (string[]): Test names and the property each checks.

---

## Phase 1: Integrate RapidCheck

### Entry Criteria
- GoogleTest builds in the project.
- A permissiveness order for decisions is defined in the spec (else record an open question and stop).

### Actions
1. Add RapidCheck as a subdirectory or `FetchContent` and enable its GoogleTest extra: `set(RC_ENABLE_GTEST ON CACHE BOOL "" FORCE)` before `add_subdirectory(rapidcheck)`; link the test target with `rapidcheck` and `rapidcheck_gtest`. Check the RapidCheck README for the exact target names in your checkout.
2. Include `<rapidcheck/gtest.h>`.
3. Build the test with the decision's float flags (`-ffp-contract=off`).

### Output
Build integration.

### Quality Gate
- A trivial `RC_GTEST_PROP(Smoke, Reverse, (std::vector<int> v)) { auto r = v; std::reverse(r.begin(), r.end()); std::reverse(r.begin(), r.end()); RC_ASSERT(r == v); }` passes.

---

## Phase 2: Write the Properties

### Entry Criteria
- Integration works.

### Actions
1. Monotonic: `RC_GTEST_PROP(Monotonic, ClosingSpeed, (double a, double b, double gap)) { RC_PRE(std::isfinite(a) && std::isfinite(b) && std::isfinite(gap)); ... }`. Arbitrary doubles include NaN and infinity, so preconditions are required; but many rejected cases slow the test, so prefer generating in range: `const auto a = *rc::gen::map(rc::gen::inRange<std::int64_t>(lo_i, hi_i), to_double);` where the integer grid and its mapping are documented, or a custom generator.
2. Order the two values: `if (a > b) std::swap(a, b);` then `RC_ASSERT(rank(decide(b, gap)) <= rank(decide(a, gap)));`.
3. Repeatability: two fresh decision objects with the same fake clock and seed produce byte-equal serialized output.
4. Boundary values: add plain `TEST` cases for the `at` and adjacent values; property tests are random and may never hit them.

### Output
Property tests.

### Quality Gate
- `ctest -R Monotonic --output-on-failure` passes.

---

## Phase 3: Fixed Seeds, Failures and Mutation Check

### Entry Criteria
- Properties pass.

### Actions
1. In CI set `RC_PARAMS="seed=<seed>"` (seed is a recorded configuration value) so runs are repeatable; `max_success` defaults to 100 in RapidCheck; change it only by recorded decision.
2. On failure RapidCheck prints the shrunk counterexample and a line with `reproduce=...`; rerun with `RC_PARAMS="reproduce=<string>"` to replay exactly that case. Copy the counterexample into a plain `TEST` so it stays in the suite.
3. Mutation check on a scratch branch: invert one comparison in the decision; run; confirm `Falsifiable after` is printed; delete the branch.

### Output
`property_tests`.

### Quality Gate
- Two CI-mode runs print the same seed and the same result.
- The mutation run prints a counterexample.

---

## Worked Example

Illustrative only. `RC_PARAMS="seed=42" ./build/tests/props --gtest_filter='Monotonic.*'` prints `[       OK ] Monotonic.ClosingSpeed`. Mutated build prints `Falsifiable after 37 tests and 12 shrinks` and the counterexample `(12.5, 12.500000000000002, 30.0)`, plus a `reproduce=` string.

---

## Exit Criteria

DONE when each spec-backed monotonic property runs under a fixed CI seed, counterexamples are kept as plain tests, and the mutation check fails.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `rapidcheck_gtest` target missing | **Adjust**: confirm `RC_ENABLE_GTEST` is set before `add_subdirectory`. |
| Phase 2 | Too many discarded cases | **Adjust**: generate within range instead of `RC_PRE`. |
| Phase 3 | Counterexample does not reproduce | **Stop**: remaining nondeterminism in the decision; run `detd-double-run-check`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

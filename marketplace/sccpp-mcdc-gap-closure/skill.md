# MC/DC and Branch Coverage Gap Closure

**One-line description:** Takes the uncovered branches and MC/DC conditions from gcov or llvm-cov, decides for each with a fixed table whether a requirements-based test is missing, a requirement is missing, or the code is unreachable, designs the minimum unique-cause or masking test vectors, and reports remaining gaps against the user's coverage target.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `requirements` (object[], required): Software unit requirements with IDs.
- `gcov_coverage` (object, optional): From `sccpp-gcc-gcov-coverage`; empty when the GCC path was not used.
- `llvm_coverage` (object, optional): From `sccpp-llvm-cov-coverage`; empty when the Clang path was not used.
- `coverage_target` (object, required): Coverage metrics and levels the project requires per module (for example "MC/DC 100 percent for modules X, Y"), with their source (the project's verification plan, which derives them from the applicable standard such as the structural coverage table in ISO 26262-6:2018 for the assigned ASIL). This flow never sets the target.

---

## Outputs

- `mcdc_test_cases` (object[]): New test vectors per decision: condition values, expected decision outcome, the independence pair each closes, and the requirement ID the test traces to.
- `coverage_gaps` (object[]): Items still uncovered after closure, each with a class (missing requirement, unreachable or defensive code, tool limitation) and justification, plus the final measured percentages against `coverage_target`.

---

## Phase 1: Classify Each Uncovered Item

### Entry Criteria
- At least one of `gcov_coverage` or `llvm_coverage` is present.
- `coverage_target` states each metric with a source.

### Actions
1. Merge the uncovered lists. For each item open the decision in source and the requirement(s) for that function.
2. Classify, first matching row wins:

| Condition | Class | Action |
|---|---|---|
| A requirement specifies behavior for the uncovered outcome but no test exercises it | missing test | Design test vectors (Phase 2) |
| The code implements behavior no requirement describes | missing requirement | Report to requirement owner; do not write an untraced test |
| The outcome cannot occur given types and earlier checks (for example `default:` of a switch over a fully handled enum required by MISRA C:2012 Rule 16.4) | defensive or unreachable | Justify with the reason; a fault injection test may still reach it through a stub or a corrupted input |
| The tool counts compiler-generated branches with no source decision | tool limitation | Justify with the gcov or llvm-cov output |

3. Never delete code only because it is uncovered. Dead code removal is a code change reviewed on its own.

### Output
Classified uncovered list.

### Quality Gate
- Every uncovered item has exactly one class.
- Every "missing requirement" item names the function and the behavior with no requirement.

---

## Phase 2: Design MC/DC Vectors

### Entry Criteria
- Classified list exists.

### Actions
1. For each decision with N conditions, write its truth table with the executed vectors from the coverage output marked.
2. For each condition without an independence pair, find a vector that differs from an executed vector only in that condition (unique-cause MC/DC) and flips the decision outcome. With short-circuit `&&` and `||`, conditions not evaluated are "don't care"; masking MC/DC accepts pairs where other conditions change but are masked. Record which form the project's verification plan requires; if it is not stated, record an open question.
3. A minimum set for N independent conditions is N+1 vectors; coupled conditions (the same variable in two conditions) may make some pairs impossible; record those as "coupled, not achievable" with the reason.
4. For each vector, choose input values that produce the condition values through the function's real inputs, and write the expected outcome from the requirement.
5. Write tests in the project framework (Unity for C, GoogleTest for C++) named with the requirement ID.

### Output
`mcdc_test_cases` with test code.

### Quality Gate
- Every new vector names the requirement it traces to and the independence pair it closes.
- New tests pass: `test_command` from the coverage profile exits 0.

---

## Phase 3: Remeasure and Report

### Entry Criteria
- New tests added.

### Actions
1. Rerun the coverage flow used before (gcov or llvm-cov) from a clean counter state.
2. Compare each metric per module with `coverage_target`.
3. Emit `coverage_gaps` with every item still uncovered and its justification, and the measured percentages. State plainly whether each target is met by the numbers; do not round up.

### Output
`mcdc_test_cases`, `coverage_gaps`.

### Quality Gate
- Final percentages come from the rerun report, quoted with the command.
- Every item in `coverage_gaps` has a class and justification; none is class "missing test".

---

## Worked Example

Illustrative only. Decision `if ((raw > WSS_RAW_MAX) || (sensor_fault != 0u))` with C2 not covered. Executed: `{F,F}=F`, `{T,-}=T`.

Needed: `{F,T}=T`, which pairs with `{F,F}=F` to show C2 independently flips the outcome. Input: raw = 1000 (in range), stub sets `sensor_fault = 1`. Requirement REQ-WSS-015 says a sensor fault reports `WSS_ERR_SENSOR`. Test `test_REQ_WSS_015_fault_with_valid_raw_reports_sensor_error` added. Rerun with llvm-cov: decision MC/DC 100.00 percent. Remaining gap: `default:` in `wss_state_step` classed defensive, reached by a fault injection test that corrupts the state variable.

---

## Exit Criteria

DONE when every uncovered item is closed by a traced test or justified in `coverage_gaps`, and the remeasured numbers are compared with `coverage_target` without rounding.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `coverage_target` has no source | **Stop**: the target must come from the project's verification plan; ask the user. |
| Phase 1 | Uncovered code has no requirement | **Return**: report to the requirement owner as missing requirement. |
| Phase 2 | Pair impossible because conditions are coupled | **Adjust**: record "coupled, not achievable" or consider masking MC/DC if the plan allows it. |
| Phase 3 | Coverage did not rise after new tests | **Retry**: clean counters (`.gcda` or `.profraw`) and confirm the new tests are in `test_command`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.

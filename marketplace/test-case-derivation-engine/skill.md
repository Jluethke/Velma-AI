# Test Case Derivation Engine

Derive test cases systematically from requirements using equivalence partitioning, boundary value analysis, and decision table techniques.

## Inputs

- `vv-strategy-document`: V&V plan identifying which requirements are verified by test
- `requirements-baseline`: Requirements with numerical thresholds and conditions

## Outputs

- `test-case-suite`: Complete test case set with preconditions, steps, expected results, and pass/fail criteria
- `test-coverage-analysis`: Coverage metrics: requirement coverage, boundary coverage, decision coverage

## Process

1. For each testable requirement, identify the input domain (all valid and invalid input combinations) and partition into equivalence classes: ranges of inputs that the system should handle identically. Select one representative test case per equivalence class.
2. For numerical requirements, apply boundary value analysis: test at the boundary value, one increment below, and one increment above. For a requirement 'system shall respond within 100ms', test at 99ms (pass), 100ms (pass), and 101ms (fail).
3. For requirements with multiple conditions, build a decision table: columns are condition combinations, rows are expected actions. Each column becomes a test case. Reduce the table by identifying 'don't care' conditions that do not affect the outcome.
4. Compute coverage metrics: requirement coverage = requirements with at least one test case / total requirements. For structural coverage (if code is available): statement coverage, branch coverage, MC/DC for safety-critical software per DO-178C.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.

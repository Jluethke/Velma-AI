# Constrained Random Verification

Configure and run constrained random testing to achieve broad coverage of the design's input space, with intelligent constraints that prevent illegal stimuli while maximizing useful coverage.

## Inputs

- `testbench-rtl`: Complete testbench with driver, monitor, scoreboard, and coverage
- `testbench-architecture-doc`: Testbench structure documentation

## Outputs

- `random-test-results`: Coverage achieved vs target, list of cover points still missing, and any assertion violations or scoreboard mismatches found
- `regression-suite`: Set of random seeds that together achieve the target coverage, plus any directed tests needed for unreachable random cover points

## Process

1. Define constraints on random transactions. Constraints restrict the random generator to legal inputs: valid address ranges, legal packet sizes, valid command codes, and protocol-required sequencing (e.g., must configure before sending data). Over-constraining reduces coverage; under-constraining wastes cycles on illegal inputs that cause false failures.
2. Run initial random tests with a small number of long-running seeds. Each seed produces a unique random sequence. Run each for enough cycles to exercise the main functionality. Check coverage after each run.
3. Analyze coverage holes. Identify cover points that no random seed has hit. Common causes: (a) the random distribution is unlikely to produce the required condition (e.g., simultaneous overflow and error), (b) constraints prevent the condition, (c) the condition requires a specific sequence that random generation will not produce in reasonable time.
4. For coverage holes, add targeted constraints or coverage-driven seed selection. A 'coverage closure' constraint biases the random generator toward uncovered conditions. Alternatively, write a directed test for the specific scenario and add it to the regression suite.
5. Run regression: a set of random seeds that collectively achieve the coverage target. Record each seed, its coverage contribution, and its pass/fail status. The regression suite is the reproducible evidence of verification completeness.
6. Set up nightly regression. Random seeds should be run regularly as the design evolves. New RTL changes may introduce bugs that only specific random sequences expose. Track coverage trends over time: coverage should increase monotonically as new tests are added and never decrease unless a feature is removed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
